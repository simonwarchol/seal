# %% [markdown]
# ## Imports
#
# from line_profiler_pycharm import profile

import tifffile as tf 
import zarr 
import palom
# import pillow
import tifffile
import math
from PIL import Image
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.datasets import load_wine
import xgboost as xgb
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
import shap
import matplotlib.pyplot as plt
from sklearn.preprocessing import LabelEncoder
import json
import numpy as np
import pandas as pd
import shutil
import matplotlib.pyplot as plt
import shap
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from scipy.spatial import cKDTree
import xgboost as xgb
from scipy.spatial import ConvexHull, Delaunay
import pickle
import os
import time
# import torch
# import torch.nn as nn
from tqdm.auto import tqdm
import numpy as np
import tifffile as tf
import zarr
import dask.array as da
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from tqdm.auto import tqdm
import cellcutter
import cellcutter.cli
from numcodecs import Blosc
import logging
import numpy as np
import matplotlib.pyplot as pl
import scipy.stats as st
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)
logging.debug("test")

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
SEGMENTATION_PATH = "/n/scratch/users/s/siw013/VAE OUTPUT/cellRing_from_mcmicro.ome.tif"
CSV_PATH = "/Users/swarchol/Research/seal/data/exemplar-001/new/updated.csv"
IMAGE_PATH = "/n/scratch/users/s/siw013/VAE OUTPUT/combined.ome.tif"
CUT_SEG_CELLS_PATH = "/n/scratch/users/s/siw013/VAE OUTPUT/mask"
CUT_CELLS_PATH = "/n/scratch/users/s/siw013/VAE OUTPUT/combined"


# %% [markdown]
# ## Embedding

# # %%
# df = pd.read_csv(CSV_PATH)
# emb_df = pd.read_csv('/home/siw013/umap_embedding.csv')
# emb_df
# df['UMAP_X'] = emb_df['UMAP_X']
# df['UMAP_Y'] = emb_df['UMAP_Y']
# df.to_csv('/n/scratch/users/s/siw013/VAE OUTPUT/3-11.csv', index=False)

# %% [markdown]
# ## Output Paths]
#

# %%
# CSV_PATH = '/n/scratch/users/s/siw013/VAE OUTPUT/3-11.csv'
OUTPUT_TIFF_PATH = "/n/scratch/users/s/siw013/dan2/tiled.ome.tif"
OUTPUT_SEGMENTATION_PATH = "/n/scratch/users/s/siw013/dan2/tiled-mask.ome.tif"
CSV_WRITE_PATH = "/n/scratch/users/s/siw013/dan2/updated_best.csv"
IM_STORE = zarr.DirectoryStore('/n/scratch/users/s/siw013/dan2/imstor')
SEG_STORE = zarr.DirectoryStore('/n/scratch/users/s/siw013/dan2/segstor')


