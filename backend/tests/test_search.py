from fastapi.testclient import TestClient
from app.main import app


def test_search_smoke():
    client = TestClient(app)
    # Without index loaded this should still work
    resp = client.post('/search', json={'query': 'sandstone Wilmington', 'limit': 5})
    assert resp.status_code == 200
    data = resp.json()
    assert 'results' in data

