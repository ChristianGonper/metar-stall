import re
from calendar import monthrange
from datetime import datetime, timedelta, timezone

from .airports import SPANISH_AIRPORTS


class SpanishMetarParser:
    def __init__(self, raw_metar):
        self.raw = raw_metar.strip().upper()
        self.tokens = self.raw.split()
        self.decoded = {
            "raw": self.raw,
            "station": None,
            "airport_name": "Desconocido",
            "datetime": None,
            "auto_report": False,
            "wind": {
                "direction": None,
                "speed": None,
                "gusts": None,
                "variation": None,
                "degrees": None,
                "text": None,
            },
            "visibility": {"main": None, "minimum": None, "vertical": None, "text": None},
            "weather": [],
            "recent_weather": [],
            "clouds": [],
            "temperature": {"air": None, "dewpoint": None, "text": None},
            "qnh": None,
            "qnh_text": None,
            "rvr": [],
            "remarks": None,
            "trends": [],
            "unavailable_groups": [],
            "report_text": None,
        }

    def validate_format(self):
        if not self.tokens:
            return False

        has_station = any(re.match(r"^[A-Z]{4}$", t) for t in self.tokens[:3])
        has_time = any(re.match(r"^\d{6}Z$", t) for t in self.tokens[:4])
        return has_station and has_time

    @staticmethod
    def _degrees_to_sector(degrees):
        sectors = [
            "norte",
            "noreste",
            "este",
            "sureste",
            "sur",
            "suroeste",
            "oeste",
            "noroeste",
        ]
        idx = int(((degrees % 360) + 22.5) // 45) % 8
        return sectors[idx]

    @staticmethod
    def _format_distance_meters(meters):
        if meters >= 9999:
            return "10 kilómetros o más"
        if meters >= 1000:
            km = meters // 1000
            rem = meters % 1000
            if rem == 0:
                unit = "kilómetro" if km == 1 else "kilómetros"
                return f"{km} {unit}"
            unit = "kilómetro" if km == 1 else "kilómetros"
            return f"{km} {unit} y {rem} metros"
        if meters == 1:
            return "1 metro"
        return f"{meters} metros"

    @classmethod
    def _decode_rvr_token(cls, token):
        # Examples: R19/0600, R19L/0800U, R27/P1500, R08/0600V1000N
        match = re.match(r"^R(\d{2}[LRC]?)/([MP]?\d{4}|////)(V([MP]?\d{4}))?([UDN])?(FT)?$", token)
        if not match:
            return None

        runway = match.group(1)
        main = match.group(2)
        var = match.group(4)
        tendency = match.group(5)
        is_ft = bool(match.group(6))

        def decode_value(raw):
            if raw in {"////", "////"}:
                return "dato no disponible"
            prefix = ""
            digits = raw
            if raw.startswith("P"):
                prefix = "más de "
                digits = raw[1:]
            elif raw.startswith("M"):
                prefix = "menos de "
                digits = raw[1:]
            if not digits.isdigit():
                return "dato no disponible"
            unit = "pies" if is_ft else "metros"
            return f"{prefix}{int(digits)} {unit}"

        tendency_text = {"U": "en aumento", "D": "en descenso", "N": "sin cambio"}.get(tendency)
        main_text = decode_value(main)
        sentence = f"RVR en pista {runway}: {main_text}"
        if var:
            sentence += f", variable hasta {decode_value(var)}"
        if tendency_text:
            sentence += f" ({tendency_text})"

        return sentence

    @staticmethod
    def _resolve_metar_datetime(day, hour, minute):
        now_utc = datetime.now(timezone.utc)
        candidates = []
        for month_shift in (-1, 0, 1):
            base = now_utc.replace(day=15, hour=0, minute=0, second=0, microsecond=0)
            month_base = base + timedelta(days=31 * month_shift)
            year = month_base.year
            month = month_base.month
            max_day = monthrange(year, month)[1]
            if day <= max_day:
                candidates.append(datetime(year, month, day, hour, minute, tzinfo=timezone.utc))
        if not candidates:
            return None
        return min(candidates, key=lambda dt: abs((dt - now_utc).total_seconds()))

    @staticmethod
    def _last_sunday(year, month):
        last_day = monthrange(year, month)[1]
        candidate = datetime(year, month, last_day, tzinfo=timezone.utc)
        while candidate.weekday() != 6:
            candidate -= timedelta(days=1)
        return candidate

    @classmethod
    def _spain_gmt_offset(cls, dt_utc):
        dst_start_day = cls._last_sunday(dt_utc.year, 3).day
        dst_end_day = cls._last_sunday(dt_utc.year, 10).day
        dst_start = datetime(dt_utc.year, 3, dst_start_day, 1, 0, tzinfo=timezone.utc)
        dst_end = datetime(dt_utc.year, 10, dst_end_day, 1, 0, tzinfo=timezone.utc)
        return 2 if dst_start <= dt_utc < dst_end else 1

    @staticmethod
    def _decode_weather_token(token):
        weather_map = {
            "VC": "en proximidades",
            "MI": "bajo",
            "BC": "bancos",
            "PR": "parcial",
            "DR": "ventisca baja",
            "BL": "ventisca alta",
            "SH": "chubasco",
            "TS": "tormenta",
            "FZ": "engelante",
            "DZ": "llovizna",
            "RA": "lluvia",
            "SN": "nieve",
            "SG": "cinarra",
            "IC": "cristales de hielo",
            "PL": "hielo granulado",
            "GR": "granizo",
            "GS": "granizo pequeño",
            "BR": "neblina",
            "FG": "niebla",
            "FU": "humo",
            "VA": "ceniza volcánica",
            "DU": "polvo",
            "SA": "arena",
            "HZ": "calima",
        }
        valid_codes = set(weather_map.keys())

        if not re.match(r"^[-+A-Z]+$", token):
            return None

        idx = 0
        intensity = ""
        if token.startswith("+"):
            intensity = "fuerte"
            idx = 1
        elif token.startswith("-"):
            intensity = "ligera"
            idx = 1

        vc = ""
        if token[idx:idx + 2] == "VC":
            vc = weather_map["VC"]
            idx += 2

        descriptor = ""
        if token[idx:idx + 2] in {"MI", "BC", "PR", "DR", "BL", "SH", "TS", "FZ"}:
            descriptor = weather_map[token[idx:idx + 2]]
            idx += 2

        phenomena_codes = []
        while idx + 1 < len(token):
            code = token[idx:idx + 2]
            if code not in valid_codes:
                return None
            phenomena_codes.append(code)
            idx += 2

        if not phenomena_codes:
            return None

        phenomena_text = " y ".join(weather_map[c] for c in phenomena_codes)
        core = f"{descriptor} con {phenomena_text}" if descriptor else phenomena_text

        if vc:
            core = f"{core} {vc}"

        if intensity:
            if descriptor:
                return f"{intensity} {core}"
            return f"{core} {intensity}"
        return core

    @staticmethod
    def _build_report_text(decoded):
        def clean_sentence(text):
            return text.rstrip(" .") + "."

        parts = []

        location = f"{decoded['airport_name']} ({decoded['station']})"
        parts.append(clean_sentence(f"Informe METAR decodificado para {location}"))

        if decoded.get("datetime"):
            parts.append(clean_sentence(decoded["datetime"]))

        if decoded.get("auto_report"):
            parts.append(clean_sentence("Este es un reporte automático (AUTO), por lo que algunos campos pueden venir incompletos"))

        if decoded["wind"].get("text"):
            parts.append(clean_sentence(decoded["wind"]["text"]))

        if decoded["visibility"].get("text"):
            parts.append(clean_sentence(decoded["visibility"]["text"]))

        if decoded.get("weather"):
            parts.append(clean_sentence("Fenómenos actuales: " + ", ".join(decoded["weather"])))

        if decoded.get("recent_weather"):
            parts.append(clean_sentence("Tiempo reciente observado: " + ", ".join(decoded["recent_weather"])))

        if decoded.get("clouds"):
            parts.append(clean_sentence("Estado de nubes: " + "; ".join(decoded["clouds"])))

        if decoded["temperature"].get("text"):
            parts.append(clean_sentence(decoded["temperature"]["text"]))

        if decoded.get("qnh_text"):
            parts.append(clean_sentence(decoded["qnh_text"]))

        if decoded.get("trends"):
            parts.append(clean_sentence("Tendencias: " + ", ".join(decoded["trends"])))

        if decoded.get("unavailable_groups"):
            parts.append(
                "Se detectaron grupos con barras ('/' o '//'), que indican dato no disponible o parcial: "
                + ", ".join(decoded["unavailable_groups"])
            )
            parts.append(clean_sentence(parts.pop()))

        return " ".join(parts)

    def parse(self):
        if not self.validate_format():
            raise ValueError("Formato METAR inválido: faltan estación o fecha/hora")

        start_idx = 0
        if self.tokens[0] in ["METAR", "SPECI"]:
            start_idx = 1

        if len(self.tokens) > start_idx:
            station = self.tokens[start_idx]
            self.decoded["station"] = station
            self.decoded["airport_name"] = SPANISH_AIRPORTS.get(station, "Aeropuerto no identificado")
            start_idx += 1

        if len(self.tokens) > start_idx and re.match(r"\d{6}Z", self.tokens[start_idx]):
            dt = self.tokens[start_idx]
            day = int(dt[:2])
            hour = int(dt[2:4])
            minute = int(dt[4:6])
            dt_utc = self._resolve_metar_datetime(day, hour, minute)
            if dt_utc:
                offset_hours = self._spain_gmt_offset(dt_utc)
                dt_es = dt_utc + timedelta(hours=offset_hours)
                offset_text = f"GMT+{offset_hours}"
                self.decoded["datetime"] = (
                    f"Día {dt_utc.day:02d} a las {dt_utc.hour:02d}.{dt_utc.minute:02d} UTC "
                    f"(España: día {dt_es.day:02d} a las {dt_es.hour:02d}.{dt_es.minute:02d}, {offset_text})"
                )
            start_idx += 1

        if len(self.tokens) > start_idx and self.tokens[start_idx] == "AUTO":
            self.decoded["auto_report"] = True
            self.decoded["remarks"] = "Reporte Automático"
            start_idx += 1

        remaining_tokens = self.tokens[start_idx:]

        if "AUTO" in remaining_tokens:
            self.decoded["auto_report"] = True
            if not self.decoded.get("remarks"):
                self.decoded["remarks"] = "Reporte Automático"
            remaining_tokens = [t for t in remaining_tokens if t != "AUTO"]

        self.decoded["unavailable_groups"] = [
            token for token in remaining_tokens if "//" in token or "///" in token
        ]

        remaining_text = " ".join(remaining_tokens)

        wind_match = re.search(r"\b(\d{3}|VRB)(\d{2,3})(G\d{2,3})?KT\b", remaining_text)
        if wind_match:
            dir_val = wind_match.group(1)
            speed_kt = int(wind_match.group(2))
            self.decoded["wind"]["speed"] = f"{speed_kt} kt"

            if dir_val != "VRB":
                degrees = int(dir_val)
                sector = self._degrees_to_sector(degrees)
                self.decoded["wind"]["degrees"] = degrees
                self.decoded["wind"]["direction"] = f"{degrees}° ({sector})"
                wind_text = f"Viento de {degrees} grados ({sector}) con {speed_kt} nudos"
            else:
                self.decoded["wind"]["direction"] = "Variable"
                wind_text = f"Viento variable con {speed_kt} nudos"

            if wind_match.group(3):
                gusts_kt = int(wind_match.group(3)[1:])
                self.decoded["wind"]["gusts"] = f"{gusts_kt} kt"
                wind_text += f" y ráfagas de hasta {gusts_kt} nudos"

            self.decoded["wind"]["text"] = wind_text
        else:
            wind_token_slash = next((t for t in remaining_tokens if t.endswith("KT") and "/" in t), None)
            if wind_token_slash:
                self.decoded["wind"]["direction"] = "No disponible"
                self.decoded["wind"]["speed"] = "No disponible"
                self.decoded["wind"]["text"] = (
                    f"Viento reportado como {wind_token_slash}, con datos parciales o no disponibles."
                )

        var_match = re.search(r"\b(\d{3})V(\d{3})\b", remaining_text)
        if var_match:
            self.decoded["wind"]["variation"] = f"Entre {var_match.group(1)}° y {var_match.group(2)}°"
            if self.decoded["wind"].get("text"):
                self.decoded["wind"]["text"] += (
                    f", variando entre {var_match.group(1)} y {var_match.group(2)} grados"
                )

        if "CAVOK" in remaining_text:
            self.decoded["visibility"]["main"] = "CAVOK"
            self.decoded["visibility"]["text"] = "Visibilidad de 10 kilómetros o más y sin nubes significativas"
            self.decoded["clouds"].append("Cielo despejado (CAVOK)")
        else:
            vis_token = next(
                (t for t in remaining_tokens if re.match(r"^\d{4}$", t) and int(t) <= 9999),
                None,
            )
            if vis_token:
                meters = int(vis_token)
                self.decoded["visibility"]["main"] = "10 km o más" if meters == 9999 else f"{meters} m"
                self.decoded["visibility"]["text"] = f"Visibilidad de {self._format_distance_meters(meters)}"
            else:
                vis_token_slash = next((t for t in remaining_tokens if re.match(r"^[\d/]{4}$", t) and "/" in t), None)
                if vis_token_slash:
                    self.decoded["visibility"]["main"] = vis_token_slash
                    self.decoded["visibility"]["text"] = (
                        f"Visibilidad no disponible o parcial (grupo {vis_token_slash})."
                    )

        rvr_descriptions = []
        for token in remaining_tokens:
            if token.startswith("R") and "/" in token:
                rvr_text = self._decode_rvr_token(token)
                if rvr_text:
                    rvr_descriptions.append(rvr_text)

        if rvr_descriptions:
            self.decoded["rvr"] = rvr_descriptions
            if self.decoded["visibility"]["text"]:
                self.decoded["visibility"]["text"] += ". " + " ".join(rvr_descriptions)
            else:
                self.decoded["visibility"]["text"] = " ".join(rvr_descriptions)

        vv_match = re.search(r"\bVV(\d{3}|///)\b", remaining_text)
        if vv_match:
            vv_value = vv_match.group(1)
            if vv_value == "///":
                vv_text = "Visibilidad vertical no disponible"
                self.decoded["visibility"]["vertical"] = "No disponible"
            else:
                feet = int(vv_value) * 100
                vv_text = f"Visibilidad vertical de {feet} pies"
                self.decoded["visibility"]["vertical"] = f"{feet} ft"

            if self.decoded["visibility"]["text"]:
                self.decoded["visibility"]["text"] += f". {vv_text}"
            else:
                self.decoded["visibility"]["text"] = vv_text

        temp_match = None
        for token in remaining_tokens:
            match_known_air = re.match(r"^(M?\d{2})/(M?\d{2}|/{1,2})$", token)
            match_known_dew = re.match(r"^(/{1,2})/(M?\d{2})$", token)
            if match_known_air:
                temp_match = (match_known_air.group(1), match_known_air.group(2))
                break
            if match_known_dew:
                temp_match = (match_known_dew.group(1), match_known_dew.group(2))
                break

        if temp_match:
            def convert_temp(token):
                if token in {"/", "//"}:
                    return "No disponible"
                if token.startswith("M"):
                    return f"-{int(token[1:])}ºC"
                return f"{int(token)}ºC"

            def convert_temp_text(token):
                if token in {"/", "//"}:
                    return "dato no disponible"
                if token.startswith("M"):
                    return f"-{int(token[1:])} grados"
                return f"{int(token)} grados"

            air, dew = temp_match
            self.decoded["temperature"]["air"] = convert_temp(air)
            self.decoded["temperature"]["dewpoint"] = convert_temp(dew)
            self.decoded["temperature"]["text"] = (
                f"Temperatura de {convert_temp_text(air)} y punto de rocío de {convert_temp_text(dew)}"
            )

        qnh_match = re.search(r"\bQ([\d/]{4})", remaining_text)
        if qnh_match:
            qnh_val = qnh_match.group(1)
            if "/" in qnh_val:
                self.decoded["qnh"] = "No disponible"
                self.decoded["qnh_text"] = f"QNH no disponible (grupo Q{qnh_val})"
            else:
                self.decoded["qnh"] = f"{qnh_val} hPa"
                self.decoded["qnh_text"] = f"QNH de {qnh_val} hectopascales"

        cloud_patterns = re.findall(r"\b(FEW|SCT|BKN|OVC|NSC|NCD)(\d{3}|///)?(CB|TCU)?\b", remaining_text)
        cloud_map = {
            "FEW": "Pocas nubes (1 a 2 octas)",
            "SCT": "Nubes dispersas (3 a 4 octas)",
            "BKN": "Parcialmente cubierto (5 a 7 octas)",
            "OVC": "Completamente cubierto (8 octas)",
            "NSC": "NSC: sin nubes significativas",
            "NCD": "NCD: no se detectan nubes",
        }
        for cloud_type, cloud_height, cloud_convective in cloud_patterns:
            if cloud_type in ["NSC", "NCD"]:
                self.decoded["clouds"].append(cloud_map[cloud_type])
                continue

            if cloud_height and cloud_height.isdigit():
                desc = f"{cloud_map.get(cloud_type)} a {int(cloud_height) * 100} pies"
            else:
                desc = f"{cloud_map.get(cloud_type)} con altura no disponible"

            if cloud_convective == "CB":
                desc += " (cumulonimbos)"
            elif cloud_convective == "TCU":
                desc += " (torres de cúmulos)"
            self.decoded["clouds"].append(desc)

        for token in remaining_tokens:
            if token.startswith("RE") and len(token) > 2:
                recent_text = self._decode_weather_token(token[2:])
                if recent_text:
                    self.decoded["recent_weather"].append(recent_text)
                continue

            weather_decoded = self._decode_weather_token(token)
            if weather_decoded:
                self.decoded["weather"].append(weather_decoded)

        if "NOSIG" in remaining_text:
            self.decoded["trends"].append("Sin cambios significativos (NOSIG)")

        trend_matches = re.findall(r"\b(BECMG|TEMPO)\s+(.*?)(?=\bBECMG\b|\bTEMPO\b|$)", remaining_text)
        for trend_type, content in trend_matches:
            self.decoded["trends"].append(f"{trend_type}: {content.strip()}")

        self.decoded["report_text"] = self._build_report_text(self.decoded)
        return self.decoded
