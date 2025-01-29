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
selection_pkl = None
dataset_name = None


def get_shapes(path):
    with tf.TiffFile(path, is_ome=False) as imgio:
        img = zarr.open(imgio.series[0].aszarr())
        shapes = [img[i].shape for i in range(len(img))]
    return shapes


# @profile
def load(dataset="exemplar-001", df=None):
    global shapes, csv_df, tree, tile_size, image_io, image_zarr, seg_io, seg_zarr, set_csv_path
    global segmentation_path, csv_path, image_path, cut_seg_cells, cut_cells, embedding_image_path, embedding_segmentation_path
    global selection_pkl, dataset_name

    if csv_df is not None:
        return
    if False:
        print("Loading", dataset, df)
        dataset_name = "exemplar"
        image_path = (
            "/Users/swarchol/Research/exemplar-001/registration/exemplar-001.ome.tif"
        )
        segmentation_path = "/Users/swarchol/Research/exemplar-001/segmentation/unmicst-exemplar-001/nuclei.ome.tif"
        embedding_image_path = "/Users/swarchol/Research/exemplar-001/new/tiled.ome.tif"
        embedding_segmentation_path = (
            "/Users/swarchol/Research/exemplar-001/new/tiled-mask.ome.tif"
        )
        csv_path = "/Users/swarchol/Research/exemplar-001/new/updated.csv"

        # cut_seg_cells = zarr.open(
        #     "/Users/swarchol/Research/exemplar-001/cellcutter/cut_mask"
        # )
        # cut_cells = zarr.open("/Users/swarchol/Research/exemplar-001/cellcutter/cut")
        cut_cells = None
        parquet_path = None
    else:
        image_path = "/Volumes/Simon/Greg/WD-76845-097.ome.tif"
        segmentation_path = "/Volumes/Simon/Greg/WD-76845-097_mask_pyr.ome.tif"
        embedding_image_path = "/Volumes/Simon/Greg/tiled.ome.tif"
        embedding_segmentation_path = "/Volumes/Simon/Greg/tiled-mask.ome.tif"
        csv_path = "/Users/swarchol/Research/seal/data/updated_renamed.csv"
        set_csv_path = "/Users/swarchol/Research/seal/data/small.csv"
        parquet_path = None
        cut_cells = None
        dataset_name = "greg"
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
    #
    tile_size = 1024

    selection_pkl = pickle.load(
        open("/Users/swarchol/Research/seal/data/results.pickle", "rb")
    )


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


class SelectionGroup(BaseModel):
    name: str
    children: List[SelectionSet]


class SelectionData(BaseModel):
    sets: List[SelectionGroup]


def parse_id(_id):
    try:
        id = int(_id[0])
    except TypeError:
        id = int(_id[0][0])
    return id


