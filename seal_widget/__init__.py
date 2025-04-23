import importlib.metadata
import pathlib
import subprocess
import threading

import anywidget
import traitlets


try:
    __version__ = importlib.metadata.version("seal_widget")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"


class Seal(anywidget.AnyWidget):
    """Seal widget"""

    build_dir = pathlib.Path(__file__).parents[1] / "seal_widget" / "static"
    _esm = build_dir / "index.js"
    _css = build_dir / "index.css"
    value = traitlets.Int(0).tag(sync=True)
    config = traitlets.Dict().tag(sync=True)
    server_url = traitlets.Unicode("http://localhost:8181").tag(sync=True)

    def __init__(self, df, config, server_url="http://localhost:8181", **kwargs):
        super().__init__(**kwargs)
        # Start the FastAPI server in a separate thread
        self.df = df
        self.config = config
        self.server_url = server_url
        print("Starting server", server_url)
        self.server_thread = threading.Thread(target=self._start_server, daemon=True)
        self.server_thread.start()

    def _start_server(self):
        # Import and run the FastAPI server
        from seal_widget.main import app, load_dataset
        import uvicorn

        load_dataset(self.df)
        uvicorn.run(app, host="localhost", port=8181)
