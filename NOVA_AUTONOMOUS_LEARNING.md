# NOVA AutoLab — autonomous neural training, safely gated

NOVA AutoLab performs **real weight updates** to NOVA Native 2.0, the original 50,033-parameter local intent classifier used by the app. It does not pretend that cloud-hosted GPT-OSS, Qwen or other large models are secretly retrained.

## Automatic learning

On the main GitHub branch, `.github/workflows/nova-autonomous-learning.yml` is scheduled for **every six hours** (UTC; GitHub Actions scheduling can be delayed or disabled by repository/account settings). You can also start it manually through GitHub's **Actions → NOVA Autonomous Native Learning → Run workflow**.

Each cycle:

1. Loads the current **published** int16-trained native neural checkpoint and the existing original, project-authored labeled intent examples in `nova-native.js`.
2. Measures two independent, human-authored evaluation suites **before** further training.
3. Performs **18 additional supervised neural training epochs** on the already-approved labeled examples. There is no scrape, hidden user-chat ingestion, web activity, unsupervised truth invention or provider API cost.
4. Re-evaluates the candidate on both suites. Rejects it if any previously correct example becomes wrong, any suite loses accuracy, confident wrong predictions increase, calibrated error worsens significantly, or overall score fails to improve.
5. If accepted, compresses the candidate, reloads the quantized weights into a fresh neural network, checks the same gate **again**, and replaces the checkpoint.
6. Updates the single-file Cloudflare Worker asset bundle, runs checks, writes a JSON audit report as a GitHub Actions artifact, and **only then** commits improved weights to `main`. Rejected rounds preserve the previous model. All changes remain visible in Git history.

The learning cycle is bounded (18 epochs per run, 12-minute maximum workflow time) and uses built-in Node.js, so no GPU, API keys or paid model services are required. Running it does consume GitHub Actions execution/storage quota under the repo's current plan and policies. Check your Actions settings for usage and limits.

## What it changes

- Real, deployed-browser **NOVA Native intent classification weights** when a candidate passes the gate.
- No automatic ability increase to NOVA Pro, GPT-OSS 120B, Qwen, GLM, image creation, or GLB quality.
- No automatic fine-tuning of a big language model. The existing `training/finetune_qwen3_8b_qlora.py` is a **separate GPU-required experimental trainer** with curated permitted samples and held-out validation. You must explicitly provide GPU compute, approve training data, run that trainer and connect its resulting adapter to a compatible inference service before it can change hosted responses.

**Important deployment note:** A successful GitHub Actions bot commit to `main` might not trigger other push-driven workflows (GitHub normally suppresses recursive workflow triggers for `GITHUB_TOKEN`). GitHub Pages and Cloudflare deployment settings must be checked separately. The repository checkpoint can improve even when the live site/Worker has not yet updated. The single-file Worker is synchronized in the repo, but this workflow does not independently deploy it.

## Limitations

- Repeated training on the same small curriculum can plateau or overfit. AutoLab deliberately **rejects** non-improving candidates rather than running forever or fabricating results. Reusing fixed held-out tests for promotion can gradually overfit the tests; you should add fresh, authorized independent evaluation sets over time.
- Higher accuracy at 17 task intents is **not** proof of broad conversational reasoning.
- A label can be wrong. Data from new users, websites, private conversations or correction memory is **not** silently converted to training examples. Curate and authorize any new labeled training data first.
- GitHub Actions or branch protections may prevent autonomous pushes. Look at the workflow run logs and the JSON report for the actual result and errors. No claim is made that a scheduled run has already completed.

## Manual dry-run

From the root of the cloned repository with Node.js 22:

```bash
node training/autonomous_native_round.cjs --report /tmp/nova-learning-report.json
node tests/nova_auto_learning.cjs
```

To **apply a candidate only when accepted** to the local clone:

```bash
node training/autonomous_native_round.cjs --apply --report native-learning-report.json
node training/sync_embedded_weights.cjs
node tests/nova_native_checkpoint.cjs
```

Read the output report's `decision.promote` and `liveWeightsChanged` values to distinguish training attempts from actual promotions.
