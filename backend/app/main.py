from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss
import os
import json
import re
from datetime import datetime, timezone
from uuid import uuid4
from typing import List, Dict, Any, Optional, Set
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize as l2_normalize
import joblib

app = FastAPI()

# CORS configuration for production
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
INDEX_PATH = os.path.join(os.getcwd(), "vectorstore", "experts.index")
META_PATH = os.path.join(os.getcwd(), "vectorstore", "experts.meta.json")
TFIDF_VEC_PATH = os.path.join(os.getcwd(), "vectorstore", "experts.tfidf.vectorizer.joblib")
TFIDF_MAT_PATH = os.path.join(os.getcwd(), "vectorstore", "experts.tfidf.matrix.joblib")
KEYWORDS_PATH = os.path.join(os.getcwd(), "vectorstore", "experts.keywords.json")

_model = None
_index = None
_ids: List[str] = []
_vectorizer: Optional[TfidfVectorizer] = None
_tfidf_matrix = None
_keywords_by_id: Dict[str, List[str]] = {}


def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def load_index():
    global _index, _ids
    if os.path.exists(INDEX_PATH) and os.path.exists(META_PATH):
        _index = faiss.read_index(INDEX_PATH)
        with open(META_PATH, "r") as f:
            _ids = json.load(f)
    return _index is not None


def load_tfidf():
    global _vectorizer, _tfidf_matrix
    if os.path.exists(TFIDF_VEC_PATH) and os.path.exists(TFIDF_MAT_PATH):
        _vectorizer = joblib.load(TFIDF_VEC_PATH)
        _tfidf_matrix = joblib.load(TFIDF_MAT_PATH)
    return _vectorizer is not None and _tfidf_matrix is not None


def load_keywords() -> Dict[str, List[str]]:
    global _keywords_by_id
    if not _keywords_by_id and os.path.exists(KEYWORDS_PATH):
        with open(KEYWORDS_PATH, "r") as f:
            raw = json.load(f)
        _keywords_by_id = {rid: [str(token) for token in tokens] for rid, tokens in raw.items()}
    return _keywords_by_id


def tokenize_terms(text: str) -> List[str]:
    if not text:
        return []
    return [tok for tok in re.split(r'[^a-z0-9]+', text.lower()) if tok]


def flatten_keywords(value: Any) -> List[str]:
    tokens: List[str] = []
    if value is None:
        return tokens
    if isinstance(value, list):
        for item in value:
            tokens.extend(flatten_keywords(item))
        return tokens
    if isinstance(value, str):
        tokens.extend(tokenize_terms(value))
    else:
        tokens.extend(tokenize_terms(str(value)))
    return tokens


def dedupe_preserve(seq: List[str]) -> List[str]:
    seen: Set[str] = set()
    ordered: List[str] = []
    for item in seq:
        if item in seen:
            continue
        seen.add(item)
        ordered.append(item)
    return ordered


def extract_expert_keywords(*fields: Any) -> List[str]:
    tokens: List[str] = []
    for field in fields:
        tokens.extend(flatten_keywords(field))
    return dedupe_preserve(tokens)


def query_keyword_set(text: str) -> Set[str]:
    return set(tokenize_terms(text))


def keywords_fully_match(query_terms: Set[str], expert_terms: List[str]) -> bool:
    if not query_terms:
        return False
    if not expert_terms:
        return False
    expert_set = set(expert_terms)
    return query_terms.issubset(expert_set)


@app.get("/health")
def health():
    ok = load_index()
    return {"status": "ok", "indexLoaded": ok}


class EmbedIn(BaseModel):
    text: str


@app.post("/embed")
def embed(inp: EmbedIn):
    model = get_model()
    vec = model.encode([inp.text], normalize_embeddings=True)[0].tolist()
    return {"vector": vec}


class BuildIn(BaseModel):
    # reserved for future
    pass


