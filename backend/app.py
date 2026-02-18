import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import MetarRequest, MetarResponse
from .service import decode_metar_payload


def _cors_origins() -> list[str]:
    raw = os.getenv(
        "METAR_STALL_ALLOW_ORIGINS",
        "http://127.0.0.1:5173,http://localhost:5173",
    )
    parsed = [origin.strip() for origin in raw.split(",") if origin.strip()]
    return parsed or ["http://127.0.0.1:5173", "http://localhost:5173"]


def create_app() -> FastAPI:
    app = FastAPI(title="METAR-Stall API")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins(),
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.post("/decode", response_model=MetarResponse)
    async def decode_metar(request: MetarRequest):
        try:
            return decode_metar_payload(request.metar)
        except ValueError as error:
            raise HTTPException(status_code=400, detail=str(error)) from error
        except Exception as error:
            raise HTTPException(status_code=500, detail="Error interno al procesar el METAR") from error

    @app.get("/")
    async def root():
        return {"message": "Spanish METAR Decoder API is running"}

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return app


app = create_app()
