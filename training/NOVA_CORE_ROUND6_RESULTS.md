# NOVA Core Tiny — verified continuation to 11,800 steps

**November 10, 2026. This is original, CPU-trained NOVA Core, not NOVA Pro.**

Two additional continuation rounds trained directly from the previously supplied 6,800-step checkpoint, using the same CC0-style synthetic starter data, the original scratch-model architecture and measured validation loss.

| Checkpoint | Cumulative optimization steps | Validation loss | Held-out test loss |
|---|---:|---:|---:|
| Round 4 (baseline) | 6,800 | 0.974882 | 0.990790 |
| Round 5 | 9,400 | 0.926954 | 0.944411 |
| Round 6 | **11,800** | **0.898423** | **0.915849** |

The new 5,000 steps reduced validation loss by **7.843%** and the same held-out test loss by **7.564%** relative to the 6,800-step checkpoint. These are nats-per-byte-token next-byte-prediction results; lower is better. All models were evaluated on the same 760-example held-out synthetic test split, with the same evaluation sampling seed, and that test split was **not used during training or to pick checkpoints**.

**Critical limitations:** The model has **137,216 trainable parameters and a 64-byte-token context window**. Its generation samples are still incoherent; the test examples come from the same synthetic generator as training examples. Decreasing loss on that held-out test therefore **does not demonstrate coherent conversation, instruction following, coding ability or parity with ChatGPT/Claude**. The new checkpoint is **not deployed to NOVA's GitHub Pages app or Cloudflare Worker**.

Training parameters:
- Round 5: 2,600 further steps, batch 16, learning rate 5e-5, validation checks every 200 steps.
- Round 6: 2,400 further steps, batch 16, learning rate 3.5e-5, validation checks every 200 steps.
- Gradient norm clipped to 1.0 and best validation checkpoint saved after each round.
- Two successive validated checkpoints and all source/training artifacts were included in a downloadable ZIP provided in the associated ChatGPT conversation; the model binary is not committed to this public repository.

## What actually moves NOVA closer to powerful assistants

1. **Start from a capable open-weight pretrained language model** for conversation, rather than continue training a 64-byte-context scratch model. The repository has a [Qwen LoRA GPU training notebook](NOVA_Open_Training_Colab.ipynb) and [open training guide](NOVA_OPEN_TRAINING_GUIDE.md).
2. **Train on diverse, verified, permissioned examples**, not repeated synthetic templates. The current starter SFT dataset has only 77 examples, far below the quality/diversity needed for strong general performance.
3. **Evaluate with independently written user tasks** (conversation, tool use, coding, factual accuracy, safety). A training-loss improvement isn't a capability score.
4. **Deploy a compatible serving runtime** for the selected model after training. NOVA's existing Cloudflare Workers AI binding does not automatically load private LoRA adapters.

The notebook has not been run within the repo's GitHub Actions and GPU access is not configured. Never describe the Qwen adapter as trained or deployed until successful real training and a verified host integration occur.
