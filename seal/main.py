import io
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
from tqdm import tqdm
from PIL import Image
from pydantic import BaseModel
from fastapi.responses import FileResponse
from scipy.spatial import KDTree
from concave_hull import concave_hull
from matplotlib import pyplot as plt
from scipy.spatial import ConvexHull
import xgboost as xgb
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
import zarr
from scipy.spatial import cKDTree
import os
import tifffile as tf
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance
from sklearn.model_selection import train_test_split

# from line_profiler_pycharm import profile
from pathlib import Path
import time
import shap

app = FastAPI()
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Paths to data exemplar

shapes = None
csv_df = None
set_csv_path = None
tree = None
tile_size = None
image_io = None
image_zarr = None
seg_io = None
seg_zarr = None
segmentation_path = None
csv_path = None
parquet_path = None
image_path = None
embedding_image_path = None
embedding_segmentation_path = None
cut_seg_cells = None
cut_cells = None
shap_store = None
dataset_name = None
summary = None
contour_lines = None


def get_shapes(path):
    with tf.TiffFile(path, is_ome=False) as imgio:
        img = zarr.open(imgio.series[0].aszarr())
        shapes = [img[i].shape for i in range(len(img))]
    return shapes


def get_potential_features(df):
    # Check which of the potential features are in the csv_df
    all_features = [
        "ELANE",
        "CD57",
        "CD45",
        "CD11B",
        "SMA",
        "CD16",
        "ECAD",
        "FOXP3",
        "NCAM",
        "anti_CD3",
        "anti_CD45RO",
        "Keratin_570",
        "aSMA_660",
        "CD4_488",
        "CD45_PE",
        "PD1_647",
        "CD20_488",
        "CD68_555",
        "CD8a_660",
        "CD163_488",
        "FOXP3_570",
        "PDL1_647",
        "Ecad_488",
        "Vimentin_555",
        "CDX2_647",
        "LaminABC_488",
        "Desmin_555",
        "CD31_647",
        "PCNA_488",
        "CollagenIV_647",
        "CD3",
        "CD45RO",
        "Pan-cytokeratin",
        "Aortic smooth muscle actin",
        "CD4",
        "CD45",
        "PD-1",
        "CD20",
        "CD68",
        "CD8a",
        "CD163",
        "FOXP3",
        "PD-L1",
        "E-cadherin",
        "Vimentin",
        "CDX-2",
        "Lamin-A/B/C",
        "Desmin",
        "CD31",
        "PCNA",
        "Collagen",
        "DNA",
        "DNA (2)",
        "DNA (3)",
        "CD3",
        "CD45RO",
        "DNA (4)",
        "Pan-cytokeratin",
        "Aortic smooth muscle actin",
        "DNA (5)",
        "CD4",
        "CD45",
        "PD-1",
        "DNA (6)",
        "CD20",
        "CD68",
        "CD8a",
        "DNA (7)",
        "CD163",
        "FOXP3",
        "PD-L1",
        "DNA (8)",
        "E-cadherin",
        "Vimentin",
        "CDX-2",
        "DNA (9)",
        "Lamin-A/B/C",
        "Desmin",
        "CD31",
        "DNA (10)",
        "PCNA",
        "Collagen",
        "u",
        "g",
        "r",
        "i",
        "z",
        "JPG_R",
        "JPG_G",
        "JPG_B" "DNA1",
        "AF1",
        "CD31",
        "Ki67",
        "CD68",
        "CD163",
        "CD20",
        "CD4",
        "CD8a",
        "CD11c",
        "PDL1",
        "CD3e",
        "ECAD",
        "PD1",
        "FOXP3",
        "CD45",
        "SOX10",
        "pH3",
        "u",
        "g",
        "r",
        "i",
        "z",
        "petroRad_r",
        "cz",
        "extinction_r",
        "airmass_r",
        "mCr4_r",

    ]

    all_features = list(set(all_features))
    potential_features = [feature for feature in all_features if feature in df.columns]
    return sorted(potential_features)


