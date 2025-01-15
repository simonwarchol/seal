import importlib.metadata
import pathlib

import anywidget
import traitlets

try:
    __version__ = importlib.metadata.version("seal")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"


class Seal(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "seal.js"
    _css = pathlib.Path(__file__).parent / "static" / "seal.css"
    value = traitlets.Int(0).tag(sync=True)
