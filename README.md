# METAR-Stall: Decodificador Meteorológico Aeronáutico

Sistema para la visualización y decodificación técnica de mensajes METAR con una interfaz minimalista orientada a operaciones aeronáuticas.

## Estructura del Proyecto
- `backend/` — API FastAPI (Python) con parser METAR para aeropuertos españoles.
- `frontend/` — SPA React + Vite con diseño minimalista 2026 (azul/oscuro).
- `start_all.ps1` — **Lanzador unificado**: inicia backend + frontend con un solo comando.

---

## Inicio Rápido (recomendado)

Abre una terminal PowerShell en la raíz del proyecto y ejecuta:

```powershell
./start_all.ps1
```

El script:
1. Verifica que `uv` y `npm` estén instalados.
2. Instala dependencias del frontend si es necesario.
3. Levanta el backend en `http://127.0.0.1:8000`.
4. Levanta el frontend en `http://localhost:5173`.
5. **Abre el navegador automáticamente**.
6. Al pulsar `Ctrl+C`, detiene ambos procesos limpiamente.

---

## Inicio Manual (alternativo)

### Backend
```powershell
$env:UV_CACHE_DIR="$PWD\.uv-cache"
uv run --no-project --with fastapi --with uvicorn --with pydantic python -m backend.main --host 127.0.0.1 --port 8000
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

---

## Requisitos
- **Python 3.12+** y **uv**
- **Node.js 18+** y **npm**

---

## Pruebas automáticas (backend)

```powershell
$env:UV_CACHE_DIR="$PWD\.uv-cache"
uv run --no-project --with fastapi --with uvicorn --with pydantic --with pytest --with httpx python -m pytest -q
```

---

## Integración Continua

El repo incluye `.github/workflows/ci.yml` que ejecuta:
- Backend: `pytest`
- Frontend: `npm run lint` + `npm run build`

---

## Uso básico

1. Ejecuta `./start_all.ps1`.
2. El navegador abrirá `http://localhost:5173`.
3. Pulsa **"Ver ejemplo guiado"** o **"Nuevo reporte"** para pegar un METAR.
4. El visualizador interactivo del mensaje te mostrará cada grupo codificado con su significado.

**Ejemplo de METAR:**
```
METAR LEBL 121330Z 21015G25KT 180V250 9999 FEW030 14/05 Q1012=
```
