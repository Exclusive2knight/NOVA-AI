# NOVA Turbo Learning — continuous improvement from corrections

NOVA's hosted AI responses can become more consistent with your ongoing projects immediately through **retrieval-based learning**. This is a real software feature, but **not an autonomous retraining of hosted language-model weights**.

## What happens after every hosted chat

When **both** Cloud Memory and Turbo Learning are enabled in **Settings → Memory & privacy**:

1. NOVA keeps your regular opt-in project facts and preferences.
2. If you correct an earlier answer using phrases such as "No, I meant …", "Actually …", "You forgot …" or "Instead …", it recognizes a user-authored correction.
3. It uses the previous **user prompt** as a topic label, never the AI's unverified assertion as truth.
4. The completed conversation's correction is saved to your own Cloudflare D1 database through the authenticated memory endpoint, after basic sensitive-data checks.
5. For a later relevant hosted request, NOVA searches its D1 memory and gives matching corrections to the AI as **context, not overriding system instructions**. Short follow-ups include the prior topic in the search.

Learning occurs after each eligible completed reply—**no fixed daily training window**. No extra model invocation is needed for detection, so this does not spend extra inference tokens solely to create lessons. It still uses normal Cloudflare D1 reads/writes subject to plan limits.

## Enabling

1. Connect the Cloudflare Worker and create/bind a **NOVA_MEMORY** D1 database (see [cloud memory setup](cloudflare/CLOUD_MEMORY_SETUP.md)).
2. Select a working hosted model (e.g. NOVA Pro).
3. In **Settings → Memory & privacy**, enable **Off-device cloud memory** and **Turbo Learning**, then save.
4. Use **Check cloud memory** to confirm the server-side database.
5. Review and edit learning entries using **View / correct memories**, export them, or clear them entirely.

Both features default to OFF. This branch does not configure or deploy your Cloudflare account. GitHub Pages updates after the PR is merged; Worker updates depend on your Cloudflare deployment configuration.

## Limits and safeguards

- This learns **from your explicit corrections** rather than hallucinated AI-generated answers.
- No private uploaded files, web scraping or full chat transcripts are silently repurposed as training data.
- It screens obvious credentials, email addresses, phone numbers, account numbers and certain sensitive topics. Automated filtering is not infallible; review saved entries.
- It does **not** continuously train Qwen, GPT-OSS, or NOVA Core weights. Real model fine-tuning needs approved training datasets, independent held-out tests, hardware and gated deployment.
- Stale or conflicting memory entries may remain until you correct/delete them. Retrieval can miss things or make errors; it is not guaranteed learning.
- This affects **hosted-AI chat and build modes**. The on-device NOVA Native/Tiny models are not magically retrained.
- The GitHub implementation and local parsing checks are not proof that your own live Cloudflare Worker and D1 are configured.

## Engineering tests

`node tests/nova_learning.cjs` validates correction detection, exclusions for sensitive information, opt-in UI plumbing and continuity of chat recall. CI runs it on pull requests alongside the project's existing behavior and memory tests.
