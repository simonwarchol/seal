import importlib.metadata
import pathlib
import subprocess
import threading

import anywidget
import traitlets


try:
    __version__ = importlib.metadata.version("seal")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"


class Seal(anywidget.AnyWidget):
    """Seal widget"""

    build_dir = pathlib.Path(__file__).parents[1] / "seal" / "static"
    _esm = build_dir / "index.js"
    _css = build_dir / "index.css"
    value = traitlets.Int(0).tag(sync=True)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Start the FastAPI server in a separate thread
        self.server_thread = threading.Thread(target=self._start_server, daemon=True)
        self.server_thread.start()

    def _start_server(self):
        # Import and run the FastAPI server
        from seal.main import app
        import uvicorn
        uvicorn.run(app, host="localhost", port=8181)

