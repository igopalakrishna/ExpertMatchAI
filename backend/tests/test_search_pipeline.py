from fastapi.testclient import TestClient
from app.main import app
import app.main as main
import numpy as np
import faiss
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize as l2_normalize


def test_search_combined_scoring(monkeypatch):
    client = TestClient(app)

    # Stub model.encode to return simple 2D vectors
    class StubModel:
        def encode(self, texts, normalize_embeddings=True):
            vecs = []
            for t in texts:
                if 'sandstone' in t.lower():
                    vecs.append([1.0, 0.0])
                else:
                    vecs.append([0.0, 1.0])
            a = np.array(vecs, dtype=np.float32)
            if normalize_embeddings:
                norms = np.linalg.norm(a, axis=1, keepdims=True)
                norms[norms == 0] = 1.0
                a = a / norms
            return a

    monkeypatch.setattr(main, 'get_model', lambda: StubModel())

    # Build an in-memory FAISS index and ids
    index = faiss.IndexFlatIP(2)
    docs = np.array([[1.0, 0.0], [0.0, 1.0]], dtype=np.float32)
    index.add(docs)
    main._index = index
    main._ids = ['doc_sandstone', 'doc_wood']

    # Build TF-IDF vectorizer/matrix
    vec = TfidfVectorizer(stop_words='english')
    X = vec.fit_transform(['sandstone masonry', 'wood frames'])
    X = l2_normalize(X)
    main._vectorizer = vec
    main._tfidf_matrix = X

    # Call search
    resp = client.post('/search', json={'query': 'sandstone', 'limit': 2})
    assert resp.status_code == 200
    data = resp.json()
    assert 'results' in data and len(data['results']) >= 1
    first = data['results'][0]
    # Should include combined fields
    assert 'semScore' in first and 'kwScore' in first and 'finalScore' in first
    # Top terms should exist for query
    assert isinstance(first.get('topTerms', []), list)


def test_full_keyword_match_forces_100(monkeypatch):
    client = TestClient(app)

    class StubModel:
        def encode(self, texts, normalize_embeddings=True):
            vecs = []
            for _ in texts:
                vecs.append([1.0, 0.0])
            arr = np.array(vecs, dtype=np.float32)
            if normalize_embeddings:
                norms = np.linalg.norm(arr, axis=1, keepdims=True)
                norms[norms == 0] = 1.0
                arr = arr / norms
            return arr

    monkeypatch.setattr(main, 'get_model', lambda: StubModel())

    index = faiss.IndexFlatIP(2)
    docs = np.array([[0.2, 0.0], [0.8, 0.0]], dtype=np.float32)
    index.add(docs)
    main._index = index
    main._ids = ['doc_full', 'doc_partial']
    main._vectorizer = None
    main._tfidf_matrix = None
    prev_keywords = main._keywords_by_id
    main._keywords_by_id = {
        'doc_full': ['concrete', 'bridge', 'nyc'],
        'doc_partial': ['concrete']
    }

    try:
        resp = client.post('/search', json={'query': 'concrete bridge', 'limit': 2})
        assert resp.status_code == 200
        data = resp.json()
        results = {row['id']: row for row in data.get('results', [])}
        assert results['doc_full']['finalScore'] == 100.0
        assert results['doc_full']['allKeywordsMatched'] is True
        assert results['doc_partial']['finalScore'] < 100.0
        assert not results['doc_partial']['allKeywordsMatched']
    finally:
        main._keywords_by_id = prev_keywords


def test_keyword_matching_helper_cases():
    query_terms = main.query_keyword_set('concrete bridge')
    assert main.keywords_fully_match(query_terms, ['concrete', 'bridge', 'nyc'])

    partial_terms = main.query_keyword_set('concrete bridge')
    assert not main.keywords_fully_match(partial_terms, ['concrete'])

    case_terms = main.query_keyword_set('Concrete')
    assert main.keywords_fully_match(case_terms, ['concrete'])

