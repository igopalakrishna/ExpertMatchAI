from fastapi.testclient import TestClient
from app.main import app


def test_embed_route():
    client = TestClient(app)
    resp = client.post('/embed', json={'text': 'hello world'})
    assert resp.status_code == 200
    data = resp.json()
    assert 'vector' in data and isinstance(data['vector'], list)

