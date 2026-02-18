from fastapi.testclient import TestClient

from backend.app import create_app


client = TestClient(create_app())


def test_health_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_decode_ok():
    payload = {"metar": "METAR LEVC 121430Z 12005KT CAVOK 18/12 Q1015="}
    response = client.post("/decode", json=payload)
    data = response.json()

    assert response.status_code == 200
    assert data["station"] == "LEVC"
    assert data["visibility"]["main"] == "CAVOK"
    assert data["qnh"] == "1015 hPa"


def test_decode_rejects_invalid_characters():
    payload = {"metar": "METAR LEVC 121430Z 12005KT CAVOK 18/12 Q1015= 💥"}
    response = client.post("/decode", json=payload)
    data = response.json()

    assert response.status_code == 422
    assert "caracteres no válidos" in str(data)
