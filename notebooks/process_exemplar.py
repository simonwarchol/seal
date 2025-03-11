# %% [markdown]
# ## Imports
#
# from line_profiler_pycharm import profile

# %%
from scipy.spatial import cKDTree
from tqdm import tqdm
import tifffile
from loguru import logger
import math
import tempfile
import shutil
import zarr
import numpy as np
import pandas as pd

# %% [markdown]
# ### Consts

# %%
TILE_SIZE = 1024
DOWNSCALE_FACTOR = 2
MAX_PYRAMID_IMG_SIZE = 1024

# %% [markdown]
# ## Input Paths

# %%
# write everything to /n/scratch/users/s/siw013/VAE_OUTPUT
SEGMENTATION_PATH = "/Users/swarchol/Research/seal/data/exemplar-001/segmentation/unmicst-exemplar-001/nuclei.ome.tif"
CSV_PATH = "/Users/swarchol/Research/seal/data/exemplar-001/quantification/exemplar-001--unmicst_cell_umap_clusters.csv"
IMAGE_PATH = "/Users/swarchol/Research/seal/data/exemplar-001/registration/exemplar-001.ome.tif"
CUT_SEG_CELLS_PATH = "/Users/swarchol/Research/seal/data/exemplar-001/cut/mask"
CUT_CELLS_PATH = "/Users/swarchol/Research/seal/data/exemplar-001/cut/combined"

# %% [markdown]
# ## Embedding

# %%
# df = pd.read_csv(CSV_PATH)
# emb_df = pd.read_csv('/home/siw013/umap_embedding.csv')
# emb_df
# df['UMAP_X'] = emb_df['UMAP_X']
# df['UMAP_Y'] = emb_df['UMAP_Y']
# df.to_csv('/n/scratch/users/s/siw013/VAE OUTPUT/3-10.csv', index=False)

# %% [markdown]
# ## Output Paths]
#

# %%
CSV_PATH = "/Users/swarchol/Research/seal/data/exemplar-001/quantification/exemplar-001--unmicst_cell_umap_clusters.csv"
OUTPUT_TIFF_PATH = "/Users/swarchol/Research/seal/data/exemplar-001/test/tiled.ome.tif"
OUTPUT_SEGMENTATION_PATH = "/Users/swarchol/Research/seal/data/exemplar-001/test/tiled-mask.ome.tif"
CSV_WRITE_PATH = "/Users/swarchol/Research/seal/data/exemplar-001/test/updated.csv"
IM_STORE = zarr.DirectoryStore('/Users/swarchol/Research/seal/data/exemplar-001/test/imstor')
SEG_STORE = zarr.DirectoryStore('/Users/swarchol/Research/seal/data/exemplar-001/test/segstor')


# %% [markdown]
# ## Create Non Occlusive

# %%
# def create_non_occlusive_zarr(
#         im_zarr_tiled, seg_zarr_tiled, cut_cells, cut_masks, csv_df
# ):
#     # Create list of all indices of cells in cut_cells
#     cell_indices = np.arange(cut_masks.shape[0])
#     np.random.seed(0)
#     np.random.shuffle(cell_indices)
#     for z in tqdm(range(len(im_zarr_tiled))):
#         height, width = im_zarr_tiled[z].shape[-2:]
#         scale_factor = 2 ** z

#         # Pre-allocate the entire level
#         seg_level_data = zarr.zeros((height, width), dtype=np.uint32)
#         image_level_data = zarr.zeros(
#             (im_zarr_tiled[z].shape[0], height, width), dtype=np.uint16
#         )
#         binary_mask = np.zeros((height, width), dtype=np.uint8)
#         print('Allocated, iterating over cells', z)
#         for cell_index in tqdm(cell_indices):
#             # Retrieve cell row
#             cell_row = csv_df.loc[csv_df["CellID"] == cell_index]
#             if cell_row.empty:
#                 continue
#             cell_location = cell_row[["UMAP_X", "UMAP_Y"]].values.flatten()

#             # Adjust cell_location to place the cell's center at the centroid
#             cell_center_offset = (cut_masks.shape[-2] // 2, cut_masks.shape[-1] // 2)
#             cell_location = ((cell_location / scale_factor) - cell_center_offset).astype(int)

#             # Ensure cell_location does not go below 0
#             cell_location = np.maximum(cell_location, 0)

#             cell_x_range = min(cell_location[0] + cut_masks.shape[-2], width)
#             cell_y_range = min(cell_location[1] + cut_masks.shape[-1], height)

#             # Calculate slicing based on truncated ranges
#             cell_slice_x = slice(cell_location[0], cell_x_range)
#             cell_slice_y = slice(cell_location[1], cell_y_range)
#             cut_cell_slice_x = slice(0, cell_x_range - cell_location[0])
#             cut_cell_slice_y = slice(0, cell_y_range - cell_location[1])

#             # Check if adding this cell to the binary mask will create a value over 1
#             binary_check = (
#                     binary_mask[cell_slice_y, cell_slice_x]
#                     + cut_masks[cell_index, cut_cell_slice_y, cut_cell_slice_x]
#             )
#             if np.any(binary_check > 1):
#                 continue
#             binary_mask[cell_slice_y, cell_slice_x] = binary_check

#             seg_level_data[cell_slice_y, cell_slice_x] += (
#                     cut_masks[cell_index][cut_cell_slice_y, cut_cell_slice_x]
#                     * (cell_row["CellID"].values[0])
#             ).astype(np.uint32)
#             masked_cell = cut_masks[cell_index] * cut_cells[:, cell_index, :, :]
#             image_level_data[:, cell_slice_y, cell_slice_x] += masked_cell[
#                                                                :, cut_cell_slice_y, cut_cell_slice_x
#                                                                ]

