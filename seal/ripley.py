import matplotlib.pyplot as plt
import numpy as np
import ripleyk
import locan as lc
from scipy.spatial.distance import pdist
from scipy.spatial import ConvexHull, Delaunay
from scipy.spatial import cKDTree
import pandas as pd
from tqdm import tqdm


def num_pairwise(x):
    return ((x ** 2) / 2 - x / 2)


def manual_ripley(data):
    distances = pdist(data)
    return distances


def calculate_ripley_h(k, radaii):
    l_estimate = np.sqrt(k / np.pi)
    h_estimate = l_estimate - radaii
    return h_estimate


def calculate_ripley_k(distances, radaii, density, n):
    n_pairs_less_than_d = (distances < radaii.reshape(-1, 1))
    n_pairs_less_than_d_sum = n_pairs_less_than_d.sum(axis=1)
    k_estimate = ((n_pairs_less_than_d_sum * 2) / n) / density
    return k_estimate, n_pairs_less_than_d_sum[-1]


def k_function_subsample(distances, radii, n, density, f):
    n_pairs_less_than_d = (distances < radii.reshape(-1, 1)).sum(axis=1)
    k_estimate = ((n_pairs_less_than_d * 2) / n) / density

    # Adjust for subsampling factor
    k_estimate *= (1 / f)

    return k_estimate


def subsample_k_by_random_pairs(data, n_pairs):
    # Determine subsample_size pairs of points in data
    pairs = np.random.choice(data.shape[0], (n_pairs, 2))
    # make sure that the same point is not selected twice
    pair_distances = np.linalg.norm(data[pairs[:, 0]] - data[pairs[:, 1]], axis=1)
    # drop distances that are 0
    print('diff', pair_distances[pair_distances != 0].shape[0] - pair_distances.shape[0])
    pair_distances = pair_distances[pair_distances != 0]
    return pair_distances


def calculate_set_signatures(sets, df, subsample_size=1000000, radius=200):
    radii = np.linspace(0, radius, 50)
    all_coordinates = df[["X_centroid", "Y_centroid"]].values
    N = all_coordinates.shape[0]

    return_dict = {}

    for _set in sets:
        set_dict = {}
        for child in _set.children:
            child_ids = [int(_[0]) - 1 for _ in child.set]
            if len(child_ids) == 0:
                continue
            data = df[df['CellID'].isin(child_ids)][["X_centroid", "Y_centroid"]].values
            this_hull = ConvexHull(data)
            density = data.shape[0] / this_hull.volume
            subsample_distances = subsample_k_by_random_pairs(data, subsample_size)
            k_random, num_valid = calculate_ripley_k(subsample_distances, radii, density, N)
            h_random = calculate_ripley_h(k_random, radii)
            set_dict[child.name] = {'k': k_random.tolist(), 'h': h_random.tolist()}
        return_dict[_set.name] = set_dict
    return return_dict


def calculate_k_cross(set_a_ids, set_b_ids, csv_df, subsample_size=1000000, radius=200):
    # Define radii for which we compute the cross-K
    radii = np.linspace(0, radius, 50)
    
    # Extract coordinates for Set A and Set B based on their IDs
    data_a = csv_df[csv_df['CellID'].isin(set_a_ids)][["X_centroid", "Y_centroid"]].values
    data_b = csv_df[csv_df['CellID'].isin(set_b_ids)][["X_centroid", "Y_centroid"]].values
    
    # Combine the coordinates of Set A and Set B for density calculation
    combined_data = np.vstack((data_a, data_b))
    
    # Get the number of points in both sets
    N_a = data_a.shape[0]
    N_b = data_b.shape[0]
    total_n = N_a + N_b  # Total number of points in both sets
    
    # Compute the convex hull volume for the combined sets to estimate the combined density
    combined_hull = ConvexHull(combined_data)
    combined_density = total_n / combined_hull.volume  # Density based on the total number of points
    
    # Subsample distances: Randomly select pairs of points between Set A and Set B
    subsample_distances = subsample_k_by_random_pairs_between_sets(data_a, data_b, subsample_size)
    
    # Calculate Ripley's cross-K function based on the subsampled distances
    k_cross, num_valid = calculate_ripley_k(subsample_distances, radii, combined_density, total_n)
    
    # Calculate Ripley's H cross-function from the K cross-function
    h_cross = calculate_ripley_h(k_cross, radii)
    
    # Return the results as a dictionary (similar to set_signatures)
    result = {'k': k_cross.tolist(), 'h': h_cross.tolist()}
    
    return result

def subsample_k_by_random_pairs_between_sets(data_a, data_b, n_pairs):
    """
    Randomly selects a specified number of pairs between two sets of points
    and calculates the Euclidean distances between the pairs.
    """
    # Randomly select pairs of points from Set A and Set B
    indices_a = np.random.choice(data_a.shape[0], n_pairs)
    indices_b = np.random.choice(data_b.shape[0], n_pairs)
    
    # Calculate the pairwise distances between the selected pairs
    pair_distances = np.linalg.norm(data_a[indices_a] - data_b[indices_b], axis=1)
    
    # Drop distances that are 0 (though this should rarely happen between sets)
    pair_distances = pair_distances[pair_distances != 0]
    
    return pair_distances
