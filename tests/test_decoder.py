from backend.decoder import SpanishMetarParser


def test_decoder_extracts_core_fields():
    metar = "METAR LEBL 121400Z 02010KT 5000 -RA BR BKN010 10/09 Q1008 NOSIG="
    decoded = SpanishMetarParser(metar).parse()

    assert decoded["station"] == "LEBL"
    assert decoded["wind"]["speed"] == "10 kt"
    assert decoded["visibility"]["main"] == "5000 m"
    assert "lluvia ligera" in decoded["weather"]
    assert "neblina" in decoded["weather"]
    assert decoded["qnh"] == "1008 hPa"
    assert decoded["temperature"]["air"] == "10ºC"
    assert decoded["temperature"]["dewpoint"] == "9ºC"
    assert decoded["trends"] == ["Sin cambios significativos (NOSIG)"]


def test_decoder_handles_cavok():
    metar = "METAR LEVC 121430Z 12005KT CAVOK 18/12 Q1015="
    decoded = SpanishMetarParser(metar).parse()

    assert decoded["visibility"]["main"] == "CAVOK"
    assert decoded["weather"] == []
    assert "Cielo despejado (CAVOK)" in decoded["clouds"]
