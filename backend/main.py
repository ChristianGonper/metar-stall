import argparse

import uvicorn

from .app import app


def parse_args():
    parser = argparse.ArgumentParser(description="Run METAR-Stall backend")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--reload", action="store_true")
    return parser.parse_args()


def run():
    args = parse_args()
    uvicorn.run("backend.app:app", host=args.host, port=args.port, reload=args.reload)


if __name__ == "__main__":
    run()
