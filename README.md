# SEAL: Spatially-resolved Embedding Analysis with Linked Imaging Data

**Simon Warchol¹'², Grace Guo¹'², Johannes Knittel¹, Dan Freeman², Usha Bhalla¹, Jeremy Muhlich², Peter K. Sorger², and Hanspeter Pfister¹**

¹ Harvard John A. Paulson School of Engineering and Applied Sciences  
² Laboratory of Systems Pharmacology, Harvard Medical School

## Paper

📄 [bioRxiv Preprint](https://www.biorxiv.org/content/10.1101/2025.07.19.665696)

## Demo Datasets

### Lung Adenocarcinoma Specimen
From a larger tissue microarray (TMA), imaged using CyCIF with three cycles. Each cycle consists of six four-channel image tiles.

[📔 Open in Google Colab](https://colab.research.google.com/drive/19R40QsP7f5ZRu6L3BRfc3317_66yRL7S)

### Sloan Digital Sky Survey
Multi-spectral SDSS imaging of galaxies NGC 450 and UGC 807, capturing structural and spectral features across five filters.

## Installation

```sh
pip install seal
```

or with [uv](https://github.com/astral-sh/uv):

```sh
uv add seal
```

## Development

We recommend using [uv](https://github.com/astral-sh/uv) for development.
It will automatically manage virtual environments and dependencies for you.

```sh
uv run jupyter lab example.ipynb
```

Alternatively, create and manage your own virtual environment:

```sh
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
jupyter lab example.ipynb
```

The widget front-end code bundles it's JavaScript dependencies. After setting up Python,
make sure to install these dependencies locally:

```sh
npm install
```

While developing, you can run the following in a separate terminal to automatically
rebuild JavaScript as you make changes:

```sh
npm run dev
```

Open `example.ipynb` in JupyterLab, VS Code, or your favorite editor
to start developing. Changes made in `js/` will be reflected
in the notebook.
