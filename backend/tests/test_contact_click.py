from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from app.main import app


def test_contact_click_logs_event(tmp_path, monkeypatch):
    db_file = tmp_path / "contact.sqlite"
    db_url = f"sqlite:///{db_file}"
    monkeypatch.setenv("DATABASE_URL", db_url)

    engine = create_engine(db_url)
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE "ContactClickEvent" (
                "id" TEXT PRIMARY KEY,
                "expertId" TEXT NOT NULL,
                "userId" TEXT,
                "searchId" TEXT,
                "source" TEXT,
                "clickedAt" DATETIME NOT NULL
            )
        """))

    client = TestClient(app)
    payload = {
        "expert_id": "exp_123",
        "user_id": "user_456",
        "search_id": "search_1",
        "source": "search_results"
    }
    resp = client.post("/analytics/contact-click", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") == "ok"

    with engine.connect() as conn:
        rows = conn.execute(text('SELECT "expertId", "userId", "searchId", "source" FROM "ContactClickEvent"'))
        row = rows.fetchone()
        assert row is not None
        assert row[0] == "exp_123"
        assert row[1] == "user_456"
        assert row[2] == "search_1"
        assert row[3] == "search_results"