# @profile
def load(dataset="exemplar-001", df=None):
    global shapes, csv_df, tree, tile_size, image_io, image_zarr, seg_io, seg_zarr, set_csv_path
    global segmentation_path, csv_path, image_path, cut_seg_cells, cut_cells, embedding_image_path, embedding_segmentation_path
    global shap_store, dataset_name, summary, contour_lines

    if csv_df is not None:
        return
    # if True
    if False:
        print("Loading", dataset, df)
        dataset_name = "exemplar"
        image_path = "/Users/swarchol/Research/seal/data/exemplar-001/registration/exemplar-001.ome.tif"
        segmentation_path = "/Users/swarchol/Research/seal/data/exemplar-001/segmentation/unmicst-exemplar-001/nuclei.ome.tif"
        # embedding_image_path = "/Users/swarchol/Research/seal/data/exemplar-001/new/tiled.ome.tif"
        embedding_image_path = (
            "/Users/swarchol/Research/seal/data/exemplar-001/test/tiled.ome.tif"
        )
        # embedding_segmentation_path = "/Users/swarchol/Research/seal/data/exemplar-001/new/tiled-mask.ome.tif"
        embedding_segmentation_path = (
            "/Users/swarchol/Research/seal/data/exemplar-001/test/tiled-mask.ome.tif"
        )
        csv_path = "/Users/swarchol/Research/seal/data/exemplar-001/new/updated.csv"

        # cut_seg_cells = zarr.open(
        #     "/Users/swarchol/Research/seal/data/exemplar-001/cellcutter/cut_mask"
        # )
        # cut_cells = zarr.open("/Users/swarchol/Research/seal/data/exemplar-001/cellcutter/cut")
        cut_cells = None
        parquet_path = None
    elif False:
        image_path = "/Volumes/Simon/Greg/WD-76845-097.ome.tif"
        segmentation_path = "/Volumes/Simon/Greg/WD-76845-097_mask_pyr.ome.tif"
        embedding_image_path = "/Volumes/Simon/Greg/tiled.ome.tif"
        embedding_segmentation_path = "/Volumes/Simon/Greg/tiled-mask.ome.tif"
        csv_path = "/Users/swarchol/Research/seal/data/updated_renamed_with_hdbscan.csv"
        set_csv_path = "/Users/swarchol/Research/seal/data/small.csv"
        parquet_path = None
        cut_cells = None
        dataset_name = "greg"
    elif True:
        image_path = "/Users/swarchol/Research/seal/data/astro/astro.ome.tif"
        segmentation_path = (
            "/Users/swarchol/Research/seal/data/astro/astro_seg_masks.ome.tif"
        )
        embedding_image_path = "/Users/swarchol/Research/seal/data/astro/hybrid.ome.tif"
        embedding_segmentation_path = (
            "/Users/swarchol/Research/seal/data/astro/hybrid.mask.ome.tif"
        )
        csv_path = "/Users/swarchol/Research/seal/data/astro/updated_astro.csv"
        dataset_name = "astro"
        parquet_path = None
        cut_cells = None
    elif False:
        image_path = ""
        segmentation_path = ""
        embedding_image_path = ""
        embedding_segmentation_path = ""
        csv_path = "/Users/swarchol/Research/seal/data/dan2/updated_best_kmeans.csv"
        set_csv_path = (
            "/Users/swarchol/Research/seal/data/dan2/updated_best_kmeans_small.csv"
        )
        dataset_name = "dan2"
        parquet_path = None
        cut_cells = None

    # shapes = get_shapes(image_path)
    # if path ends with .csv, read csv, if ends with .parquet, read parquet
    print("Reading csv", csv_path)

    if df is not None:
        csv_df = df
    elif parquet_path is not None:
        csv_df = pd.read_parquet(parquet_path)
    elif csv_path.endswith(".csv"):
        csv_df = pd.read_csv(csv_path)
    else:
        raise ValueError("Invalid file format")

    # calculate the mean value of all of the features
    potential_features = get_potential_features(csv_df)
    mean_features = csv_df[potential_features].mean()

    # Ranges is dict of {embedding: [min, max], spatial: [min, max], "embedding_subsample": a 10000x2 numpy array of the embedding coordinates}
    summary = {
        "embedding_ranges": [
            [csv_df["UMAP_X"].min(), csv_df["UMAP_X"].max()],
            [csv_df["UMAP_Y"].min(), csv_df["UMAP_Y"].max()],
        ],
        "spatial_ranges": [
            [csv_df["X_centroid"].min(), csv_df["X_centroid"].max()],
            [csv_df["Y_centroid"].min(), csv_df["Y_centroid"].max()],
        ],
        "embedding_subsample": csv_df[["UMAP_X", "UMAP_Y"]]
        .values[
            np.random.choice(csv_df.shape[0], min(1000, csv_df.shape[0]), replace=False)
        ]
        .tolist(),
        "spatial_subsample": csv_df[["X_centroid", "Y_centroid"]]
        .values[
            np.random.choice(csv_df.shape[0], min(1000, csv_df.shape[0]), replace=False)
        ]
        .tolist(),
        "global_mean_features": mean_features.to_dict(),
    }
    #
    tile_size = 1024
    shap_store = np.load(f"/Users/swarchol/Research/seal/data/{dataset_name}.shap.npy")
    # with open(f"/Users/swarchol/Research/seal/data/{dataset_name}.shap.pkl", "rb") as f:
    #     shap_store = pickle.load(f)
    with open(
        f"/Users/swarchol/Research/seal/data/{dataset_name}.contour.pkl", "rb"
    ) as f:
        contour_lines = pickle.load(f)