@app.post("/selection")
async def handle_selection(selection_data: SelectionSet):
    global selection_pkl, dataset_name
    changes = False
    path = selection_data.path
    print('path', path)
    selection_ids = [parse_id(_) for _ in selection_data.set]

    if dataset_name not in selection_pkl:
        selection_pkl[dataset_name] = {}
        changes = True
    if path[0] not in selection_pkl[dataset_name]:
        selection_pkl[dataset_name][path[0]] = {}
        changes = True
    if path[1] not in selection_pkl[dataset_name][path[0]]:
        selection_pkl[dataset_name][path[0]][path[1]] = {}
        changes = True
    else:
        existing_ids = selection_pkl[dataset_name][path[0]][path[1]].get("cell_ids", [])
        if existing_ids != selection_ids:
            selection_pkl[dataset_name][path[0]][path[1]] = {}
            changes = True
        else:
            results_dict = selection_pkl[dataset_name][path[0]][path[1]]

            # Check if 'hulls' already exists
            if "hulls" in results_dict:
                return {
                    "message": "Complete",
                    "data": {
                        "feat_imp": results_dict["feat_imp"],
                        "hulls": results_dict["hulls"],
                    },
                }
            print("Returning existing results", results_dict)
            try:
                feat_imp = results_dict["feat_imp"]
            except:
                # Throw error
                raise ValueError("No feat_imp for selection", path)
            return {
                "message": "Complete",
                "data": {"feat_imp": feat_imp, "hulls": results_dict["hulls"]},
            }
    # return {"message": "Complete", "data": {"path": path, "dataset": dataset_name}}

    # Proceed with computations if no existing data or changes
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
    ]
    all_features = list(set(all_features))

    # Check which of the potential features are in the csv_df
    potential_features = [
        feature for feature in all_features if feature in csv_df.columns
    ]
    sel_df = csv_df.drop(
        [
            "Area",
            "MajorAxisLength",
            "MinorAxisLength",
            "Eccentricity",
            "Solidity",
            "Extent",
            "Orientation",
            "DNA_1",
            "DNA_2",
            "DNA_3",
            "DNA_4",
            "DNA_5",
            "DNA_6",
            "DNA_7",
            "DNA_8",
            "DNA_9",
            "DNA_10",
            "DNA_11",
            "DNA_12",
            "DNA_13",
        ],
        axis=1,
        errors="ignore",
    )

    sel_df["in_selection"] = 0
    sel_df.loc[sel_df["CellID"].isin(selection_ids), "in_selection"] = 1

    x_df = sel_df[potential_features]
    y_df = sel_df[["in_selection"]]
    feature_names = x_df.columns
    model = xgb.XGBClassifier(objective="multi:softmax", num_class=len(np.unique(y_df)))
    random_subset = np.random.choice(x_df.shape[0], 5000, replace=False)
    x_subset_values = x_df.values[random_subset]
    y_subset_values = y_df.values[random_subset]
    x_train, x_test, y_train, y_test = train_test_split(
        x_subset_values, y_subset_values, test_size=0.2, random_state=42
    )

    model.fit(x_train, y_train)

    explainer = shap.Explainer(model)
    shap_values = explainer(x_test)
    these_results = {}
    avg_shap = shap_values.values[:, :, 1].mean(0)

    these_results["shap_values"] = avg_shap.tolist()
    these_results["shap_importance"] = np.abs(avg_shap).mean().item()
    these_results["cell_ids"] = selection_ids
    these_results["coordinates"] = {}

    embedding_coordinates = csv_df.loc[csv_df["CellID"].isin(selection_ids)][
        ["UMAP_X", "UMAP_Y"]
    ].values
    spatial_coordinates = csv_df.loc[csv_df["CellID"].isin(selection_ids)][
        ["X_centroid", "Y_centroid"]
    ].values
    results = process_coordinates(spatial_coordinates, embedding_coordinates)
    these_results["hulls"] = results

    feat_imp = list(zip(feature_names, avg_shap.tolist()))
    these_results = {"feat_imp": feat_imp, "hulls": results}

    # Save the results to the pickle if not already done
    selection_pkl[dataset_name][path[0]][path[1]] = these_results
    if changes:
        # You should write the updated selection_pkl to the pickle file at this point.
        with open("/Users/swarchol/Research/seal/data/results.pickle", "wb") as f:
            pickle.dump(selection_pkl, f)

    return {"message": "Complete", "data": {"feat_imp": feat_imp, "hulls": results}}


@app.post("/neighborhood")
async def neighbors(selection_data: SelectionSet):
    global tree, csv_df
    selection_ids = [parse_id(_) for _ in selection_data.set]
    if tree is None:
        tree = cKDTree(csv_df[["X_centroid", "Y_centroid"]].values)

    indices = csv_df[csv_df["CellID"].isin(selection_ids)].index.values
    # find nearest neighbor to each index
    neighbors = tree.query(csv_df.iloc[indices][["X_centroid", "Y_centroid"]].values, k=2)
    neighbor_indices = neighbors[1][:, 1]
    print('neighbor_indices', len(neighbor_indices), len(selection_ids))
    neighbor_cellids = csv_df.iloc[neighbor_indices]["CellID"].values
    return {"neighbors": neighbor_cellids.tolist()}


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
