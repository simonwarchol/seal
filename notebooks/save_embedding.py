import numpy as np
import pandas as pd
import zarr
from scipy.spatial import cKDTree
from tqdm import tqdm
import tifffile
from loguru import logger
import math
import tempfile
import shutil

# Constants and file paths
TILE_SIZE = 1024
DOWNSCALE_FACTOR = 2
MAX_PYRAMID_IMG_SIZE = 1024

# File paths (consider moving these to a config file or passing as arguments)
SEGMENTATION_PATH = "/Users/swarchol/Research/exemplar-001/segmentation/unmicst-exemplar-001/nuclei.ome.tif"
SEGMENTATION_PATH = "/Volumes/Simon/Greg/WD-76845-097_mask_pyr.ome.tif"
CSV_PATH = "/Users/swarchol/Research/exemplar-001/quantification/exemplar-001--unmicst_cell_umap_7_22.csv"
CSV_PATH = "/Volumes/Simon/Greg/for_simon.parquet"
IMAGE_PATH = "/Users/swarchol/Research/exemplar-001/registration/exemplar-001.ome.tif"
IMAGE_PATH = "/Volumes/Simon/Greg/WD-76845-097.ome.tif"
CUT_SEG_CELLS_PATH = "/Users/swarchol/Research/exemplar-001/cellcutter/cut_mask"
CUT_SEG_CELLS_PATH = "/Volumes/Simon/Greg/masks"
CUT_CELLS_PATH = "/Users/swarchol/Research/exemplar-001/cellcutter/cut"
CUT_CELLS_PATH = "/Volumes/Simon/Greg/combined"
OUTPUT_TIFF_PATH = "/Users/swarchol/Research/exemplar-001/tiled.ome.tif"
OUTPUT_TIFF_PATH = "/Volumes/Simon/Greg/oct15/tiled.ome.tif"
OUTPUT_SEGMENTATION_PATH = "/Volumes/Simon/Greg/oct15/tiled-mask.ome.tif"
IM_STORE = zarr.DirectoryStore("/Users/swarchol/Research/temp/im")
SEG_STORE = zarr.DirectoryStore("/Users/swarchol/Research/temp/seg")


def get_points_in_rect(kdtree, rect_points):
    center = np.mean(rect_points, axis=1)
    y_range, x_range = rect_points
    x_range = np.sort(x_range)
    y_range = np.sort(y_range)
    nearest_neighbor = kdtree.query(center, k=1)[1]
    nearest_neighbor_location = kdtree.data[nearest_neighbor].flatten()
    if (
        nearest_neighbor_location[1] < x_range[0]
        or nearest_neighbor_location[1] > x_range[1]
    ):
        return None
    if (
        nearest_neighbor_location[0] < y_range[0]
        or nearest_neighbor_location[0] > y_range[1]
    ):
        return None

    return nearest_neighbor


def create_tiled_zarr(im_zarr_tiled, cut_cells, tree, csv_df, is_segmentation=False, embedding=None):
    for z in range(len(im_zarr_tiled)):
        height, width = im_zarr_tiled[z].shape[-2:]
        scale_factor = 2**z

        # Pre-allocate the entire level
        if is_segmentation:
            level_data = zarr.zeros((height, width), dtype=np.uint16)
        else:
            level_data = zarr.zeros(
                (im_zarr_tiled[z].shape[0], height, width), dtype=np.uint16
            )

        for y in tqdm(range(0, height, TILE_SIZE)):
            for x in range(0, width, TILE_SIZE):
                tile_height = min(TILE_SIZE, height - y)
                tile_width = min(TILE_SIZE, width - x)

                x_tiles = tile_width // cut_cells.shape[-1]
                y_tiles = tile_height // cut_cells.shape[-1]

                for i in range(x_tiles):
                    for j in range(y_tiles):
                        image_y_range = [
                            (x + int((i / x_tiles) * tile_width)) * scale_factor,
                            (x + int(((i + 1) / x_tiles) * tile_width)) * scale_factor,
                        ]
                        image_x_range = [
                            (y + int((j / y_tiles) * tile_height)) * scale_factor,
                            (y + int(((j + 1) / y_tiles) * tile_height)) * scale_factor,
                        ]

                        if (
                            image_x_range[0] >= im_zarr_tiled[0].shape[-2]
                            or image_y_range[0] >= im_zarr_tiled[0].shape[-1]
                        ):
                            continue

                        point = get_points_in_rect(tree, [image_y_range, image_x_range])
                        if point is not None:
                            sub_tile_x_range = [
                                x + int((i / x_tiles) * tile_width),
                                x + int(((i + 1) / x_tiles) * tile_width),
                            ]
                            sub_tile_y_range = [
                                y + int((j / y_tiles) * tile_height),
                                y + int(((j + 1) / y_tiles) * tile_height),
                            ]

                            if is_segmentation:
                                data = cut_cells[point] * (point + 1)
                                level_data[
                                    sub_tile_y_range[0] : sub_tile_y_range[0]
                                    + data.shape[0],
                                    sub_tile_x_range[0] : sub_tile_x_range[0]
                                    + data.shape[1],
                                ] = data
                            else:
                                data = cut_cells[:, point]
                                level_data[
                                    :,
                                    sub_tile_y_range[0] : sub_tile_y_range[0]
                                    + data.shape[1],
                                    sub_tile_x_range[0] : sub_tile_x_range[0]
                                    + data.shape[2],
                                ] = data

        # Assign the entire level at once
        im_zarr_tiled[z] = level_data

    return im_zarr_tiled