@app.get("/")
def read_root():
    return {"Hello": "World"}


class SelectionIDs(BaseModel):
    ids: List[List[Optional[Any]]]  #


class SelectionSet(BaseModel):
    name: str
    path: List[str]
    set: List[
        List[Optional[Any]]
    ]  # Assuming the inner lists can contain any type, including None


class CompareSet(BaseModel):
    sets: List[Dict[str, Any]]  # List of objects containing path and selection_ids


class SelectionGroup(BaseModel):
    name: str
    children: List[SelectionSet]


class SelectionData(BaseModel):
    sets: List[SelectionGroup]


def parse_id(_id):
    # If _id is already an integer, return it directly
    if isinstance(_id, int):
        return _id
    # If _id is a list/tuple, handle nested structure
    if isinstance(_id, (list, tuple)):
        # Handle first element being a list/tuple
        if isinstance(_id[0], (list, tuple)):
            return int(_id[0][0])
        # Handle first element being an integer
        return int(_id[0])
    # If we get here, we have an unexpected input
    raise ValueError(f"Unexpected ID format: {_id}")


def process_selection(selection_ids):
    global shap_store, summary
    selected_rows = csv_df[csv_df["CellID"].isin(selection_ids)]
    selected_indices = selected_rows.index.tolist()

    # Convert numpy values to Python native types
    absolute_shap_sums = np.sum(
        np.mean(np.abs(shap_store[selected_indices]), axis=(0)), axis=1
    ).tolist()  # Convert to list
    potential_features = get_potential_features(csv_df)
    feat_imp = list(zip(potential_features, absolute_shap_sums))

    # Convert numpy arrays to Python lists
    embedding_coordinates = selected_rows[["UMAP_X", "UMAP_Y"]].values.tolist()
    spatial_coordinates = selected_rows[["X_centroid", "Y_centroid"]].values.tolist()

    # Process coordinates expects numpy arrays
    hull_results = process_coordinates(
        np.array(spatial_coordinates), np.array(embedding_coordinates)
    )

    # Downsample if needed
    if len(embedding_coordinates) > 500:
        indices = np.random.choice(len(embedding_coordinates), 500, replace=False)
        embedding_coordinates = [embedding_coordinates[i] for i in indices]
        spatial_coordinates = [spatial_coordinates[i] for i in indices]

    selection_mean_features = selected_rows[potential_features].mean().to_dict()
    normalized_occurrence = {}
    for feature in potential_features:
        if (
            pd.isna(selection_mean_features[feature])
            or pd.isna(summary["global_mean_features"][feature])
            or summary["global_mean_features"][feature] == 0
        ):
            normalized_occurrence[feature] = 0
        else:
            normalized_occurrence[feature] = (
                selection_mean_features[feature]
                - summary["global_mean_features"][feature]
            ) / summary["global_mean_features"][feature]

    return {
        "feat_imp": feat_imp,
        "hulls": hull_results,
        "spatial_coordinates": spatial_coordinates,
        "embedding_coordinates": embedding_coordinates,
        "summary": summary,
        "selection_mean_features": selection_mean_features,
        "selection_ids": [int(id) for id in selection_ids],
        "normalized_occurrence": normalized_occurrence,
    }


