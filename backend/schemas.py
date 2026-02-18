import re

from pydantic import BaseModel, Field, field_validator


class MetarRequest(BaseModel):
    metar: str = Field(..., min_length=8, max_length=512)

    @field_validator("metar")
    @classmethod
    def validate_metar(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("El METAR está vacío.")
        if not re.fullmatch(r"[A-Za-z0-9\s/+=\-.]+", cleaned):
            raise ValueError("El METAR contiene caracteres no válidos.")
        return cleaned


class WindInfo(BaseModel):
    direction: str | None = None
    speed: str | None = None
    gusts: str | None = None
    variation: str | None = None
    degrees: int | None = None
    text: str | None = None


class VisibilityInfo(BaseModel):
    main: str | None = None
    minimum: str | None = None
    vertical: str | None = None
    text: str | None = None


class TemperatureInfo(BaseModel):
    air: str | None = None
    dewpoint: str | None = None
    text: str | None = None


class MetarResponse(BaseModel):
    raw: str
    station: str | None = None
    airport_name: str | None = None
    datetime: str | None = None
    auto_report: bool = False
    wind: WindInfo = Field(default_factory=WindInfo)
    visibility: VisibilityInfo = Field(default_factory=VisibilityInfo)
    weather: list[str] = Field(default_factory=list)
    recent_weather: list[str] = Field(default_factory=list)
    clouds: list[str] = Field(default_factory=list)
    temperature: TemperatureInfo = Field(default_factory=TemperatureInfo)
    qnh: str | None = None
    qnh_text: str | None = None
    rvr: list[str] = Field(default_factory=list)
    remarks: str | None = None
    trends: list[str] = Field(default_factory=list)
    unavailable_groups: list[str] = Field(default_factory=list)
    report_text: str | None = None
