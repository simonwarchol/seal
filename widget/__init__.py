import importlib.metadata
import pathlib

import anywidget
import traitlets

try:
    __version__ = importlib.metadata.version("seal")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"


class Seal(anywidget.AnyWidget):
    build_dir = pathlib.Path(__file__).parents[3] / "widget" / "static"
    _esm = build_dir / "seal.mjs"
    _css = build_dir / "seal.css"
    value = traitlets.Int(0).tag(sync=True)
