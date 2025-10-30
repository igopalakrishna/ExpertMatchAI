from sqlalchemy import create_engine, text
from typing import List, Tuple
import os


def fetch_expert_texts() -> List[Tuple[str, str]]:
    db_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/daidaex")
    engine = create_engine(db_url)
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT id, name, company, description, city, state, specialties FROM \"Expert\""))
        records = list(rows)
    res: List[Tuple[str, str]] = []
    for r in records:
        rid, name, company, desc, city, state, specs = r
        text = " ".join([
            name or "",
            company or "",
            desc or "",
            " ".join((specs or [])),
            city or "",
            state or "",
        ])
        res.append((rid, text))
    return res

