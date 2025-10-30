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

