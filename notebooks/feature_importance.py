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
import matplotlib.pyplot as plt
import shap
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
import xgboost as xgb
import requests
from scipy.spatial import ConvexHull, Delaunay
import pickle
import os
import time
# import torch
# import torch.nn as nn
from tqdm.auto import tqdm
import numpy as np
from multiprocessing import Pool

csv_df = pd.read_csv('https://vae-bed.s3.us-east-2.amazonaws.com/updated_renamed.csv')
columns = csv_df.columns
feature_columns = ['DNA', 'DNA (2)', 'DNA (3)', 'CD3', 'CD45RO', 'DNA (4)',
       'Pan-cytokeratin', 'Aortic smooth muscle actin', 'DNA (5)', 'CD4',
       'CD45', 'PD-1', 'DNA (6)', 'CD20', 'CD68', 'CD8a', 'DNA (7)', 'CD163',
       'FOXP3', 'PD-L1', 'DNA (8)', 'E-cadherin', 'Vimentin', 'CDX-2',
       'DNA (9)', 'Lamin-A/B/C', 'Desmin', 'CD31', 'DNA (10)', 'PCNA',
       'Collagen',]

# regressor = xgb.XGBRegressor()
regressor = xgb.XGBRegressor(
                 n_estimators=2000,
                 max_depth=9,
                 seed=1000)

url = 'https://vae-bed.s3.us-east-2.amazonaws.com/xgb_regressor.json'
local_filename = 'xgb_regressor.json'

# Download the file
response = requests.get(url)
with open(local_filename, 'wb') as f:
    f.write(response.content)

regressor.load_model('xgb_regressor.json')


chunks = np.array_split(csv_df[feature_columns], 1000)

shap_values_list = []
explainer = shap.Explainer(regressor)
for chunk in tqdm(chunks, desc="Calculating SHAP values"):
    shap_values = explainer(chunk)
    shap_values_list.append(shap_values)
    shap_values_list = shap_values_list + shap_values.values
    break

    # # write to file
    # with open('shap_values.pkl', 'wb') as f:
    #     pickle.dump(shap_values_list, f)
print(len(shap_values_list))

# save shap values