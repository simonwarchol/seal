from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
from tqdm import tqdm
from PIL import Image
from pydantic import BaseModel
from fastapi.responses import FileResponse
from scipy.spatial import KDTree
from matplotlib import pyplot as plt
from scipy.spatial import ConvexHull
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
from scipy.spatial import cKDTree
import os
import tifffile as tf
from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance
from sklearn.model_selection import train_test_split
# from line_profiler_pycharm import profile
from pathlib import Path

from fastapi.responses import RedirectResponse

app = FastAPI()
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Initialize global variables
CURRENT_DATASET = {
    "name": None,
    "csv_df": None,
    "summary": None,
    "shap_store": None,
    "contour_lines": None,
    "spatial_tree": None,  # KD-tree for spatial coordinates
    "embedding_tree": None,  # KD-tree for UMAP coordinates
    "paths": None
}

def get_dataset_paths(dataset_name):
    """Return the paths for a given dataset"""
    # Check if bucket for dataset exists    
    
    if dataset_name == "exemplar-001":
        base_url = "https://seal-vis.s3.us-east-1.amazonaws.com/exemplar-001"
        return {
            "csv_path": f"{base_url}/df.parquet",
            "set_csv_path": None,
            "parquet_path": f"{base_url}/df.parquet",
            "image_path": f"{base_url}/image.ome.tif",
            "segmentation_path": f"{base_url}/mask.ome.tif",
            "embedding_image_path": f"{base_url}/hybrid.ome.tif",
            "embedding_segmentation_path": f"{base_url}/hybrid-mask.ome.tif",
            "shap_path": f"{base_url}/shap.parquet"
        }
    elif dataset_name == "exemplar-001v2":
        base_url = "https://seal-vis.s3.us-east-1.amazonaws.com/exemplar-001v2"
        return {
            "csv_path": f"{base_url}/df.parquet",
            "set_csv_path": None,
            "parquet_path": f"{base_url}/df.parquet",
            "image_path": f"{base_url}/image.ome.tif",
            "segmentation_path": f"{base_url}/mask.ome.tif",
            "embedding_image_path": f"{base_url}/hybrid.ome.tif",
            "embedding_segmentation_path": f"{base_url}/hybrid-mask.ome.tif",
            "shap_path": f"{base_url}/shap.parquet"
        }
    elif dataset_name == "SDSS":
        base_url = "https://seal-vis.s3.us-east-1.amazonaws.com/SDSS"
        return {
            "csv_path": f"{base_url}/df.parquet",
            "set_csv_path": None,
            "parquet_path": f"{base_url}/df.parquet",
            "image_path": f"{base_url}/image.ome.tif",
            "segmentation_path": f"{base_url}/mask.ome.tif",
            "embedding_image_path": f"{base_url}/hybrid.ome.tif",
            "embedding_segmentation_path": f"{base_url}/hybrid-mask.ome.tif",
            "shap_path": f"{base_url}/shap.parquet"
        }
    elif dataset_name == "WD-76845-097":
        base_url = "https://seal-vis.s3.us-east-1.amazonaws.com/WD-76845-097"
        return {
            "csv_path": f"{base_url}/small.csv",
            "set_csv_path": f"{base_url}/small.csv",
            "parquet_path": f"{base_url}/df.parquet",
        }
    else:
        base_path = "/Users/swarchol/Research/seal/data"
        return {
            "csv_path": f"{base_path}/{dataset_name}/updated.csv",
            "set_csv_path": None,
            "parquet_path": None,
            "image_path": f"{base_path}/{dataset_name}/image.ome.tif",
            "segmentation_path": f"{base_path}/{dataset_name}/segmentation.ome.tif",
            "embedding_image_path": f"{base_path}/{dataset_name}/hybrid.ome.tif",
            "embedding_segmentation_path": f"{base_path}/{dataset_name}/hybrid-mask.ome.tif",
            "shap_path": f"{base_path}/{dataset_name}/shap.parquet"
        }

