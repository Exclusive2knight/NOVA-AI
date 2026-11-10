# NOVA Core Tiny — Continued training to 23,000 steps

**November 10, 2026.** Completed 6,000 actual CPU optimizer steps from the Round 8 checkpoint (17,000 steps).

## Verified model performance

| Checkpoint | Steps | Validation loss | Held-out synthetic test loss |
|---|---:|---:|---:|
| Round 8 | 17,000 | 0.863903 | 0.853919 |
| Round 9 | 20,000 | 0.852031 | 0.841596 |
| **Round 10** | **23,000** | **0.843907** | **0.833609** |

From 17,000 to 23,000 steps, validation loss decreased **2.315%** and the consistently measured test loss decreased **2.378%**. The two training stages each ran 3,000 optimization steps, batch size 16, with learning rates 0.000015 and 0.000010. Best checkpoints were selected from validation loss only.

All three checkpoints were evaluated using exactly the same 80 deterministic test batches with eight 64-byte windows per batch, using seed 440017 from a pre-existing 760-example synthetic test split. The test split was **never used to train or select checkpoints**.

The ZIP supplied in the chat contains all three actual model files, the original synthetic starter training data, training scripts and logs, and reproducible held-out evaluation results.

## Does this model match ChatGPT or Claude?

**No.** NOVA Core remains a 137,216-parameter scratch-trained decoder with a context of only 64 byte tokens. Generation remains incoherent. For example, a greeting produced a response beginning with "Sollo, I’m ris one carries a notence..." and the car-definition prompt produced an unrelated number-problem fragment.

The train and held-out test examples are generated from the same synthetic data family, so the test losses are **not** measurements of independent real-world conversational ability. The checkpoint is **not installed in the deployed NOVA website or Cloudflare Worker**.

For meaningful conversational progress, the project has a more realistic [open pretrained-model LoRA training path](NOVA_OPEN_TRAINING_GUIDE.md) using Qwen3. It requires GPU resources and a separate compatible deployment. The training environment for this round had no CUDA GPU, so no Qwen fine-tuning occurred here. Evaluations of coherence, multi-turn instruction following, knowledge and code quality are necessary before making capability comparisons.

More steps on this tiny model will not realistically bridge the gap to frontier model intelligence.