@app.post("/index/build")
def build_index(_: BuildIn | None = None):
    # Connect to Postgres and fetch experts
    from sqlalchemy import create_engine, text

    db_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/daidaex")
    engine = create_engine(db_url)

    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT id, name, company, description, city, state, specialties, certifications, "projectsCurrent", "projectsCompleted"
            FROM "Expert"
        """))
        records = list(rows)

    texts: List[str] = []
    ids: List[str] = []
    keyword_map: Dict[str, List[str]] = {}
    for r in records:
        rid, name, company, desc, city, state, specs, certs, projects_current, projects_completed = r
        full = " ".join([
            name or "",
            company or "",
            desc or "",
            " ".join((specs or [])),
            city or "",
            state or "",
        ])
        texts.append(full)
        ids.append(rid)
        keyword_map[rid] = extract_expert_keywords(
            specs or [],
            certs or [],
            projects_current or [],
            projects_completed or [],
            name,
            company,
            city,
            state,
        )

    if len(texts) == 0:
        return {"status": "empty"}

    model = get_model()
    embs = model.encode(texts, normalize_embeddings=True)
    dim = embs.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embs.astype(np.float32))

    os.makedirs(os.path.dirname(INDEX_PATH), exist_ok=True)
    faiss.write_index(index, INDEX_PATH)
    with open(META_PATH, "w") as f:
        json.dump(ids, f)

    # Build TF-IDF artifacts
    vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
    tfidf = vectorizer.fit_transform(texts)
    tfidf = l2_normalize(tfidf)
    joblib.dump(vectorizer, TFIDF_VEC_PATH)
    joblib.dump(tfidf, TFIDF_MAT_PATH)

    os.makedirs(os.path.dirname(KEYWORDS_PATH), exist_ok=True)
    with open(KEYWORDS_PATH, "w") as f:
        json.dump(keyword_map, f)

    global _index, _ids
    _index = index
    _ids = ids
    global _vectorizer, _tfidf_matrix
    _vectorizer = vectorizer
    _tfidf_matrix = tfidf
    global _keywords_by_id
    _keywords_by_id = keyword_map

    return {"status": "built", "count": len(ids)}


class SearchIn(BaseModel):
    query: str
    limit: int | None = 50
    candidateIds: Optional[List[str]] = None


@app.post("/search")
def search(inp: SearchIn):
    if not load_index():
        return {"results": []}
    load_tfidf()
    keywords_map = load_keywords()
    query_terms = query_keyword_set(inp.query)
    model = get_model()
    qv = model.encode([inp.query], normalize_embeddings=True).astype(np.float32)

    # Restrict search to candidates if provided
    if inp.candidateIds:
        # map candidate IDs to indices in _ids
        cand_to_idx = {cid: i for i, cid in enumerate(_ids)}
        chosen = [cand_to_idx[c] for c in inp.candidateIds if c in cand_to_idx]
        if not chosen:
            return {"results": []}
        # Gather vectors by searching full and filtering post-hoc
        k = min(len(chosen), inp.limit or len(chosen))
        scores, idxs = _index.search(qv, len(_ids))
        pairs = [(int(i), float(s)) for i, s in zip(idxs[0].tolist(), scores[0].tolist()) if i in chosen]
        pairs = pairs[:k]
    else:
        scores, idxs = _index.search(qv, min(inp.limit or 50, len(_ids)))
        pairs = [(int(i), float(s)) for i, s in zip(idxs[0].tolist(), scores[0].tolist()) if i != -1]

    sem_raw = [p[1] for p in pairs]
    sem_max = max(sem_raw) if sem_raw else 1
    sem_norm = [s / sem_max if sem_max > 0 else 0 for s in sem_raw]

    # Keyword score using TF-IDF cosine
    kw_scores: List[float] = []
    top_terms_fmt: Dict[str, List[str]] = {}
    if _vectorizer is not None and _tfidf_matrix is not None:
        qtf = _vectorizer.transform([inp.query])
        qtf = l2_normalize(qtf)
        # Pick same doc order as pairs
        doc_rows = [idx for idx, _ in pairs]
        if doc_rows:
            sub_mat = _tfidf_matrix[doc_rows]
            sims = (qtf @ sub_mat.T).toarray()[0]
            kw_scores = sims.tolist()
        else:
            kw_scores = []
        # Top terms from query tf-idf
        if qtf.nnz > 0:
            nz = qtf.nonzero()[1]
            weights = qtf.data
            feats = _vectorizer.get_feature_names_out()
            terms = sorted([(feats[i], float(w)) for i, w in zip(nz, weights)], key=lambda x: x[1], reverse=True)[:5]
            formatted = [f"{t} ({w:.2f})" for t, w in terms]
            # Assign same top terms to all for simplicity
            for idx, _ in pairs:
                top_terms_fmt[_ids[idx]] = formatted
    else:
        kw_scores = [0.0 for _ in pairs]

    kw_max = max(kw_scores) if kw_scores else 1
    kw_norm = [s / kw_max if kw_max > 0 else 0 for s in kw_scores]

    # Combine with env weights
    w_sem = float(os.getenv("MATCH_W_SEM", "0.6"))
    w_kw = float(os.getenv("MATCH_W_KW", "0.25"))
    # filter weight not used here; handled in web layer when filters are applied
    finals = [w_sem * s + w_kw * k for s, k in zip(sem_norm, kw_norm)]
    full_match_flags = [False] * len(pairs)
    if query_terms and keywords_map:
        for i, (doc_idx, _) in enumerate(pairs):
            rid = _ids[doc_idx]
            expert_terms = keywords_map.get(rid, [])
            if keywords_fully_match(query_terms, expert_terms):
                finals[i] = 1.0
                full_match_flags[i] = True
    # Normalize to 0-1 then scale to 0-100 for parity with web
    fin_max = max(finals) if finals else 1
    final_norm_0_1 = [f / fin_max if fin_max > 0 else 0 for f in finals]
    final_pct = [round(x * 100, 1) for x in final_norm_0_1]

    results = []
    for i, ((idx, _), s_sem, s_kw, s_final) in enumerate(zip(pairs, sem_norm, kw_norm, final_pct)):
        rid = _ids[idx]
        terms = top_terms_fmt.get(rid, [])
        results.append({
            "id": rid,
            "semScore": round(s_sem, 4),
            "kwScore": round(s_kw, 4),
            "finalScore": s_final,
            "topTerms": terms,
            "allKeywordsMatched": full_match_flags[i],
        })

    return {"results": results}


class ContactClickIn(BaseModel):
    expert_id: str
    user_id: Optional[str] = None
    search_id: Optional[str] = None
    source: Optional[str] = "search_results"
    clicked_at: Optional[datetime] = None


@app.post("/analytics/contact-click")
def log_contact_click(inp: ContactClickIn):
    from sqlalchemy import create_engine, text

    db_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/daidaex")
    engine = create_engine(db_url)
    clicked_at = inp.clicked_at or datetime.now(timezone.utc)
    payload = {
        "id": uuid4().hex,
        "expertId": inp.expert_id,
        "userId": inp.user_id,
        "searchId": inp.search_id,
        "source": inp.source,
        "clickedAt": clicked_at,
    }
    with engine.begin() as conn:
        conn.execute(text("""
            INSERT INTO "ContactClickEvent" ("id", "expertId", "userId", "searchId", "source", "clickedAt")
            VALUES (:id, :expertId, :userId, :searchId, :source, :clickedAt)
        """), payload)
    return {"status": "ok"}

