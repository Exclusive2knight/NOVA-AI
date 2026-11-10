# NOVA Strong Free — GPT-OSS 120B

**Added November 10, 2026.** NOVA now offers **NOVA Strong Free**, using Cloudflare's hosted **`@cf/openai/gpt-oss-120b`** open-weight language model. It has approximately 120B total parameters, supports advanced reasoning and coding, and has a 128,000-token context window.

**How to select:** Open the NOVA website. Choose **NOVA Strong Free · GPT-OSS 120B** from the model menu, or tap the **✦ Strong** shortcut next to the selector. The previous Qwen3.8-27B and other models remain available.

## Free-tier behavior

- The model runs through NOVA's existing **Cloudflare Workers AI `AI` binding** and the same owner passcode. No additional third-party API key or account is necessary.
- Cloudflare Workers Free currently includes **10,000 Neurons per day**, shared across the Workers AI models. Free capacity and model access are subject to Cloudflare changes, daily usage and availability. This is **not** unlimited usage or free fine-tuning.
- GPT-OSS 120B is not listed as a paid-only Workers AI model in Cloudflare's documentation. On Workers Free, requests stop when the daily allowance is exhausted. Never enable a paid Workers plan merely to switch models.
- Strong Free tries the GPT-OSS 120B endpoint. If that model errors, NOVA tries **Qwen3.8-27B**, then GLM 4.7 Flash and Gemma 4 — not paid-only DeepSeek.
- Cloudflare's GPT-OSS endpoint documents `max_tokens`, which NOVA uses rather than Qwen's `max_completion_tokens`.
- The model is text-oriented in this configuration. NOVA's existing image generation and photo tools have their own Cloudflare models.

## What has and hasn't happened

Code, interface and mocked AI endpoint regression tests are committed to GitHub. The tests confirm model selection, proper token options, owner authorization, origin checks, the Qwen fallback and prevention of a paid-model fallback. **Mocked tests do not prove Cloudflare has served GPT-OSS 120B to the owner's live account.**

The GitHub Pages website and Cloudflare Worker are separate deployments. The **Cloudflare Worker must be deployed** to expose the new model. The repository's automatic Cloudflare deploy workflow may be skipped until the owner has added private deployment secrets and enabled it. This assistant cannot authorize the Cloudflare account.

A model with more parameters is not guaranteed to outperform Qwen3.8-27B on every task. To compare quality, ask both models the same programming/debugging and multi-step reasoning prompts, and measure correctness, latency, cost/Neuron consumption and output clarity.

Official sources:
- Cloudflare GPT-OSS 120B model: https://developers.cloudflare.com/workers-ai/models/gpt-oss-120b/
- Cloudflare Workers AI free allocations and paid access: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Existing Qwen3.8-27B: https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/
- One-time Cloudflare deployment authorization: [CLOUDFLARE_AUTO_DEPLOY_SETUP.md](CLOUDFLARE_AUTO_DEPLOY_SETUP.md)
