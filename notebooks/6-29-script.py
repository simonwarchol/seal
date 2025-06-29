import tifffile as tf 
import zarr 
import multiprocessing
import shutil
from tqdm.auto import tqdm
import os
import cellcutter.cli

IMG_PATH = '/Users/swarchol/Downloads/exemplar-001/image.ome.tif'
CSV_PATH = '/Users/swarchol/Downloads/exemplar-001/df.csv'
SEGMENTATION_PATH = '/Users/swarchol/Downloads/exemplar-001/image.mask.ome.tif'
dest_path = "/Users/swarchol/Downloads/exemplar-001/cut"

if __name__ == "__main__":
    multiprocessing.freeze_support()

    img = tf.TiffFile(IMG_PATH, is_ome=False)

    if os.path.exists(dest_path):
        shutil.rmtree(dest_path)

    for i in tqdm(range(len(img.pages))):
        sample_path = f"{dest_path}/channel_{i}"
        args = [
            IMG_PATH,
            SEGMENTATION_PATH,
            CSV_PATH,
            sample_path,
            "-p", "1",
            "--channels", str(i + 1),
            "--cache-size", str(1024 * 1024 * 1024 * 4),
        ]
        cellcutter.cli.cut(args)