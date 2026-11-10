# NOVA Core — measured training experiment (2026-11-10)

This report documents **one completed training experiment** on the original CC0-style NOVA Starter Training Dataset v1 that was available to the project. Its checkpoint and original run code are exported as a ZIP attachment in the ChatGPT conversation where the experiment was requested. The weights **have not been committed to GitHub or deployed to the NOVA website**.

## Architecture and dataset

| Field | Actual value |
|---|---|
| Model | Original NOVA decoder-only byte transformer, trained from scratch |
| Trainable weights | **137,216** |
| Layers / hidden width / attention heads | 2 / 64 / 4 |
| Context length | **64 byte tokens** |
| Optimization | AdamW next-byte prediction, 1,800 steps, batch size 16 |
| Training examples | **6,078** programmatically authored examples |
| Validation examples | 760 (separate split) |
| Test examples | 760 (separate split; evaluated once after training) |
| Token positions presented to optimizer | **1,843,200** including repeated and overlapping windows |
| Unique corpus scale | Far below a billion; not a trillion-token training run |

## Evaluation

| Metric | Result |
|---|---:|
| Validation cross-entropy before training | 5.6735 nats per byte token |
| Validation cross-entropy after training | **1.2968** nats per byte token |
| Validation loss reduction | **77.14%** |
| Test cross-entropy (held-out split) | **1.3173** nats per byte token |

Cross-entropy is a text-prediction metric: **lower is better**. The data was created by similar synthetic/template generators across all three splits, so these numbers overestimate performance on entirely new real conversations. A sampled completion after training was still **incoherent**. This is a functional training result, not proof of general reasoning, factual reliability, conversational ability, or safety.

## What is available in the repository

- `training/train_starter_pack.py` loads the original authored ZIP, trains NOVA's original PyTorch `NOVATransformer`, evaluates a separate validation split, saves weights and a JSON report, and can continue from a prior checkpoint (optimizer state resets when continuing).
- `training/train_nova.py` contains the original model architecture.
- `training/TRAINING_SYSTEM.md` documents approved-source ingestion, constrained synthetic data generation, optional human-consented feedback and a principle-guided audit prototype.

Example from a local working directory with the dataset and the repo source:

```sh
python -m pip install torch
python training/train_starter_pack.py --zip NOVA_training_data_v1.zip --steps 500 --batch 16 --save nova-core.pt
python training/train_starter_pack.py --zip NOVA_training_data_v1.zip --resume nova-core.pt --steps 500 --batch 16 --save nova-core-next.pt
```

This script's continued run starts with the saved model weights but a **new optimizer**. It is not yet a distributed or production-grade trainer.

## Why not train a trillion different examples immediately?

A trillion tokens is **over 500,000 times** the token *presentations* in this experiment, and unique-data volume would need to be massively larger. Scaling requires authorized high-quality text, specialized tokenization, dataset streaming and sharding, enough GPU memory, distributed compute, substantial time and budget, independent real-world benchmarks, and governance for privacy/safety. Repeating the same handful of generated templates does **not** substitute for diverse independent examples.

Meta, for context, reports pretraining Llama 3 on **over 15 trillion tokens** using very large GPU clusters. That is a different infrastructure scale, not an operation available in this project.

**Release status:** NOVA Native 2.0 remains the separate, installed local task-intent model. The trained 137k-parameter generative experiment is **not selectable in the live app** because its conversational output is not yet useful.