@app.post("/selection")
async def selection(selection_data: SelectionSet):
    global dataset_name, csv_df

    selection_ids = [parse_id(_) for _ in selection_data.set]

    response_data = process_selection(selection_ids)
    return {"message": "Complete", "data": response_data}


@app.post("/set-compare")
async def set_compare(selection_data: CompareSet):
    global dataset_name, csv_df

    # Extract the two sets of selection IDs
    set1_ids = np.array([parse_id(_) for _ in selection_data.sets[0]["selection_ids"]])
    set2_ids = np.array([parse_id(_) for _ in selection_data.sets[1]["selection_ids"]])

    # Calculate basic set operations
    intersection_ids = np.intersect1d(set1_ids, set2_ids)
    union_ids = np.union1d(set1_ids, set2_ids)

    # Calculate derived operations
    a_minus_intersection = np.setdiff1d(set1_ids, intersection_ids)
    b_minus_intersection = np.setdiff1d(set2_ids, intersection_ids)
    symmetric_difference = np.setxor1d(set1_ids, set2_ids)  # (A∪B) - (A∩B)

    # Get universe (all cell IDs)
    universe = np.array(csv_df["CellID"].values)
    complement = np.setdiff1d(universe, union_ids)

    # Initialize results dictionary
    results = {
        "set1_count": len(set1_ids),
        "set2_count": len(set2_ids),
        "operations": {},
    }

    # Only include non-empty and non-trivial results
    if len(intersection_ids) > 0:
        results["operations"]["intersection"] = {
            "count": len(intersection_ids),
            "data": process_selection(intersection_ids.tolist()),
        }
        # Only include union if there's an intersection
        if len(union_ids) > 0:
            results["operations"]["a_plus_b"] = {
                "count": len(union_ids),
                "data": process_selection(union_ids.tolist()),
            }

    # Only include differences if they're not the same as original sets
    if len(a_minus_intersection) > 0 and len(a_minus_intersection) != len(set1_ids):
        results["operations"]["a_minus_intersection"] = {
            "count": len(a_minus_intersection),
            "data": process_selection(a_minus_intersection.tolist()),
        }

    if len(b_minus_intersection) > 0 and len(b_minus_intersection) != len(set2_ids):
        results["operations"]["b_minus_intersection"] = {
            "count": len(b_minus_intersection),
            "data": process_selection(b_minus_intersection.tolist()),
        }

    # Only include symmetric difference if it exists and there's an intersection
    if len(symmetric_difference) > 0 and len(intersection_ids) > 0:
        results["operations"]["a_plus_b_minus_intersection"] = {
            "count": len(symmetric_difference),
            "data": process_selection(symmetric_difference.tolist()),
        }

    if len(complement) > 0:
        results["operations"]["complement"] = {
            "count": len(complement),
            "data": process_selection(complement.tolist()),
        }

    return {"message": "Complete", "data": results}


@app.get("/contours")
async def contours():
    global contour_lines
    return {"message": "Complete", "data": contour_lines}


@app.get("/data/{file_path:path}")
async def serve_data_file(file_path: str):
    """
    Serve files from the /data directory.

    Parameters:
    file_path (str): Path to the file within the data directory

    Returns:
    FileResponse: The requested file if it exists
    """
    # Construct the full path to the file
    full_path = os.path.join("/Users/swarchol/Research/seal/data", file_path)

    # Check if the file exists
    if not os.path.exists(full_path) or not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail=f"File {file_path} not found")

    # Return the file
    return FileResponse(full_path)


