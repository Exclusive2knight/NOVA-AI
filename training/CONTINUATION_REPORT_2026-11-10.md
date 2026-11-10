# NOVA Core — continued-training result (November 10, 2026)

This is a **completed experiment on the original NOVA Core Tiny model**, not an upgraded production chatbot. The trained checkpoint is shared as a separate download in the project conversation, not pushed to the website or Git repository.

## Reproducible training measurements

| Metric | Earlier release | First continued round | Latest release |
|---|---:|---:|---:|
| Cumulative optimization steps | 1,800 | 2,300 | **4,900** |
| Validation cross-entropy (nats/byte token) | 1.296762 | 1.188435 | **1.033672** |
| Original transformer parameters | 137,216 | 137,216 | 137,216 |
| Byte-token context | 64 | 64 | 64 |
| Training examples | 6,078 | 6,078 | 6,078 |

- **New steps performed:** 3,100 (500 steps with LR 0.0002 and 2,600 with LR 0.00012; batch size 16).
- **Additional token positions presented to optimizer:** 3,174,400. These are repeated/overlapping positions sampled from a much smaller corpus, **not 3.17 million unique facts or examples**.
- **Overall validation-loss reduction:** about 20.29% from the original 1,800-step checkpoint, using the same deterministic validation sampling.
- **Final test cross-entropy:** 1.084794 nats/byte token (separate 760-example split, evaluated after selecting the final checkpoint; the test split was not used for optimization or checkpoint selection).
- **Checkpoint:** `NOVA_Core_Continued_Weights.pt` inside the user-facing **NOVA_Core_Continued_Training.zip** archive.
- **Continuation:** the checkpoint stores model weights, optimizer state, training steps and the SHA-256 of the original starter ZIP for more reliable future resumption.

## What these scores mean

A lower loss indicates progress on byte prediction. It does **not** mean NOVA can reliably solve questions, write applications from arbitrary requests, reason, browse websites on its own, or approach mainstream AI assistants. The synthetic training, validation and test examples are generated from related templates, so the losses overestimate novel-task performance. Open-ended samples after this additional training remained mostly incoherent, including for simple greetings and math.

The website uses **NOVA Native** (a separately trained intent model) plus optional **NOVA Pro** (an explicitly hosted model) and Native Online reference-search tools. The tiny original generative checkpoint is research-only; it was not deployed into any chat mode.

## Resume from this checkpoint

Use the original dataset ZIP and this repository's `training/train_starter_pack.py`:

```sh
python -m pip install torch
python training/train_starter_pack.py --zip NOVA_training_data_v1.zip --resume NOVA_Core_Continued_Weights.pt --steps 500 --batch 16 --lr 0.0001 --save nova-core-next.pt
```

The trainer now restores optimizer state when available, verifies a saved dataset fingerprint, and saves optimizer state for subsequent runs. Earlier 1,800-step checkpoints did not include optimizer state and therefore start with a fresh optimizer. The test split should not be used to choose training hyperparameters.

## Limits and next experiments

Further repeated training on identical templates has diminishing returns. The priorities are legally usable diverse text, a more capable language architecture and tokenizer with a longer context, independently reviewed instruction-following evaluations, and a secure deployment runtime. Do not advertise trillions of training items or unlimited hosted inference.
