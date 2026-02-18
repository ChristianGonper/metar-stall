from .decoder import SpanishMetarParser
from .schemas import MetarResponse


def decode_metar_payload(metar: str) -> MetarResponse:
    parser = SpanishMetarParser(metar)
    return MetarResponse.model_validate(parser.parse())