def load_dataset(dataset_name, df=None):
    """Load a specific dataset, replacing any currently loaded dataset"""
    global CURRENT_DATASET
    
    # If the requested dataset is already loaded, return
    if CURRENT_DATASET["name"] == dataset_name:
        return CURRENT_DATASET
    
    # Clear current dataset from memory
    CURRENT_DATASET = {
        "name": None,
        "csv_df": None,
        "summary": None,
        "shap_store": None,
        "spatial_tree": None,
        "embedding_tree": None,
        "paths": None
    }
    
    paths = get_dataset_paths(dataset_name)
    
    # Load the data
    if df is not None:
        CURRENT_DATASET["csv_df"] = df
    elif paths["parquet_path"]:
        CURRENT_DATASET["csv_df"] = pd.read_parquet(paths["parquet_path"])
    elif paths["csv_path"].endswith(".csv"):
        CURRENT_DATASET["csv_df"] = pd.read_csv(paths["csv_path"])
    else:
        raise ValueError("Invalid file format")

    # Calculate features and summary
    potential_features = get_potential_features(CURRENT_DATASET["csv_df"])
    mean_features = CURRENT_DATASET["csv_df"][potential_features].mean()
    
    summary = {
        "embedding_ranges": [
            [float(CURRENT_DATASET["csv_df"]["UMAP_X"].min()), float(CURRENT_DATASET["csv_df"]["UMAP_X"].max())],
            [float(CURRENT_DATASET["csv_df"]["UMAP_Y"].min()), float(CURRENT_DATASET["csv_df"]["UMAP_Y"].max())],
        ],
        "spatial_ranges": [
            [float(CURRENT_DATASET["csv_df"]["X_centroid"].min()), float(CURRENT_DATASET["csv_df"]["X_centroid"].max())],
            [float(CURRENT_DATASET["csv_df"]["Y_centroid"].min()), float(CURRENT_DATASET["csv_df"]["Y_centroid"].max())],
        ],
        "embedding_subsample": CURRENT_DATASET["csv_df"][["UMAP_X", "UMAP_Y"]]
        .values[np.random.choice(CURRENT_DATASET["csv_df"].shape[0], min(1000, CURRENT_DATASET["csv_df"].shape[0]), replace=False)]
        .tolist(),
        "spatial_subsample": CURRENT_DATASET["csv_df"][["X_centroid", "Y_centroid"]]
        .values[np.random.choice(CURRENT_DATASET["csv_df"].shape[0], min(1000, CURRENT_DATASET["csv_df"].shape[0]), replace=False)]
        .tolist(),
        "global_mean_features": mean_features.to_dict(),
    }

    try:
        shap_store = pd.read_parquet(paths["shap_path"])
    except:
        shap_store = np.load(f"/Users/swarchol/Research/seal/data/{dataset_name}.shap.npy")

    # Update CURRENT_DATASET
    CURRENT_DATASET.update({
        "name": dataset_name,
        "summary": summary,
        "shap_store": shap_store,
        "paths": paths,
        "spatial_tree": cKDTree(CURRENT_DATASET["csv_df"][["X_centroid", "Y_centroid"]].values),
        "embedding_tree": cKDTree(CURRENT_DATASET["csv_df"][["UMAP_X", "UMAP_Y"]].values)
    })
    
    return CURRENT_DATASET

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
        # "petroRad_r",  # Petrosian radius in the r-band – an estimate of the size of an object (usually a galaxy).
        #  Probability the object is a point source (i.e., star-like) based on shape. High values suggest stars, while extended objects (like galaxies) have lower values.
        "cz",
        "extinction_r",
        "airmass_r",
        "mCr4_r",
        'CD11B', 'CD16', 'CD45', 'CD57', 'DNA_6', 'DNA_7', 'DNA_8', 'ECAD', 'ELANE', 'FOXP3', 'NCAM', 'SMA'
    ]

    all_features = list(set(all_features))
    potential_features = [feature for feature in all_features if feature in df.columns]
    return sorted(potential_features)

@app.get("/")
def read_root():
    return {"Hello": "Seal"}


class SelectionIDs(BaseModel):
    ids: List[List[Optional[Any]]]  #


class SelectionSet(BaseModel):
    name: str
    path: List[str]
    set: List[List[Optional[Any]]]  # Assuming the inner lists can contain any type, including None
    mode: Optional[str] = 'knn'  # 'knn' or 'distance'
    knn: Optional[int] = 10
    radius: Optional[float] = 50.0
    coordinate_space: Optional[str] = 'spatial'  # 'spatial' or 'embedding'


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
    """Process selection using current dataset"""
    selected_rows = CURRENT_DATASET["csv_df"][CURRENT_DATASET["csv_df"]["CellID"].isin(selection_ids)]
    selected_indices = selected_rows.index.tolist()

    # Convert numpy values to Python native types
    # shap iloc
    absolute_shap_sums =  CURRENT_DATASET["shap_store"].iloc[selected_indices].mean(axis=0)
    feat_imp = absolute_shap_sums.to_dict()
    # Create list of key,value sorted by key
    feat_imp = sorted(feat_imp.items(), key=lambda item: item[1], reverse=True)
    potential_features = CURRENT_DATASET["shap_store"].columns.tolist()

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
            or pd.isna(CURRENT_DATASET["summary"]["global_mean_features"][feature])
            or CURRENT_DATASET["summary"]["global_mean_features"][feature] == 0
        ):
            normalized_occurrence[feature] = 0
        else:
            normalized_occurrence[feature] = (
                selection_mean_features[feature]
                - CURRENT_DATASET["summary"]["global_mean_features"][feature]
            ) / CURRENT_DATASET["summary"]["global_mean_features"][feature]

    return {
        "feat_imp": feat_imp,
        "hulls": hull_results,
        "spatial_coordinates": spatial_coordinates,
        "embedding_coordinates": embedding_coordinates,
        "summary": CURRENT_DATASET["summary"],
        "selection_mean_features": selection_mean_features,
        "selection_ids": [int(id) for id in selection_ids],
        "normalized_occurrence": normalized_occurrence,
    }


