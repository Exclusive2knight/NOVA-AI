# NOVA original model development

**NOVA Core Tiny** is a small decoder-only transformer implemented from scratch with PyTorch. It does not use GPT, Claude, Gemma, or any pretrained weights.

This is educational research code, **not** a high-quality general-purpose model. Its sample output may be incoherent. The local browser's "NOVA Tiny" is a *different*, simpler word-transition model, and the hosted model picker uses separately identified Cloudflare models.

To run on a Windows PC with Python installed:

```sh
python -m pip install torch
python training/train_nova.py --data training/examples.jsonl --steps 80
```

For your earlier NOVA dataset, download and extract `NOVA_training_data_v1.zip`, then point `--data` at the extracted `train.jsonl` (much larger than the sample file).

The script uses a causal self-attention transformer, UTF-8 byte tokens, next-token prediction, training/validation splitting, AdamW updates, and a saved `.pt` checkpoint. It deliberately reports validation loss rather than claiming frontier intelligence or a made-up score.

**Important:** The checkpoint is a training artifact. It cannot be used by Cloudflare Workers AI as a drop-in model or run natively in the browser. A separate inference service, model packaging and extensive further training/evaluation would be needed. Do not upload secrets or private training data.
