
import zarr
from tqdm.auto import tqdm
import zarr
import tifffile as tf
from tqdm import tqdm
import numpy as np
import pickle
# channels_written = np.array([]);
zarr_path = "/Volumes/Simon/Greg/combined"
cells = zarr.open(zarr_path)
print(cells.shape)
try:
    channels_written = np.load('channels_written.npy')
    max_channel = np.max(channels_written)
except:
    channels_written = np.array([])
    max_channel = -1
# z1 = zarr.open('/Users/swarchol/Research/bed/data/for_simon/rechunked_combined.zarr', mode='w', shape=(40, 1242756, 75, 75), chunks=(40, 1000, 75, 75), dtype='uint16')
z1 = zarr.open('/Volumes/Simon/Greg/combinedrechunked_combined.zarr')
for _ in range(1):
    j = int(max_channel + 1);
    print(j)
    if j == 10:
        break
    k = j * 2
    l = (j + 1) * 2
    print('reading channels', k, 'to', l)
    these_cells = cells[k:l,:,:,:]
    print('reading channel', j)
    z1[k:l,:,:,:] = these_cells
    print('writing channel', j)
    # Append i to channels_written
    channels_written = np.append(channels_written, j)
    max_channel = j
    np.save('channels_written.npy', channels_written)