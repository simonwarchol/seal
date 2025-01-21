# %%
import matplotlib.pyplot as plt
import numpy as np
import locan as lc
from scipy.spatial.distance import pdist
from scipy.spatial import ConvexHull
from scipy.spatial import cKDTree
import pandas as pd
from tqdm import tqdm


def create_data(num_points, scale_factor=1):
    x1 = np.random.rand(num_points, 2)
    x2 = np.random.normal(0.5, 0.05, (num_points, 2))
    x3 = (
        np.random.normal(0.05, 0.01, (num_points, 2))
        + np.random.randint(0, 10, (num_points, 2)) / 10
    )
    return x1 * scale_factor, x2 * scale_factor, x3 * scale_factor


def num_pairwise(x):
    return (x**2) / 2 - x / 2


def manual_ripley(data):
    return pdist(data)


def calculate_ripley_h(k, radaii):
    l_estimate = np.sqrt(k / np.pi)
    return l_estimate - radaii


def calculate_ripley_k(distances, radaii, density, n):
    n_pairs_less_than_d = distances < radaii.reshape(-1, 1)
    n_pairs_less_than_d_sum = n_pairs_less_than_d.sum(axis=1)
    k_estimate = ((n_pairs_less_than_d_sum * 2) / n) / density
    return k_estimate, n_pairs_less_than_d_sum[-1]


def subsample_k_by_random_pairs(data, n_pairs):
    pairs = np.random.choice(data.shape[0], (n_pairs, 2))
    return np.linalg.norm(data[pairs[:, 0]] - data[pairs[:, 1]], axis=1)


def k_sample(distances, radii, density, N):
    n_pairs_subsample = len(distances)
    n_pairs_total = (N * (N - 1)) // 2
    n_pairs_less_than_d = (distances < radii.reshape(-1, 1)).sum(axis=1)
    scaling_factor = n_pairs_total / n_pairs_subsample
    n_pairs_less_than_d_adjusted = n_pairs_less_than_d * scaling_factor
    k_estimate = ((n_pairs_less_than_d_adjusted * 2) / N) / density
    return k_estimate


def calculate_k_values(data, radaii, density, subsample_size, N, calculate_full_ripley=False):
    if calculate_full_ripley:
        manual_distances = manual_ripley(data)
        k_manual, _ = calculate_ripley_k(manual_distances, radaii, density, N)
        h_manual = calculate_ripley_h(k_manual, radaii)

    else:
        k_manual = None
        h_manual = None
    subsample_distances = subsample_k_by_random_pairs(data, subsample_size)
    k_random = k_sample(subsample_distances, radaii, density, N)

    h_random = calculate_ripley_h(k_random, radaii)

    return k_manual, k_random, h_manual, h_random


def plot_results(xs, k_values, radaii, labels = None):
    fig, _ax = plt.subplots(2, 2, figsize=(10, 10))
    ax = _ax.flatten()
    print(len(xs), len(k_values), len(labels))

    for data, (k_manual, k_random, h_manual, h_random), label in zip(
        xs, k_values, labels
    ):
        if k_manual:
            ax[1].plot(radaii, k_manual, label=label)
        ax[2].plot(radaii, k_random, label=label)
        ax[3].plot(radaii, h_random, label=label)
        ax[0].scatter(data[:, 0], data[:, 1], s=1, label=label)

    ax[0].set_title("Data")
    ax[1].set_title("K")
    ax[2].set_title("K*")
    ax[3].set_title("H")

    for a in ax:
        a.legend()

    plt.show()


def synthetic():
    radius = 2
    x1, x2, x3 = create_data(10000, scale_factor=10)

    combined_data = np.vstack([x1, x2, x3])
    hull = ConvexHull(combined_data)
    area = hull.volume
    density = combined_data.shape[0] / area

    # Calculate K values
    radaii = np.linspace(0, radius, 10000)
    subsample_size = 10000
    N = x1.shape[0]
    k_values = [
        calculate_k_values(data, radaii, density, subsample_size, N)
        for data in [x1, x2, x3]
    ]

    # Plot results
    plot_results([x1, x2, x3], k_values, radaii, ["x1", "x2", "x3"])

def real_data():
    df = pd.read_parquet('/Users/swarchol/Research/bed/data/clustering.parquet')
    all_coordinates = df[["X_centroid", "Y_centroid"]].values
    N = all_coordinates.shape[0]
    hull = ConvexHull(all_coordinates)
    area = hull.volume
    density = N / area
    radii = np.linspace(0, 1000, 50)
    # What is the average distance between points?
    print(area, N, density)
    subsample_size = 10000
    k_values = []
    xs = []
    for cluster in tqdm(df["cluster_2d"].value_counts().keys().tolist()):
        data = df[df["cluster_2d"] == cluster][["X_centroid", "Y_centroid"]].values
        xs.append(data)
        k_values.append(calculate_k_values(data, radii, density, subsample_size, N, calculate_full_ripley=False))
    plot_results(xs, k_values, radii, df["cluster_2d"].value_counts().keys().tolist())

    
real_data()
