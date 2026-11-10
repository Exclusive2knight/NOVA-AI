# NOVA original models and billion-token **memory** roadmap

NOVA already has a tiny original transformer training script (three configurable profiles), and a browser-based experimental word-transition model. Those are **not** comparable to Claude or other frontier LLMs. Production NOVA Pro currently uses an identified hosted open-weight model.

## What a billion tokens means

A **1,000,000,000-token direct context window** is not supported by NOVA today and is not feasible to deploy on the current Cloudflare setup. A billion tokens cannot be passed to the model in a single request by increasing a UI limit.

An achievable intermediate goal is a **searchable library of documents representing up to a billion accumulated tokens**. This requires persistent storage, indexing, retrieval, relevance ranking, user privacy, and context budgeting. It is **not identical** to a model considering every one of those tokens simultaneously.

## What was implemented

- `train_nova.py`: decoder-only byte-token transformer with randomly initialized weights and profiles tiny (64-token experimental context), mini (128), core (256). Scale training only with appropriate data and computing resources.
- `infer_nova.py`: load locally trained checkpoint weights and generate test text, without downloading proprietary models.
- `memory_index.py`: index multiple text/code documents into a local SQLite FTS5 database, retrieve relevant passages, and count stored chunks.
- In NOVA's browser UI, messages remain in local conversation storage; a subset of recent and relevant older excerpts is sent to a hosted model. This is **simple retrieval**, not a true billion-token memory index.

## Test these tools on a laptop

```sh
python -m pip install torch
python training/train_nova.py --profile tiny --steps 80 --save nova-tiny.pt
python training/infer_nova.py --checkpoint nova-tiny.pt --prompt "User: Hello\nNOVA: "
python training/memory_index.py ingest ./my_notes --db nova-memory.db
python training/memory_index.py query "car game controls" --db nova-memory.db
python training/memory_index.py stats --db nova-memory.db
```

Do not commit generated checkpoint weights, private notes, or `.db` databases to the public GitHub repository. The example dataset is tiny; generated responses may be nonsensical.

## Future stages (not yet built)

1. Robust datasets, permission-aware licensing, data cleansing and deduplication.
2. Better tokenizer, grouped-query attention, rotary embeddings, efficient KV caching, modern model training, rigorous held-out evaluation.
3. Durable and private cross-device memory: encrypted object storage, user auth, chunking, vector + keyword hybrid index, citations and deletions.
4. Multi-stage retrieval: fast search across massive corpus, rerank top passages, append bounded relevant context, validate citations.
5. Safe coding tools sandbox with user-approved execution and file changes. Frontend browser preview is **not** a cloud computer or unrestricted app builder.
6. Model evaluations on coding, factuality, robustness, latency, safety, and long-context retrieval. Only claim capabilities demonstrated by reproducible tests.

**Cost note:** Hundreds of millions of documents or tokens require significant storage and computing. NOVA must expose provider usage/costs and avoid hidden paid-model upgrades.
