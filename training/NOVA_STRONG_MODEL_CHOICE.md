# NOVA Stronger Pretrained Model — Verified choices (November 10, 2026)

This guide selects an existing *already pretrained and instruction tuned* language model. It does not pretend that NOVA's 137K-parameter scratch model can be trained into ChatGPT or Claude using a few thousand more optimization steps.

## Decision: best model for each NOVA goal

| Goal | Model | How it works | Costs / limits |
|---|---|---|---|
| **Best practical hosted NOVA Pro** | **Qwen3.8-27B** | Current Worker `pro` / `qwen` model: `@cf/qwen/qwen3.8-27b` | Cloudflare metered Workers AI; 262,144-token context; vision and tools |
| **Strong advanced coding and reasoning** | DeepSeek V4.1 Flash 1017 | Existing conditional `PAID_PRO` Worker model: `@cf/deepseek-ai/deepseek-v4.1-flash-1017` | **Paid access required**, not activated by default; 1M-token context |
| **Cost-conscious hosted fallback** | Gemma 4 26B A4B | Existing `gemma` model: `@cf/google/gemma-4-26b-a4b-it` | Cloudflare usage quotas/prices; 256K context |
| **Custom training on a moderate GPU** | **Qwen3-8B** | New optional `finetune_qwen3_8b_qlora.py` QLoRA pipeline; text-only instruction tuning | Model Apache 2.0; NVIDIA GPU typically ~16GB VRAM or better; adapter not hosted |
| **Small existing experimental recipe** | Qwen3-0.6B | Older minimal LoRA demonstration | Easier to fit GPU, much weaker base model |

Official current model references:
- Cloudflare: https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/
- Cloudflare: https://developers.cloudflare.com/workers-ai/models/deepseek-v4.1-flash-1017/
- Cloudflare: https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/
- Qwen Apache-2.0 Qwen3-8B: https://huggingface.co/Qwen/Qwen3-8B

Cloudflare announced model deprecations effective **November 20, 2026**. These current model choices are preferred to obsolete alternatives:
https://developers.cloudflare.com/changelog/post/2026-11-05-planned-model-deprecations/

## Important discovery: NOVA already selects Qwen3.8-27B

The Cloudflare Worker in GitHub already sets:

```js
const MODELS = {
  gemma: '@cf/google/gemma-4-26b-a4b-it',
  glm: '@cf/zai-org/glm-4.7-flash',
  qwen: '@cf/qwen/qwen3.8-27b',
  pro: '@cf/qwen/qwen3.8-27b'
};
const PAID_PRO = '@cf/deepseek-ai/deepseek-v4.1-flash-1017';
```

**No paid model change has been made.** The optional DeepSeek route requires explicit Cloudflare-side configuration and paid access and is never silently enabled.

**The GitHub repository having these model IDs is not proof that the latest Worker has deployed.** The recent Cloudflare auto-deploy runs were skipped, so a live app may still be using an older Worker until the owner's Cloudflare setup is completed.

## New: optional Qwen3-8B fine-tuning

For a real **trainable** model stronger than the previous tiny model:

1. Open [NOVA Strong 8B training notebook](https://colab.research.google.com/github/Exclusive2knight/NOVA-AI/blob/main/training/NOVA_Strong_8B_QLoRA_Colab.ipynb).
2. Select Runtime → Change runtime type → NVIDIA GPU, if offered.
3. Run the notebook to build the curated 77-example SFT dataset, load Qwen3-8B in 4-bit NF4 mode, train an adapter, and save validation metrics.
4. Download the LoRA adapter ZIP. It is not the full base model. This notebook neither uses private chat history nor auto-deploys anything to Cloudflare.

**The training notebook and script are implemented but no GPU training was run from this GitHub commit.** GPU free-tier availability is not guaranteed; the default 30-step/77-example exercise is far too small for frontier-model performance.

### What to improve instead of more tiny-model training

Increase the diversity and quality of licensed, reviewed examples; include real multi-turn tasks, coding/debugging benchmarks, and reference-grounded responses. Evaluate trained models independently, not only synthetic held-out token loss. Serving a Qwen3-8B LoRA requires a compatible inference runtime outside the current Cloudflare Workers AI base binding.

### Model quality is not a single percentage

Good benchmark comparisons need the **same prompts**, honest blinded answer scoring, pass/fail coding tests, tool usage accuracy, latency and cost evaluation. Published leaderboard scores can help choose a candidate but are not NOVA's verified performance. Proprietary GPT and Claude weights are not accessible for direct copying or training.
