# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: FastAPI service and METAR decoding logic.
  - `backend/main.py`: API entrypoint (`/` and `/decode`).
  - `backend/decoder.py`: `SpanishMetarParser` regex-based parser.
  - `backend/airports.py`: ICAO-to-airport mapping.
- `frontend/`: Vite + React app.
  - `frontend/src/`: UI components and app logic.
  - `frontend/public/`: static assets.
- Root-level utilities: `test_parser.py` (parser smoke test), `README.md`, `pyproject.toml`.

Do not edit generated or dependency folders such as `frontend/node_modules/` or commit `frontend/dist/`.

## Build, Test, and Development Commands
- Backend run (no venv): `$env:UV_CACHE_DIR="$PWD\\.uv-cache"; uv run --no-project --with fastapi --with uvicorn --with pydantic python -m backend.main --host 127.0.0.1 --port 8000`
- Alternative backend script: `./start_backend.ps1 -Mode Foreground`
- Frontend setup: `cd frontend; npm install`
- Frontend dev server: `npm run dev`
- Frontend lint: `npm run lint`
- Frontend build/preview: `npm run build` / `npm run preview`
- Parser smoke test (no venv): `uv run --no-project --with fastapi --with uvicorn --with pydantic python test_parser.py`

## Coding Style & Naming Conventions
- Python: PEP 8, 4-space indentation, `snake_case` for functions/variables, `PascalCase` for classes.
- React: functional components in `PascalCase` (example: `InstrumentCard`), state/hooks in `camelCase`.
- Frontend style: single quotes, no semicolons, Tailwind utility classes in JSX.
- Keep responsibilities separated: parsing in `decoder.py`, HTTP endpoints in `main.py`.

## Testing Guidelines
- Current baseline check: `python test_parser.py`.
- Add new tests under `tests/` using `test_*.py` naming.
- Prefer focused cases (wind, visibility, weather, clouds, QNH) rather than broad mixed assertions.
- For frontend changes, run `npm run lint` and include brief manual UI verification notes.

## Commit & Pull Request Guidelines
- Use Conventional Commits (examples: `feat: add CAVOK edge-case handling`, `fix: correct malformed QNH token parsing`).
- PRs should include:
  - clear scope and rationale,
  - linked issue/task (if available),
  - test evidence (`python test_parser.py`, `npm run lint`),
  - screenshots/GIFs for UI changes in `frontend/src/App.jsx`.

## Security & Configuration Tips
- `backend/main.py` currently permits broad CORS for local development; restrict `allow_origins` for production.
- `frontend/src/App.jsx` uses a local API URL; prefer environment-based configuration for deploys.
