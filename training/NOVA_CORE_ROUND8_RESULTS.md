# NOVA Core Tiny — continued training to 17,000 steps

**Completed November 10, 2026.** This report documents actual CPU optimization on the original small NOVA decoder transformer, resumed from the previously generated **11,800-step** checkpoint.

## Checkpoints and measurements

| Checkpoint | Cumulative steps | Validation loss | Held-out synthetic test loss |
|---|---:|---:|---:|
| Round 6 baseline | 11,800 | 0.898423 | 0.891066 |
| Round 7 | 14,400 | 0.879438 | 0.870113 |
| **Round 8** | **17,000** | **0.863903** | **0.853919** |

This run added **5,200 real optimizer steps** (2,600 at learning rate 0.000025, then 2,600 at learning rate 0.000020, batch size 16), taking the best validation checkpoint after each round.

From the 11,800-step baseline to 17,000 steps, the validation loss decreased **3.842%** and the consistently measured held-out test loss decreased **4.169%**. Lower loss indicates better next-byte predictions on these samples. The held-out comparison was recomputed for **all three checkpoints using the same 80 fixed batches of 8 64-byte windows**, sampled from a synthetic test split of **760 examples** with seed 440017. The test split was **not used to train or select** a checkpoint. It is not a full exhaustive evaluation of all 760 examples.

Model architecture: **137,216 trainable parameters, 64-byte-token context**, byte-level scratch-trained two-block transformer. The training data is repeated and comes from the same synthetic generator family for train/validation/test, so this evaluation does not test general conversational intelligence.

## Critical outcome

The continued training converged on the synthetic text prediction task, but **generated responses are still incoherent**. Examples from a fixed seed on the final model were:

- `User: Hello` → starts with `Sollo, I'm ris one cann Thave?` (unreliable and incoherent)
- `User: What is a car?` → starts with `Solve: 814, 18, -17...` (not an answer)
- `User: How are you?` → starts with `Solve order.` (not useful)

This is **not GPT or Claude-level training**. No meaningful multi-turn reasoning, deep factual learning, tool use or code generation was established by these loss improvements. The updated weights were **not deployed** to the live GitHub Pages or Cloudflare Worker.

The complete checkpoint, training scripts, original permitted synthetic data, both training logs and verification report are bundled in the ZIP delivered in the conversation. To avoid filling a public repository with weights and datasets, only these results are committed here.

## Next development step

Further training this same 137K-parameter scratch model is unlikely to bridge the capability gap. The repository also contains a more practical LoRA fine-tuning path for an Apache-2.0 pretrained model in [NOVA Open Training Guide](NOVA_OPEN_TRAINING_GUIDE.md) and [NOVA Open Training Colab notebook](NOVA_Open_Training_Colab.ipynb). These scripts are prepared but **GPU LoRA training has not run in this environment**. A successful LoRA model also needs a compatible hosting runtime to reach NOVA users; the Cloudflare Worker will not automatically adopt an adapter.

For meaningful progress, expand diverse, legally usable training examples and evaluate independently written prompts, conversational helpfulness, safe tool use and coding success—not just synthetically held-out next-token loss.