@app.post("/selection/{dataset_name}")
async def selection(dataset_name: str, selection_data: SelectionSet):
    dataset = load_dataset(dataset_name)
    selection_ids = [parse_id(_) for _ in selection_data.set]
    response_data = process_selection(selection_ids)
    return {"message": "Complete", "data": response_data}


@app.post("/set-compare/{dataset_name}")
async def set_compare(dataset_name: str, selection_data: CompareSet):
    dataset = load_dataset(dataset_name)
    # Use CURRENT_DATASET in the existing function logic
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
    universe = np.array(dataset["csv_df"]["CellID"].values)
    complement = np.setdiff1d(universe, union_ids)

    # Initialize results dictionary
    results = {
        "set1_count": len(set1_ids),
        "set2_count": len(set2_ids),
        "operations": {},
    }

    # Add intersection if not empty
    if len(intersection_ids) > 0:
        results["operations"]["intersection"] = {
            "count": len(intersection_ids),
            "data": process_selection(intersection_ids.tolist()),
        }

    # Always include union if it's not empty
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


@app.post("/neighborhood/{dataset_name}")
async def neighbors(dataset_name: str, selection_data: SelectionSet):
    dataset = load_dataset(dataset_name)
    selection_ids = [parse_id(_) for _ in selection_data.set]

    # Determine which tree and coordinates to use based on coordinate_space
    coordinate_space = selection_data.coordinate_space if hasattr(selection_data, 'coordinate_space') else 'spatial'
    
    if coordinate_space == 'spatial':
        tree = dataset["spatial_tree"]
        coord_columns = ["X_centroid", "Y_centroid"]
    else:  # embedding
        tree = dataset["embedding_tree"]
        coord_columns = ["UMAP_X", "UMAP_Y"]

    # Ensure the tree exists
    if tree is None:
        tree = cKDTree(dataset["csv_df"][coord_columns].values)
        if coordinate_space == 'spatial':
            dataset["spatial_tree"] = tree
        else:
            dataset["embedding_tree"] = tree

    indices = dataset["csv_df"][dataset["csv_df"]["CellID"].isin(selection_ids)].index.values
    points = dataset["csv_df"].iloc[indices][coord_columns].values

    # Get mode and parameters from request
    mode = selection_data.mode if hasattr(selection_data, 'mode') else 'knn'
    knn = selection_data.knn if hasattr(selection_data, 'knn') else 10
    radius = selection_data.radius if hasattr(selection_data, 'radius') else 50

    if mode == 'knn':
        # KNN mode - find k nearest neighbors
        neighbors = tree.query(points, k=knn + 1)  # +1 because first neighbor is self
        neighbor_indices = neighbors[1][:, 1:]  # exclude self from neighbors
        # Flatten and get unique indices
        neighbor_indices = np.unique(neighbor_indices.flatten())
    else:
        # Distance mode - find all points within radius
        neighbors = tree.query_ball_point(points, radius)
        # Flatten and get unique indices
        neighbor_indices = np.unique([idx for sublist in neighbors for idx in sublist])

    neighbor_cellids = dataset["csv_df"].iloc[neighbor_indices]["CellID"].values
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
    if image_path.startswith("http"):
        return RedirectResponse(url=image_path)
    return FileResponse(image_path)


@app.get("/files/embedding_image.ome.tif")
async def serve_embedding_image():
    global embedding_image_path
    if embedding_image_path.startswith("http"):
        return RedirectResponse(url=embedding_image_path)
    return FileResponse(embedding_image_path)


@app.get("/files/embedding_segmentation.ome.tif")
async def serve_embedding_segmentation():
    global embedding_segmentation_path
    if embedding_segmentation_path.startswith("http"):
        return RedirectResponse(url=embedding_segmentation_path)
    return FileResponse(embedding_segmentation_path)


@app.get("/files/segmentation.ome.tif")
async def serve_segmentation():
    global segmentation_path
    if segmentation_path.startswith("http"):
        return RedirectResponse(url=segmentation_path)
    return FileResponse(segmentation_path)


@app.get("/files/csv.csv")
async def serve_csv():
    global csv_path
    if csv_path.startswith("http"):
        return RedirectResponse(url=csv_path)
    return FileResponse(csv_path)


@app.get("/files/set_csv.csv")
async def serve_set_csv():
    global set_csv_path
    if set_csv_path.startswith("http"):
        return RedirectResponse(url=set_csv_path)
    return FileResponse(set_csv_path)


# load()
if __name__ == "__main__":
#     load()
    uvicorn.run("main:app", host="0.0.0.0", port=8181, reload=True, workers=8)
