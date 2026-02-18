from .decoder import SpanishMetarParser


def decode_metar_payload(metar: str) -> dict:
    parser = SpanishMetarParser(metar)
    return parser.parse()