@app.post("/neighborhood")
async def neighbors(selection_data: SelectionSet):
    global tree, csv_df
    selection_ids = [parse_id(_) for _ in selection_data.set]
    if tree is None:
        tree = cKDTree(csv_df[["X_centroid", "Y_centroid"]].values)

    indices = csv_df[csv_df["CellID"].isin(selection_ids)].index.values
    # find nearest neighbor to each index
    neighbors = tree.query(
        csv_df.iloc[indices][["X_centroid", "Y_centroid"]].values, k=2
    )
    neighbor_indices = neighbors[1][:, 1]
    neighbor_cellids = csv_df.iloc[neighbor_indices]["CellID"].values
    # remove indices that are in selection_ids
    neighbor_cellids = np.setdiff1d(neighbor_cellids, selection_ids)

    response_data = process_selection(neighbor_cellids)
    return {"message": "Complete", "data": response_data}


def calculate_concave_hull(coordinates, length_threshold=50):
    """
    Calculate the concave hull of the given coordinates.

    Parameters:
    coordinates (np.ndarray): Array of shape (n_samples, n_features) containing the coordinates.
    length_threshold (float): Length threshold for the concave hull algorithm.

    Returns:
    np.ndarray: The concave hull points.
    """
    hull_vertices = ConvexHull(coordinates)
    # rreturn the points
    # return area
    return coordinates[hull_vertices.vertices], hull_vertices.volume


def process_coordinates(spatial_coords, embedding_coords, k=100, length_threshold=50):
    """
    Process spatial and embedding coordinates to calculate mean distances and concave hulls.

    Parameters:
    spatial_coords (np.ndarray): Array of shape (n_samples, 2) containing the spatial coordinates.
    embedding_coords (np.ndarray): Array of shape (n_samples, 2) containing the embedding coordinates.
    k (int): Number of nearest neighbors to consider.
    threshold (float): Distance threshold to decide whether to calculate the concave hull.
    length_threshold (float): Length threshold for the concave hull algorithm.

    Returns:
    dict: Dictionary containing the results for spatial and embedding coordinates.
    """
    results = {}

    # Process spatial coordinates
    concave_hull_spatial, spatial_volume = calculate_concave_hull(
        spatial_coords, length_threshold
    )
    results["spatial"] = {
        "concave_hull": concave_hull_spatial.tolist(),
        "volume": spatial_volume,
        "density": len(spatial_coords) / spatial_volume,
        "centroid": np.mean(spatial_coords, axis=0).tolist(),
    }
    concave_hull_embedding, embedding_volume = calculate_concave_hull(
        embedding_coords, length_threshold
    )
    results["embedding"] = {
        "concave_hull": concave_hull_embedding.tolist(),
        "volume": embedding_volume,
        "density": len(embedding_coords) / embedding_volume,
        "centroid": np.mean(embedding_coords, axis=0).tolist(),
    }
    return results


@app.get("/files/image.ome.tif")
async def serve_image():
    global image_path
    return FileResponse(image_path)


@app.get("/files/embedding_image.ome.tif")
async def serve_embedding_image():
    global embedding_image_path
    return FileResponse(embedding_image_path)


@app.get("/files/embedding_segmentation.ome.tif")
async def serve_embedding_segmentation():
    global embedding_segmentation_path
    return FileResponse(embedding_segmentation_path)


@app.get("/files/segmentation.ome.tif")
async def serve_segmentation():
    global segmentation_path
    return FileResponse(segmentation_path)


@app.get("/files/csv.csv")
async def serve_csv():
    global csv_path
    return FileResponse(csv_path)


@app.get("/files/set_csv.csv")
async def serve_set_csv():
    global set_csv_path
    return FileResponse(set_csv_path)


load()
if __name__ == "__main__":
    load()

    uvicorn.run("main:app", host="localhost", port=8181, reload=True, workers=8)
#     # get_tile_raster(5, 2, 0)
# get_tile_raster(2, 2, 0)
# get_tile_raster(7, 2, 0)
# get_tile_raster(2, 2, 0)

# # timer = time.time()
# # for _ in range(20):
# #     get_tile_raster(2, 2, 0)
# #     get_tile_raster(3, 2, 0)
# #     get_tile_raster(1, 2, 0)
# #     get_tile_raster(0, 2, 0)
# # print(time.time() - timer)
# get_tile( 5, 0, 0, np.array([1024,1024]), 2, False)

# get_tile( 4, 0, 0, np.array([1024,1024]), None, True)
# # get_tile( 8, 0, 0, np.array([512,512]), True)

#     print('Getting tile', z, x, y, c, is_seg)