#         im_zarr_tiled[z] = image_level_data
#         seg_zarr_tiled[z] = seg_level_data
#     return im_zarr_tiled, seg_zarr_tiled


def create_non_occlusive_zarr(im_zarr_tiled, seg_zarr_tiled, cut_cells, cut_masks, csv_df):
    # Create list of all indices of cells in cut_cells
    cell_indices = np.arange(cut_masks.shape[0])
    np.random.seed(0)
    np.random.shuffle(cell_indices)
    
    for z in tqdm(range(len(im_zarr_tiled))):
        height, width = im_zarr_tiled[z].shape[-2:]
        scale_factor = 2 ** z

        # Work with NumPy arrays in memory for speed, copy to Zarr only once at the end
        seg_level_data = np.zeros((height, width), dtype=np.uint32)
        image_level_data = np.zeros((im_zarr_tiled[z].shape[0], height, width), dtype=np.uint16)
        binary_mask = np.zeros((height, width), dtype=np.uint8)
        
        # Pre-compute all cell masks that will be placed (batch process)
        valid_cells = []
        valid_masks = []
        valid_locations = []
        valid_slices = []
        
        print('Finding valid cell placements', z)
        # First pass - determine valid cell placements
        for cell_index in tqdm(cell_indices):
            cell_row = csv_df.loc[csv_df["CellID"] == cell_index]
            if cell_row.empty:
                continue
                
            cell_location = cell_row[["UMAP_X", "UMAP_Y"]].values.flatten()
            cell_center_offset = (cut_masks.shape[-2] // 2, cut_masks.shape[-1] // 2)
            cell_location = ((cell_location / scale_factor) - cell_center_offset).astype(int)
            cell_location = np.maximum(cell_location, 0)

            cell_x_range = min(cell_location[0] + cut_masks.shape[-2], width)
            cell_y_range = min(cell_location[1] + cut_masks.shape[-1], height)

            cell_slice_x = slice(cell_location[0], cell_x_range)
            cell_slice_y = slice(cell_location[1], cell_y_range)
            cut_cell_slice_x = slice(0, cell_x_range - cell_location[0])
            cut_cell_slice_y = slice(0, cell_y_range - cell_location[1])

            mask = cut_masks[cell_index, cut_cell_slice_y, cut_cell_slice_x]
            
            # Check if placing this cell will overlap with existing cells
            if np.any((binary_mask[cell_slice_y, cell_slice_x] + mask) > 1):
                continue
                
            # Update the binary mask
            binary_mask[cell_slice_y, cell_slice_x] += mask
            
            # Store valid cell data for batch processing
            valid_cells.append(cell_index)
            valid_masks.append(mask)
            valid_locations.append((cell_row["CellID"].values[0], cell_slice_y, cell_slice_x, 
                                  cut_cell_slice_y, cut_cell_slice_x))
        
        # Second pass - place all valid cells in batch
        print('Placing cells', z)
        for i, cell_index in enumerate(tqdm(valid_cells)):
            mask = valid_masks[i]
            cell_id, cell_slice_y, cell_slice_x, cut_cell_slice_y, cut_cell_slice_x = valid_locations[i]
            
            # Update segmentation data
            seg_level_data[cell_slice_y, cell_slice_x] += (mask * cell_id).astype(np.uint32)
            
            # Pre-compute the masked cell once
            masked_cell = cut_masks[cell_index] * cut_cells[:, cell_index, :, :]
            
            # Update image data
            image_level_data[:, cell_slice_y, cell_slice_x] += masked_cell[:, cut_cell_slice_y, cut_cell_slice_x]
        
        # Write to Zarr arrays only once per level
        im_zarr_tiled[z] = image_level_data
        seg_zarr_tiled[z] = seg_level_data
        
    return im_zarr_tiled, seg_zarr_tiled

# %% [markdown]
# ## Write Method
#

# %%
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
                    yield zarr_array[c, y: y + tile_size, x: x + tile_size]
    else:  # Single-channel case
        height, width = zarr_array.shape
        for y in tqdm(range(0, height, tile_size)):
            for x in range(0, width, tile_size):
                yield zarr_array[y: y + tile_size, x: x + tile_size]


# %% [markdown]
# ## Process
#

# %%
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
csv_df["UMAP_X"] = embedding[:, 0]
csv_df["UMAP_Y"] = embedding[:, 1]
# Write embedding to csv
csv_df.to_csv(CSV_WRITE_PATH, index=False)
print(csv_df.shape)
tree = cKDTree(embedding)
# print(im_zarr_tiled[0].shape[-2:])

# Load cut cells
cut_seg_cells = zarr.open(CUT_SEG_CELLS_PATH)
cut_cells = zarr.open(CUT_CELLS_PATH)
# # # Process segmentation
im_zarr_tiled, seg_zarr_tiled = create_non_occlusive_zarr(
    im_zarr_tiled, seg_zarr_tiled, cut_cells, cut_seg_cells, csv_df
)

write_ome_tiff_from_zarr(
    SEGMENTATION_PATH, seg_zarr_tiled, OUTPUT_SEGMENTATION_PATH, is_mask=True
)
write_ome_tiff_from_zarr(IMAGE_PATH, im_zarr_tiled, OUTPUT_TIFF_PATH)





