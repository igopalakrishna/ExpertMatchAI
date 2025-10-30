from app.ingest import fetch_expert_texts
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss
import os
import json


def main():
    pairs = fetch_expert_texts()
    if not pairs:
        print("No experts found.")
        return
    ids = [p[0] for p in pairs]
    texts = [p[1] for p in pairs]

    model_name = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    model = SentenceTransformer(model_name)
    embs = model.encode(texts, normalize_embeddings=True)
    dim = embs.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embs.astype(np.float32))

    base = os.path.join(os.getcwd(), "vectorstore")
    os.makedirs(base, exist_ok=True)
    faiss.write_index(index, os.path.join(base, "experts.index"))
    with open(os.path.join(base, "experts.meta.json"), "w") as f:
        json.dump(ids, f)
    print(f"Built index with {len(ids)} experts.")


if __name__ == "__main__":
    main()

