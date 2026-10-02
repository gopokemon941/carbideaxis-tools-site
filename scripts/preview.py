"""Preview the static site locally, including its extensionless routes."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse

ROOT = Path(__file__).resolve().parents[1]

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path):
        local = Path(super().translate_path(path))
        if not local.exists() and not local.suffix and local.with_suffix('.html').is_file():
            return str(local.with_suffix('.html'))
        return str(local)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8765)
    options = parser.parse_args()
    print(f'Preview: http://127.0.0.1:{options.port}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', options.port), Handler).serve_forever()
