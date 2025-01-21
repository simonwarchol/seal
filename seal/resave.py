import os
import zarr
import tifffile as tf
import dask.array as da
from ome_zarr.writer import write_multiscale
from ome_zarr.reader import Reader
from ome_types import from_tiff
from pathlib import Path


img_path = "/Volumes/Simon/Greg/WD-76845-097.ome.tif"
zarr_path = "/Volumes/Simon/Greg/zarr/WD-76845-097.zarr"
# zarr.convenience.save('/Volumes/Simon/Greg/zarr/WD-76845-097', im_zarr)

# # Open images

# def get_dask_arr(image):
#     z = zarr.open(image.aszarr(), mode="r")
#     n_levels = len(image.series[0].levels)
#     if n_levels > 1:
#         pyramid = [da.from_zarr(z[i]) for i in range(n_levels)]
#         multiscale = True
#     else:
#         pyramid = da.from_zarr(z)
#         multiscale = False
#     return pyramid, multiscale

# ome2 = from_tiff(img_path)
# print(ome2.images[0])
# image_pyramid, multiscale = get_dask_arr(tf.TiffFile(img_path, is_ome=False))

# store = zarr.DirectoryStore(zarr_path)
# g = zarr.group(store=store, overwrite=True)
# write_multiscale(pyramid=image_pyramid, group=g, axes=['c','x','y'])

# print(image_pyramid[0].shape)

# Open Image
reader = Reader(Path(zarr_path))
print(nodes = list(reader()))