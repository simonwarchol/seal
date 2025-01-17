import importlib.metadata
import pathlib

import anywidget
import traitlets

try:
    __version__ = importlib.metadata.version("seal")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"


class Seal(anywidget.AnyWidget):
    """Seal widget"""

    build_dir = pathlib.Path(__file__).parents[1] / "widget" / "static"
    _esm = build_dir / "index.js"
    _css = build_dir / "index.css"
    value = traitlets.Int(0).tag(sync=True)
