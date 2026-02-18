# METAR-Stall: Decodificador Meteorológico Aeronáutico

Sistema completo para la visualización y decodificación técnica de mensajes METAR, con una interfaz inmersiva tipo "Glass Cockpit" y un motor de procesamiento robusto en Python.

## Estructura del Proyecto
- `backend/`: API construida con FastAPI (Python).
- `frontend/`: Aplicación SPA con React + Vite + Tailwind CSS.
- `docs/`: Documentación técnica y manuales de meteorología (PDFs en raíz).

---

## Requisitos Previos
- **Python 3.12+**
- **Node.js 18+** y **npm**
- **uv** (Recomendado para la gestión de Python)

---

## Cómo Ejecutar el Proyecto

### 1. Iniciar el Backend (API)

Desde la **raíz del proyecto**, ejecuta los siguientes comandos:

```powershell
# Usar cache local de uv (evita errores de permisos en cache global)
$env:UV_CACHE_DIR="$PWD\\.uv-cache"

# Ejecutar backend sin venv del proyecto
uv run --no-project --with fastapi --with uvicorn --with pydantic python -m backend.main --host 127.0.0.1 --port 8000
```
El API estará disponible en `http://127.0.0.1:8000`.

*Nota: Es importante ejecutarlo desde la raíz para que las importaciones modulares (`backend.main`) funcionen correctamente. En este flujo no se usa `.venv`.*

Atajo con script:
```powershell
./start_backend.ps1 -Mode Foreground
```

### 2. Iniciar el Frontend (Web)

Desde una nueva terminal, navega a la carpeta `frontend`:

```powershell
cd frontend

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```
La aplicación web se abrirá normalmente en `http://localhost:5173`.

---

## Configuración de Variables de Entorno

### Frontend (`frontend/.env`)
Asegúrate de que el archivo `.env` apunte a la dirección de tu backend:
```env
VITE_API_URL=http://127.0.0.1:8000
```

---

## Cómo Probar la Web

Con backend y frontend levantados, valida el flujo completo así:

1. Abre `http://localhost:5173`.
2. Pulsa el botón para abrir el modal de entrada METAR.
3. Pega un mensaje de prueba, por ejemplo:
   `LEMG 171100Z 20025G40KT 3000 TSRA BKN020CB OVC050 21/18 Q1006`
4. Ejecuta la decodificación.
5. Verifica que la interfaz muestra:
   - Aeropuerto y código ICAO.
   - Fecha/hora en UTC y hora de España (GMT+1/GMT+2).
   - Viento (grados, dirección cardinal y ráfagas si aplica).
   - Visibilidad en texto natural.
   - Fenómenos (`RA`, `FG`, `TSRA`, etc.) traducidos.
   - Nubes con cobertura en octas (por ejemplo `BKN` 5-7, `OVC` 8).
   - Temperatura, punto de rocío y QNH en hPa.

Prueba también con los casos de `Ejemplos METAR.md` para validar escenarios de lluvia, niebla, tormenta y baja visibilidad.

---

## Review del Repositorio

### Fortalezas
- **Interfaz Visual:** Excelente uso de Tailwind CSS y Framer Motion para lograr una estética de instrumentos de vuelo realistas (Glass Cockpit).
- **Arquitectura Limpia:** Separación clara entre el motor de decodificación y el servidor API.
- **Rendimiento:** El uso de `uv` y `FastAPI` garantiza un arranque y procesamiento extremadamente rápidos.
- **Documentación de Referencia:** El proyecto incluye manuales oficiales (PDFs) que sirven de base para la lógica del parser.

### Áreas de Mejora
- **Escalabilidad del Parser:** Actualmente muy enfocado en aeropuertos españoles. Se recomienda integrar una base de datos de aeropuertos mundial (ej. OurAirports).
- **Robustez:** El parser utiliza bloques `try-except` para ignorar fallos en tokens individuales. Aunque evita caídas, podría mejorarse el log de errores para depuración.
- **Validación:** Se ha añadido un archivo `pyproject.toml` en la raíz para estandarizar la gestión de dependencias con `uv`.

---

## Ejemplo de uso
Pega un METAR como este en el sistema:
`METAR LEBL 121330Z 21015G25KT 180V250 9999 FEW030 14/05 Q1012=`
