from backend.decoder import SpanishMetarParser

test_metars = [
    "METAR LEMD 121330Z 21015G25KT 180V250 9999 FEW030 14/05 Q1012=",
    "METAR LEBL 121400Z 02010KT 5000 -RA BR BKN010 10/09 Q1008 NOSIG=",
    "SPECI LEZG 121415Z 30020KT 2000 +TSGR BKN005CB 08/06 Q0998=",
    "METAR LEVC 121430Z 12005KT CAVOK 18/12 Q1015="
]

for m in test_metars:
    parser = SpanishMetarParser(m)
    decoded = parser.parse()
    print(f"\nRAW: {decoded['raw']}")
    print(f"Aeropuerto: {decoded['airport_name']} ({decoded['station']})")
    wind_info = f"{decoded['wind']['direction']} {decoded['wind']['speed']}"
    if decoded['wind']['gusts']: wind_info += f" Ráfagas: {decoded['wind']['gusts']}"
    print(f"Viento: {wind_info}")
    print(f"Visibilidad: {decoded['visibility']['main']}")
    weather_info = ', '.join(decoded['weather']) if decoded['weather'] else 'N/A'
    print(f"Meteorología: {weather_info}")
    clouds_info = ', '.join(decoded['clouds']) if decoded['clouds'] else 'N/A'
    print(f"Nubes: {clouds_info}")
    print(f"Temp/PR: {decoded['temperature']['air']} / {decoded['temperature']['dewpoint']}")
    print(f"Presión: {decoded['qnh']}")
    print("-" * 30)
