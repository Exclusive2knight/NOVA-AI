# NOVA Training Lab — four-stage original-model development

> **NEW: Practical LoRA training on an open pretrained language model.** Read [NOVA Open Training Guide](NOVA_OPEN_TRAINING_GUIDE.md) and use the [GPU notebook](NOVA_Open_Training_Colab.ipynb). This is a separate, un-deployed training path; merely committing the scripts does **not** train Qwen or alter the live Cloudflare AI. The original NOVA Core tiny model has received a separate measured CPU continuation, with still-incoherent text.

NOVA has a real **original transformer training prototype** and a separately deployed **NOVA Native** intent classifier. The tools in this directory are the next stage of experimentation; they are **not** a trained Claude-equivalent language model, and their checkpoints are **not** yet connected to the production chat website.

## 1. Licensed-text pretraining

`prepare_corpus.py` reads a local source manifest and produces deduplicated `train.jsonl`, `valid.jsonl`, `test.jsonl` and `audit.json`. It requires source IDs, a source URL, affirmative training permission and license metadata, then filters obvious emails, phone numbers and credentials. These simple checks are **not** enough to guarantee privacy, license compliance, or safety. Independent splits are **by source ID**, not random chunks.

Run from the repository root:

```sh
python training/prepare_corpus.py --manifest training/sources.example.json --out-dir nova-data/demo
python training/pretrain.py --corpus nova-data/demo --profile tiny --context 32 --steps 10 --batch 2 --out nova-pretrained.pt
```

The first command requires only standard Python. The second requires `pip install torch` and actually optimizes the small **original NOVA decoder transformer** for next-token prediction. The demo corpus is tiny and exists to verify the method, not to confer general factual ability. Do not infer performance from training loss alone.

To use additional texts, add local `.txt`, `.md` or `.jsonl` files to an *explicit source manifest* with manually verified rights and permissions. **No automatic website scraping is performed.** Some works from Project Gutenberg are not unrestricted under all laws; verify the individual work's rights, and use its documented mirrors for authorized bulk access rather than scraping the main website. Britannica is **not automatically public-domain** material. Sources from other people or users require authorization.

This demonstration currently loads the curated training text into memory. A genuine multi-billion-token project additionally needs streaming sharded datasets, advanced tokenization, distributed training, substantial compute, evaluation infrastructure and careful quality reviews. None of that scale has been achieved here.

## 2. Synthetic dialogue augmentation

Use original, reviewed seed examples to generate constrained phrasing variations. This script **does not call an LLM** or fabricate billions of dialogues. Each record identifies its original seed, method, train-only split and synthetic status.

```sh
python training/synthetic_dialogue.py --input training/examples.jsonl --output nova-data/synthetic_train.jsonl --per-seed 6
python training/pretrain.py --corpus nova-data/demo --synthetic nova-data/synthetic_train.jsonl --profile tiny --context 32 --steps 10 --out nova-with-synthetic.pt
```

Synthetic rows are added **only to training**, never the validation/test sets. For a real research project, review quality, meaning preservation, data diversity and model collapse risks before substantially increasing synthetic data volume.

## 3. Explicit-feedback preference optimization

NOVA Studio now has **Helpful** / **Needs work** controls. These save *anonymous answer-rating labels* locally and can be exported manually. They don't upload or train on the conversation automatically, and a simple rating **does not by itself provide a preferred-vs-rejected response pair**.

For genuine preference optimization, write or manually review paired examples with `prompt`, `chosen`, `rejected`, and `consent_for_training: true`. If any line lacks consent or contains common private information, `prepare_preferences.py` rejects it. The output is not uploaded anywhere.

```sh
python training/prepare_preferences.py --input training/preference_examples.jsonl --output nova-data/preferences.jsonl
python training/train_preferences.py --checkpoint nova-pretrained.pt --pairs nova-data/preferences.jsonl --out nova-preference-trained.pt --epochs 1
```

This actually applies gradient-based **DPO-style offline preference optimization** to a saved original NOVA checkpoint using a frozen reference model and a supervised term. It is **not** live reinforcement learning, full RLHF, or evidence that the model is aligned. Training on three demonstration comparisons is only a functional test. Feedback from other people must never be collected or used without consent and privacy review.

## 4. NOVA principle-guided reviews

Our original [`nova_constitution.json`](nova_constitution.json) documents nine principles: accuracy, uncertainty, helpfulness, privacy, safety, respect, transparency, creator rights, and user agency.

`constitutional_review.py` performs a simple, testable **rule-based audit** of example model answers. It flags a few indicators of unsupported tool claims, overly confident guarantees, exposed secrets and unhelpful text, producing a separate review record for human inspection.

```sh
python training/constitutional_review.py --input training/review_examples.jsonl --output nova-data/reviews.jsonl
```

**This is not full Constitutional AI.** Anthropic's published approach involves model-generated critiques and revisions in a supervised phase and AI-feedback preference optimization/reinforcement learning in another. To recreate those capabilities for NOVA, we still need a capable independent reviewer model, a revision-generation process, preference evaluators, careful policy/evaluation work, and adequate compute. The local rule audit never claims to have genuinely reasoned about a response.

## Testing, usage, and privacy

```sh
python training/test_pipeline.py
python -m py_compile training/prepare_corpus.py training/synthetic_dialogue.py training/prepare_preferences.py training/constitutional_review.py training/pretrain.py training/train_preferences.py
```

The tests cover authorized source metadata, train/validation/test isolation, synthetic origin labels, consent, privacy screening, and the principle audit. The project `.gitignore` excludes standard checkpoint files, local corpora and private feedback exports. **Do not add raw messages, secrets, or private training files to the public repository.**

A future large training run needs explicit resource budgets and an approved source catalog. NOVA Native 2.0's previously reported scores were **task-intent classification** scores, not results from the new generative transformer.

## Sources and verification

- Anthropic, *Constitutional AI: Harmlessness from AI Feedback* (2022): https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback
- Anthropic official Transparency Hub: https://www.anthropic.com/transparency
- Project Gutenberg Terms of Use: https://www.gutenberg.org/policy/terms_of_use.html
- Project Gutenberg License: https://www.gutenberg.org/policy/license

Unverified figures quoted in some third-party blogs (e.g. exact millions of conversation words, 89 billion synthetic conversations or 223,000 contributors) must **not** be represented as confirmed Claude training statistics. Anthropic describes its training mix but has not confirmed those specific figures in the above sources.
