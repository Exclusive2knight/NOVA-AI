# NOVA Training Lab — what can be trained, and what has actually run

This project has **two different neural models** and a separate web assistant:

1. **NOVA Core Tiny** is an original 137,216-parameter experimental decoder trained from scratch on a small permitted starter dataset. A previous downloadable checkpoint received real CPU optimization through **6,800 training steps**. Its output is still incoherent. This checkpoint is **not powering NOVA's website**.
2. **NOVA Open Model** is a new supervised fine-tuning workflow that starts from the openly licensed **Qwen3-0.6B** pretrained model and trains a LoRA adapter with NOVA-specific conversational behavior. The scripts, a curated dataset, and a GPU notebook are now available in this repository. **No Qwen adapter has been trained or deployed by simply committing these files.**
3. **NOVA Pro on the website** is currently a separately hosted Cloudflare Workers AI configuration. It does not silently download, use or train the Qwen LoRA adapter.

Training like large AI assistants means using a **sequence of techniques**, not magically adding a million responses to a 137K-parameter model. OpenAI/Anthropic exact proprietary data, weights, evaluations and compute are not available to this project.

## The new practical route: pretrained model + LoRA

Use the Colab notebook:
[**Open NOVA Training on Colab**](https://colab.research.google.com/github/Exclusive2knight/NOVA-AI/blob/main/training/NOVA_Open_Training_Colab.ipynb)

1. Open the notebook in Google Colab.
2. Choose **Runtime → Change runtime type → GPU** if a free GPU is available.
3. Click **Run all**. The notebook installs open-source packages, clones this repository, checks the curated training set, trains the LoRA adapter, evaluates it, shows a sample response, and offers a ZIP download.
4. Keep the adapter ZIP private until you deliberately decide how to use or serve it. It does not update the Cloudflare website by itself.

**Free Google Colab GPU availability is not guaranteed.** The run can stop or require more resources. The starter uses **30 optimization steps**, not billions; a 30-step experiment does not make a 0.6-billion-parameter model frontier-quality.

### Reviewed training data

The file `training/nova_sft_examples.jsonl` contains **77 project-original demonstration pairs** about casual conversation, web search decisions, code, honesty, cloud memory, GLB models, and mobile game development. The builder checks provenance and an explicit `training_permitted` flag, filters obvious PII and credentials, and produces:

- **61 training examples** — used to change model weights.
- **8 validation examples** — used for measuring and choosing the training checkpoint.
- **8 held-out test examples** — reserved for a single check after training.

These numbers are small. They do **not** constitute diverse general pretraining data or a benchmark against ChatGPT or Claude. Do not treat the exact number of steps, source documents or labels as a measure of intelligence.

### Scripts

From repository root:

```bash
python training/build_nova_sft.py --input training/nova_sft_examples.jsonl --out-dir nova-data/sft

# Requires Python + compatible CUDA GPU + Transformers, TRL, PEFT, Datasets, Accelerate
python training/finetune_open_model.py --data-dir nova-data/sft --out-dir nova-data/nova-qwen-lora --max-steps 30

# After training only, examine held-out test loss (do not tune on test)
python training/evaluate_nova_open_model.py --data-dir nova-data/sft --adapter nova-data/nova-qwen-lora/adapter

# Try a generated answer with the trained adapter
python training/chat_nova_open_model.py --adapter nova-data/nova-qwen-lora/adapter --prompt "How are we doing with NOVA?"
```

The hosted notebook installs package dependencies for you. Python scripts do not read existing personal conversations, fetch content from external websites for training, or upload data to a training server. Loading the public Qwen model downloads pretrained weights.

## Broader stages already present

- **Scratch pretraining:** `training/pretrain.py` trains a tiny byte-token transformer on explicitly licensed sources from `training/prepare_corpus.py`.
- **Instruction / supervised tuning:** `training/finetune_open_model.py` trains an adapter for a model that already learned language from much larger external training.
- **Preference optimization:** `training/prepare_preferences.py` and `training/train_preferences.py` support consented chosen/rejected examples with DPO-style optimization for the original small model.
- **Safety and honesty review:** `training/constitutional_review.py` checks selected claims via rules. This is a limited rules audit, not a trained judge model.
- **Evaluation:** `training/test_open_sft.py`, held-out loss evaluation, and the website's routing/privacy regression tests keep simple checks reproducible.

Getting closer to advanced assistants would require much more high-quality rights-cleared data, stronger GPUs, preference judgments, better independent evaluation, security work, and a suitable model hosting pipeline. None of those stages is solved merely by increasing the training-step count.

## Deployment and privacy

- **Do not upload a fine-tuning adapter directly into a Cloudflare Worker expecting it to run.** NOVA's current Cloudflare AI binding is hosted inference and is not automatically compatible with user-trained Qwen LoRA adapters.
- Serving a trained model requires an appropriate separately configured inference runtime and authorization; this repo does not claim one is already deployed.
- The model's public training code may be reviewed on GitHub. **Never** commit private chat history, API keys, raw personal records, or private model checkpoints.
- The local training outputs live in the gitignored `nova-data/` directory; nothing is pushed to a model hub or deployed by the training scripts.
- Build example quality and independent evaluations matter more than inflating dataset counts with near-duplicate synthetic messages.

## Verified public references

- Qwen3 0.6B model and Apache-2.0 licensing: https://huggingface.co/Qwen/Qwen3-0.6B
- Official TRL SFTTrainer, completion-only loss and LoRA usage: https://huggingface.co/docs/trl/sft_trainer
- Hugging Face PEFT LoRA: https://huggingface.co/docs/peft/en/package_reference/lora
- Google Colab free-tier limitations: https://research.google.com/colaboratory/faq.html