# %% [markdown]
# ## Create Non Occlusive
def process_single_level(z, im_zarr_path, seg_zarr_path, cut_cells_path, cut_masks_path, 
                         cell_indices, cell_locations, cell_ids):
    """Process a single z-level in isolation for parallel execution"""
    # Open zarr stores for this process
    im_zarr_tiled = zarr.open(im_zarr_path)
    seg_zarr_tiled = zarr.open(seg_zarr_path)
    cut_cells = zarr.open(cut_cells_path)
    cut_masks = zarr.open(cut_masks_path)
    
    height, width = im_zarr_tiled[z].shape[-2:]
    scale_factor = 2 ** z
    
    # Initialize arrays
    seg_level_data = np.zeros((height, width), dtype=np.uint32)
    image_level_data = np.zeros((im_zarr_tiled[z].shape[0], height, width), dtype=np.uint16)
    binary_mask = np.zeros((height, width), dtype=np.uint8)
    
    # For storing valid cells
    valid_cells = []
    valid_locations = []
    
    # First pass - determine valid cell placements
    for i, cell_index in enumerate(cell_indices):
        cell_location = cell_locations[i] / scale_factor
        cell_id = cell_ids[i]
        
        cell_center_offset = (cut_masks.shape[-2] // 2, cut_masks.shape[-1] // 2)
        cell_location = (cell_location - cell_center_offset).astype(int)
        cell_location = np.maximum(cell_location, 0)
        
        cell_x_range = min(cell_location[0] + cut_masks.shape[-2], width)
        cell_y_range = min(cell_location[1] + cut_masks.shape[-1], height)
        
        cell_slice_x = slice(cell_location[0], cell_x_range)
        cell_slice_y = slice(cell_location[1], cell_y_range)
        cut_cell_slice_x = slice(0, cell_x_range - cell_location[0])
        cut_cell_slice_y = slice(0, cell_y_range - cell_location[1])
        
        mask = cut_masks[cell_index, cut_cell_slice_y, cut_cell_slice_x]
        
        # Check overlap
        if np.any((binary_mask[cell_slice_y, cell_slice_x] + mask) > 1):
            continue
            
        # Update the binary mask
        binary_mask[cell_slice_y, cell_slice_x] += mask
        
        # Store cell info
        valid_cells.append(cell_index)
        valid_locations.append((cell_id, cell_slice_y, cell_slice_x, 
                              cut_cell_slice_y, cut_cell_slice_x))
    
    # Process valid cells in parallel batches
    def process_cell_batch(cell_batch):
        """Process a batch of cells in parallel"""
        batch_results = []
        for i, cell_index in enumerate(cell_batch):
            idx = valid_cells.index(cell_index)
            cell_id, cell_slice_y, cell_slice_x, cut_cell_slice_y, cut_cell_slice_x = valid_locations[idx]
            
            # Get the mask
            mask = cut_masks[cell_index, cut_cell_slice_y, cut_cell_slice_x]
            
            # Get masked cell data
            masked_cell = cut_masks[cell_index] * cut_cells[:, cell_index, :, :]
            
            batch_results.append((
                cell_id, cell_slice_y, cell_slice_x, cut_cell_slice_y, cut_cell_slice_x,
                mask, masked_cell
            ))
        return batch_results
    
    # Split cells into batches for parallel processing
    batch_size = 50  # Adjust based on number of CPUs and memory
    valid_cell_batches = [valid_cells[i:i+batch_size] for i in range(0, len(valid_cells), batch_size)]
    
    # Process batches using ThreadPoolExecutor within this process
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=os.cpu_count()) as executor:
        batch_results = list(executor.map(process_cell_batch, valid_cell_batches))
    
    # Flatten results
    all_results = [item for sublist in batch_results for item in sublist]
    
    # Apply all results to output arrays
    for cell_id, cell_slice_y, cell_slice_x, cut_cell_slice_y, cut_cell_slice_x, mask, masked_cell in all_results:
        # Update segmentation data
        seg_level_data[cell_slice_y, cell_slice_x] += (mask * cell_id).astype(np.uint32)
        
        # Update image data
        image_level_data[:, cell_slice_y, cell_slice_x] += masked_cell[:, cut_cell_slice_y, cut_cell_slice_x]
    
    return z, image_level_data, seg_level_data

def create_non_occlusive_zarr(im_zarr_tiled, seg_zarr_tiled, cut_cells, cut_masks, csv_df):
    # Create list of all indices of cells in cut_cells
    cell_indices = np.arange(cut_masks.shape[0])
    np.random.seed(0)
    np.random.shuffle(cell_indices)
    
    # Create cell ID lookup dictionary for faster access
    cell_id_dict = dict(zip(csv_df["CellID"], range(len(csv_df))))
    
    # For Jupyter compatibility, use sequential processing instead of multiprocessing
    for z in tqdm(range(len(im_zarr_tiled))):
        height, width = im_zarr_tiled[z].shape[-2:]
        scale_factor = 2 ** z

        # Work with NumPy arrays in memory for speed
        seg_level_data = np.zeros((height, width), dtype=np.uint32)
        image_level_data = np.zeros((im_zarr_tiled[z].shape[0], height, width), dtype=np.uint16)
        binary_mask = np.zeros((height, width), dtype=np.uint8)
        
        valid_cells = []
        valid_locations = []
        
        print(f'Finding valid cell placements for level {z}')
        # First pass - determine valid cell placements
        for cell_index in tqdm(cell_indices):
            if cell_index not in cell_id_dict:
                continue
            
            idx = cell_id_dict[cell_index]
            cell_row = csv_df.iloc[idx]
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

            # Read the mask
            mask = cut_masks[cell_index, cut_cell_slice_y, cut_cell_slice_x]
            
            # Check overlap
            if np.any((binary_mask[cell_slice_y, cell_slice_x] + mask) > 1):
                continue
                
            # Update the binary mask
            binary_mask[cell_slice_y, cell_slice_x] += mask
            
            # Store cell info
            valid_cells.append(cell_index)
            valid_locations.append((cell_row["CellID"], cell_slice_y, cell_slice_x, 
                                  cut_cell_slice_y, cut_cell_slice_x))
        
        # Optimize the main bottleneck using thread-based parallelism
        # which is safer in Jupyter environments than process-based parallelism
        print(f'Placing {len(valid_cells)} cells for level {z}')
        
        # Use ThreadPoolExecutor for the bottleneck operation
        from concurrent.futures import ThreadPoolExecutor
        
        def process_cell(args):
            i, cell_index = args
            cell_id, cell_slice_y, cell_slice_x, cut_cell_slice_y, cut_cell_slice_x = valid_locations[i]
            
            # Get the mask once
            mask = cut_masks[cell_index, cut_cell_slice_y, cut_cell_slice_x]
            
            # Get masked cell data - this is the main bottleneck (80%)
            masked_cell = cut_masks[cell_index] * cut_cells[:, cell_index, :, :]
            
            return (i, mask, masked_cell)
        
        # MEMORY OPTIMIZATION: Process and apply results immediately
        # Instead of accumulating all results in memory
        with ThreadPoolExecutor(max_workers=os.cpu_count()) as executor:
            cell_args = list(enumerate(valid_cells))
            for result in tqdm(executor.map(process_cell, cell_args), total=len(valid_cells)):
                # Unpack the result
                i, mask, masked_cell = result
                
                # Get the cell location info
                cell_id, cell_slice_y, cell_slice_x, cut_cell_slice_y, cut_cell_slice_x = valid_locations[i]
                
                # Update segmentation data immediately
                seg_level_data[cell_slice_y, cell_slice_x] += (mask * cell_id).astype(np.uint32)
                
                # Update image data immediately
                image_level_data[:, cell_slice_y, cell_slice_x] += masked_cell[:, cut_cell_slice_y, cut_cell_slice_x]
                
                # Explicitly release the large array
                del masked_cell
        
        # Write to Zarr arrays only once per level
        im_zarr_tiled[z] = image_level_data
        seg_zarr_tiled[z] = seg_level_data
        
        # Help manage memory between levels
        del binary_mask, image_level_data, seg_level_data
    
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



