# NOVA Core Tiny — independently verified continuation (November 10, 2026)

**Status:** Real local PyTorch training and evaluation were performed on the existing user-owned NOVA tiny model and CC0 synthetic dataset. These results are research-only, not deployed into NOVA Native, NOVA Pro, or the live chat interface.

## Checkpoint and measured results

| Metric | Previous checkpoint | New checkpoint |
|---|---:|---:|
| Cumulative training steps | 4,900 | **5,900** |
| Architecture / weights | 137,216 params | 137,216 params |
| Context | 64 byte tokens | 64 byte tokens |
| Validation cross-entropy (nats/byte) | 1.033672 | **0.993550** |
| Held-out test cross-entropy (nats/byte) | 1.084794 | **1.044340** |

The new run used **1,000 additional steps** at learning rate **0.00008**, batch size **16**, with evaluation at 200-step intervals. The relative validation-loss improvement in the new round is **3.882%**. The held-out test split was evaluated after training, not used for gradient updates or hyperparameter selection in that run.

Source dataset: 6,078 training, 760 validation and 760 test example dialogues. All are derived from related synthetic templates. Lower same-generator byte-level loss **does not demonstrate open-ended intelligence**. Generated samples are still incoherent, for example:

> User: Hello  
> NOVA: Solve order becar in formance equentencectsn?

This example is provided to avoid misrepresenting model capabilities.

## Reproducibility

The trained weights, JSON report, training code, and original dataset are in a separate user-visible archive shared in the ChatGPT project conversation. The public GitHub repo does not include new binary weights.

The continuation command was:

```sh
python continue_nova.py \
  --data NOVA_training_data_v1.zip \
  --resume NOVA_Core_Continued_Weights.pt \
  --steps 1000 --batch 16 --lr 0.00008 --eval-every 200 \
  --output NOVA_Core_Round3_Weights.pt
```

The saved checkpoint contains model parameters, configuration, optimizer state, and total training steps. It must be loaded only from trusted sources.

The following measurements were obtained by loading the saved checkpoint using `torch.load(..., weights_only=True)`, constructing `NOVATransformer` from the saved configuration, running `eval_model` on the validation/test token sequences and sampling output. The test used fixed seed `202606` and 15 evaluation batches.

## Why this does not close the frontier-model gap

- An original 137k-parameter model with 64 byte tokens of context cannot interpret long, novel questions reliably.
- Repeating the same templated dialogues is not a substitute for broad licensed pretraining and human evaluation.
- It was **not connected** to the app's production chat.
- The next original-model milestone is a better tokenizer and architecture, diverse legally usable corpora, representative holdout benchmarks, greater compute, and explicit misuse/safety evaluation.

The user-facing assistant improvements in [NOVA_UPGRADE_GUIDE.md](../NOVA_UPGRADE_GUIDE.md) rely on routing, hosted models and practical tools, not on this research checkpoint.
