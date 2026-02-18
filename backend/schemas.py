from pydantic import BaseModel


class MetarRequest(BaseModel):
    metar: str
