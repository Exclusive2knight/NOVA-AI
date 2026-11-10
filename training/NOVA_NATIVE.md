# NOVA Native 2.0 — our own trained, offline neural AI

NOVA Native is an original **neural intent classifier** plus local tools. The neural network's model code and training dataset were built for NOVA; **no Claude, GPT, Gemma, Qwen, GLM, third-party pretrained weights, or Cloudflare inference is used for Native mode.**

Its weights have now been **trained and bundled into the project**, so the app no longer requires a 75-pass initial training session when a new user opens it.

## Released model

| Property | NOVA Native 1.0 | NOVA Native 2.0 |
|---|---:|---:|
| Neural input dimensions | 192 | 1,024 |
| Hidden units | 48 | 48 |
| Intent categories | 17 | 17 |
| Trainable parameters | 10,097 | 50,033 |
| Initial training passes | 75 | 75 |
| Trained weights shipped | No | Yes, ~131 KiB |
| Initial model loading | Train on device | Decode bundled checkpoint |

- **`nova-native.js`** contains original code for training, classifying requests and invoking local skills.
- **`nova-native-weights.js`** contains the original trained weights compressed as symmetric, signed 16-bit values for browser loading. No external APIs or paid models are required.
- **`training/rebuild_native_weights.cjs`** is a reproducible Node.js script that retrains the checkpoint from the original source, writes compressed weights, and prints both evaluation results. Run `node training/rebuild_native_weights.cjs` on a computer with Node.js 20 or later to rebuild the bundle.
- Training used roughly a thousand examples including original examples, newly authored phrases and simple training-time prompt variations. The original model uses hashed word/bigram/prefix/suffix features and gradient updates.
- Custom examples and additional training updates are saved only in the browser's local storage. Existing Native 1.0 custom intent examples are migrated where available.
- Model size and accuracy measure **intent routing**, not general language reasoning.

## Actual evaluation results

The benchmarks were **not used verbatim as training rows**. They evaluate whether NOVA classifies a request into one of its 17 known task types.

| Test | Original Native 1.0 | Native 2.0 |
|---|---:|---:|
| `training/native_holdout_v2.json` (68 unseen requests) | 14 / 68 = **20.6%** | 58 / 68 = **85.3%** |
| `training/native_holdout_extra.json` (34 different requests) | Not measured | 24 / 34 = **70.6%** |

This is a limited test set. It does **not** measure open-ended dialogue, writing, coding accuracy, truthfulness, safety, long-context recall, or intelligence comparable to commercial LLMs. It also indicates room for improving understanding of unfamiliar phrases.

GitHub Actions checks enforce a minimum accuracy of 80% on the first set and 65% on the second set so future changes cannot silently regress those particular metrics.

## How to use

1. Open [NOVA AI](https://exclusive2knight.github.io/NOVA-AI/) and select **NOVA Native · Original AI**.
2. Refresh if you previously installed an older version; the new service worker is `nova-shell-v13`.
3. Ask `Create a to-do app`, `Build a website for a bakery`, `Make a timer`, `Create a dashboard`, or `What is 8 * 7?`.
4. The trained checkpoint loads at startup. NOVA routes supported tasks to local tools and can create editable, sandbox-previewable Artifacts.
5. Open the **Activity** disclosure to see the genuine local operations used. This does not disclose private chain-of-thought or invent terminal commands.
6. Choose **Settings → Original NOVA Native model** to continue training with your own intent-labeled examples or reset device-specific training.

Current supported local starters: website, portfolio, to-do list, notes, timer, calculator, dashboard, and a tiny clicker game. These are deterministic tools guided by a trained classifier; they are **not** novel code created token-by-token by a generative model.

## Security, privacy and limitations

The original Native mode can run fully offline once the website files have been cached. Neural weights and training examples stay in local browser storage. Native mode does not require a Cloudflare passcode or provider quota. Browser storage varies by device and can be erased by clearing website data.

This is **not a general-purpose language model** and is not smarter than Claude. It can misunderstand unknown requests; local task templates are intentionally limited. The separate PyTorch decoder-only model training project under `training/train_nova.py` is experimental and does not yet have production language generation weights or browser integration.

## What more training requires

To make NOVA much smarter, our next work should improve data quality, label ambiguity, tokenizer efficiency, uncertainty estimation and held-out evaluation. A high-quality open-ended assistant would require training a much larger generative neural model on extensive legally usable text and code, dedicated compute, extensive safety and quality evaluations, and real tool execution.

Increasing epoch count alone will not produce a frontier model; on small data it can cause overfitting.