class PyramidSetting:
    def __init__(
        self,
        downscale_factor=DOWNSCALE_FACTOR,
        tile_size=TILE_SIZE,
        max_pyramid_img_size=MAX_PYRAMID_IMG_SIZE,
    ):
        self.downscale_factor = downscale_factor
        self.tile_size = tile_size
        self.max_pyramid_img_size = max_pyramid_img_size

    def pyramid_shapes(self, base_shape):
        num_levels = self.num_levels(base_shape)
        factors = self.downscale_factor ** np.arange(num_levels)
        shapes = np.ceil(np.array(base_shape) / factors[:, None])
        return [tuple(map(int, s)) for s in shapes]

    def num_levels(self, base_shape):
        factor = max(base_shape) / self.max_pyramid_img_size
        return math.ceil(math.log(factor, self.downscale_factor)) + 1


def write_ome_tiff_from_zarr(
    input_tiff_path,
    zarr_group,
    output_path,
    pixel_size=1,
    channel_names=None,
    verbose=True,
    downscale_factor=DOWNSCALE_FACTOR,
    compression=None,
    is_mask=False,
    tile_size=TILE_SIZE,
    kwargs_tifffile=None,
):
    # Load the input OME-TIFF to extract metadata
    with tifffile.TiffFile(input_tiff_path) as tif:
        ome_metadata = tif.ome_metadata  # Get OME metadata
        pixel_size_x = (
            tif.pages[0].tags["XResolution"].value[1]
            / tif.pages[0].tags["XResolution"].value[0]
        )
        pixel_size_y = (
            tif.pages[0].tags["YResolution"].value[1]
            / tif.pages[0].tags["YResolution"].value[0]
        )
        base_shape = zarr_group[0].shape
        num_channels = 1 if len(base_shape) == 2 else base_shape[0]

    # Use PyramidSetting to calculate the number of levels and shapes for each level
    pyramid_setting = PyramidSetting(downscale_factor=downscale_factor)
    shapes = pyramid_setting.pyramid_shapes(
        base_shape[-2:]
    )  # Use last two dimensions for height and width

    # Extract number of pyramid levels from zarr group
    num_levels = len(shapes)

    # Metadata for the OME-TIFF file
    metadata = {
        "Pixels": {
            "PhysicalSizeX": pixel_size_x,
            "PhysicalSizeXUnit": "\u00b5m",
            "PhysicalSizeY": pixel_size_y,
            "PhysicalSizeYUnit": "\u00b5m",
        },
    }
    if channel_names:
        metadata["Channel"] = {"Name": channel_names}

    dtype = zarr_group[0].dtype
    software = f"OME-TIFF Pyramid Writer"
    if kwargs_tifffile is None:
        kwargs_tifffile = {}

    logger.info(f"Writing OME-TIFF to {output_path}")

    # Create OME-TIFF with pyramidal levels from Zarr data
    with tifffile.TiffWriter(output_path, bigtiff=True) as tif:
        # Write base level (highest resolution) from the Zarr array
        for level in tqdm(range(num_levels)):
            level_shape = shapes[level]
            logger.info(
                f"    Writing pyramid level {level} with shape {level_shape} and tile size {tile_size}"
            )
            if num_channels == 1:
                tif.write(
                    data=tile_from_zarr(zarr_group[level], tile_size),
                    shape=level_shape,
                    subifds=(
                        num_levels - 1 if level == 0 else 0
                    ),  # subifds for pyramid levels
                    dtype=dtype,
                    tile=(tile_size, tile_size),
                    metadata=metadata if level == 0 else None,
                    software=software if level == 0 else None,
                    compression=compression,
                    **kwargs_tifffile,
                )
            else:
                tif.write(
                    data=tile_from_zarr(zarr_group[level], tile_size),
                    shape=(num_channels, *level_shape),
                    subifds=(
                        num_levels - 1 if level == 0 else 0
                    ),  # subifds for pyramid levels
                    dtype=dtype,
                    tile=(tile_size, tile_size),
                    metadata=metadata if level == 0 else None,
                    software=software if level == 0 else None,
                    compression=compression,
                    **kwargs_tifffile,
                )
        logger.info(f"OME-TIFF saved to {output_path}")