# Compute SHAP Values
regressor = xgb.XGBRegressor(
                 n_estimators=500,
                 max_depth=13,
                 seed=1000)

feature_columns = ['DNA1', 'AF1', 'CD31', 'Ki67', 'CD68', 'CD163', 'CD20', 'CD4',
       'CD8a', 'CD11c', 'PDL1', 'CD3e', 'ECAD', 'PD1', 'FOXP3', 'CD45',
       'SOX10', 'pH3']
feature_data = csv_df[feature_columns]
regressor.fit(feature_data, csv_df[['UMAP_X','UMAP_Y']])

explainer = shap.Explainer(regressor)
shap_values = explainer(feature_data)
shap_values = np.abs(shap_values.values)
alphabetical_features = sorted(feature_columns)
indices = [feature_columns.index(feature) for feature in alphabetical_features]
indices
# shap_values = shap_values[:, alphabetical_features]
alphabetical_shap_values = shap_values[:, indices]
np.save('/n/scratch/users/s/siw013/dan2/dan2.shap.npy', alphabetical_shap_values)



# data = np.random.multivariate_normal((0, 0), [[0.8, 0.05], [0.05, 0.7]], 400)
x = csv_df['UMAP_X']
y = csv_df['UMAP_Y']
xmin, xmax = x.min(), x.max()
ymin, ymax = y.min(), y.max()

# Expand the area to ensure contours are complete
xmin_expanded = xmin - (xmax - xmin) * 0.2  # 10% expansion on both sides
xmax_expanded = xmax + (xmax - xmin) * 0.2
ymin_expanded = ymin - (ymax - ymin) * 0.2
ymax_expanded = ymax + (ymax - ymin) * 0.2

# Peform the kernel density estimate with expanded area
xx, yy = np.mgrid[xmin_expanded:xmax_expanded:1024j, ymin_expanded:ymax_expanded:1024j]
positions = np.vstack([xx.ravel(), yy.ravel()])
values = np.vstack([x, y])
kernel = st.gaussian_kde(values)
f = np.reshape(kernel(positions).T, xx.shape)
import matplotlib.contour as mcontour
fig, ax = plt.subplots()
contours = ax.contour(xx, yy, f, filled=False, levels=np.linspace(f.min(), f.max(), 10))
# plot the scatterplot of the points
plt.scatter(x, y, c='blue', s=1)
contour_lines = []
contours.allsegs
for seg in contours.allsegs:
    for line in seg:
        contour_lines.append(line.tolist())

# Pickle the contour_lines
with open('/n/scratch/users/s/siw013/dan2/dan2.contour.pkl', 'wb') as f:
    pickle.dump(contour_lines, f)