def tile_from_zarr(zarr_array, tile_size):
    if zarr_array.ndim == 3:  # Multi-channel case
        num_channels, height, width = zarr_array.shape
        for c in tqdm(range(num_channels)):
            for y in tqdm(range(0, height, tile_size)):
                for x in range(0, width, tile_size):
                    yield zarr_array[c, y : y + tile_size, x : x + tile_size]
    else:  # Single-channel case
        height, width = zarr_array.shape
        for y in range(0, height, tile_size):
            for x in range(0, width, tile_size):
                yield zarr_array[y : y + tile_size, x : x + tile_size]


if __name__ == "__main__":
    # Load data
    imgio = tifffile.TiffFile(IMAGE_PATH, is_ome=False)
    im_zarr = zarr.open(imgio.series[0].aszarr())

    segio = tifffile.TiffFile(SEGMENTATION_PATH, is_ome=False)
    seg_zarr = zarr.open(segio.series[0].aszarr())

    # Create temporary directories for Zarr stores

    zarr.convenience.copy_store(im_zarr.store, IM_STORE, if_exists="replace")
    zarr.convenience.copy_store(seg_zarr.store, SEG_STORE, if_exists="replace")

    im_zarr_tiled = zarr.open(IM_STORE)
    seg_zarr_tiled = zarr.open(SEG_STORE)

    # if .parquet file is used, use pd.read_parquet instead
    if CSV_PATH.endswith(".parquet"):
        csv_df = pd.read_parquet(CSV_PATH)
    else:
        csv_df = pd.read_csv(CSV_PATH)
    try:
        embedding = csv_df[["UMAP_X", "UMAP_Y"]].values
    except:
        embedding = csv_df[["emb1", "emb2"]].values

    embedding[:, 0] -= embedding[:, 0].min()
    embedding[:, 1] -= embedding[:, 1].min()
    embedding[:, 0] = embedding[:, 0] / embedding[:, 0].max()
    embedding[:, 1] = embedding[:, 1] / embedding[:, 1].max()
    embedding[:, 0] = embedding[:, 0] * im_zarr_tiled[0].shape[-1]
    embedding[:, 1] = embedding[:, 1] * im_zarr_tiled[0].shape[-2]
    tree = cKDTree(embedding)
    # print(im_zarr_tiled[0].shape[-2:])

    # Load cut cells
    cut_seg_cells = zarr.open(CUT_SEG_CELLS_PATH)
    cut_cells = zarr.open(CUT_CELLS_PATH)

    # Process segmentation
    seg_zarr_tiled = create_tiled_zarr(
        seg_zarr_tiled, cut_seg_cells, tree, csv_df, is_segmentation=True, embedding=embedding
    )
    write_ome_tiff_from_zarr(
        SEGMENTATION_PATH, seg_zarr_tiled, OUTPUT_SEGMENTATION_PATH, is_mask=True
    )

    # Process image
    im_zarr_tiled = create_tiled_zarr(im_zarr_tiled, cut_cells, tree, csv_df)
    write_ome_tiff_from_zarr(IMAGE_PATH, im_zarr_tiled, OUTPUT_TIFF_PATH)

    # Delete the data in the temp dirs
    # Delete the data in the temporary directories
    zarr.storage.rmdir(IM_STORE)
    zarr.storage.rmdir(SEG_STORE)
# Temporary directories and files are deleted after this block
