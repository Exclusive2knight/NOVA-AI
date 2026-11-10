# NOVA upgrade: cloud memory corrections, vision, code checks, and self-review

**Status:** Committed to GitHub; GitHub Action tests verify code paths with mocked APIs. **Not a claim that these integrations were deployed or used successfully in the owner's live Cloudflare account.**

## 1. Cloud memory corrections and backup
Existing Cloudflare D1 owner-only memory supports opt-in storing selected project facts, search, list, and deletion. This release additionally supports:
- **Correct memory** next to an entry in Settings → Memory & privacy → View / correct memories.
- **Export cloud memory JSON** in Settings to download the full searchable memory using secure cursor pagination (up to 200 entries per API page).
- API actions `edit` and `export` require the existing `NOVA_PASSCODE`, permitted site origin and D1 binding `NOVA_MEMORY`; no secrets are published in GitHub.

Important: The exported JSON contains memory content. Store it privately; there is no cloud restore button yet. Cloud memory is **not end-to-end encrypted** and this is **single-owner access**, not authenticated multi-user accounts. The D1 database must be created and bound before these features work. Do not enable storing private sensitive data.

## 2. Photo understanding

When a Cloudflare Workers AI binding named `AI` exists and the owner passcode is configured:
1. In NOVA, tap **✦ Pro**, then tap the **📷** button by the message box.
2. Add an optional question in the message composer first, and choose an image.
3. Confirm the upload. The browser downscales the picture to at most 900 pixels along its longest side, re-encodes it as JPEG (stripping original EXIF data), and posts the image + question to **/api/vision**.
4. NOVA uses Cloudflare model `@cf/meta/llama-3.2-11b-vision-instruct` to describe or answer a question about the picture.
5. NOVA saves **only the question and a textual answer** in local chat; the image pixels are **not** saved to the chat or D1 cloud memory.

Cloudflare requires the owner to first **accept Meta's model license**, described at:
https://developers.cloudflare.com/workers-ai/models/llama-3.2-11b-vision-instruct/
and the owner is responsible for provider usage, quota and licensing. This may not be available for every account or region. Do not send private photos without consent. Image analysis can still make mistakes and cannot reliably identify real people.

The backend rejects non-JPEG/PNG/WebP input, oversized images, invalid owner passcodes and unapproved origins. Photos are sent to Cloudflare Workers AI only after confirmation. No face recognition is implemented.

## 3. Local project checks (no AI credits)

NOVA now includes the standalone `nova-project-check.js` checker. Open the Artifacts preview and choose **✓ Check code** or **↻ Refresh**. NOVA can catch:
- missing `index.html` / HTML entrypoint,
- missing local script and stylesheet files,
- duplicate HTML element IDs,
- some references to nonexistent literal element IDs,
- empty JavaScript / CSS source files.

These are **static heuristics**, not a parser, compiler, exhaustive security scanner or full test suite. Browser JavaScript errors continue to be reported from the isolated iframe preview. **✦ Fix errors** prepares a user-reviewed Pro Build prompt that includes diagnostics; no external model is invoked until the user presses Send.

## 4. On-demand answer self-review

On an existing chat response, **Review answer** prepares a follow-up prompt asking NOVA Pro to check its earlier reasoning and unsupported assertions. The user reviews and sends the prompt. This is self-critique, **not independent factual verification**. Hosted AI usage is metered only when you send the request.

## 5. Deploy and verify

1. Go to https://github.com/Exclusive2knight/NOVA-AI/ and verify the newest GitHub Actions test passes.
2. GitHub Pages updates the frontend when published. Refresh NOVA on your phone; an installed PWA may need to be closed and reopened.
3. **Cloudflare Worker is separate from GitHub Pages:** deploy the newest `cloudflare/NOVA_3_Phone_Deploy_Worker.js` to `nova-ai` and keep your existing `AI` binding and `NOVA_PASSCODE` Worker secret. D1 requires `NOVA_MEMORY` and the FTS5 table; see `cloudflare/CLOUD_MEMORY_SETUP.md`.
4. For image understanding, accept the Llama Vision license in your Cloudflare account before testing it. If Cloudflare returns a license or quota error, the app will explain that.
5. Run the app and explicitly test memory corrections, export, photo analysis, project check, and answer review. No live provider calls are included in repository CI.

## What this does NOT achieve

- Frontier model intelligence or a model comparable to Claude/Fable.
- The original NOVA Native intent network has **not** acquired vision or advanced reasoning; the optional hosted model does those tasks.
- Secure multi-user cloud accounts or encrypted cross-device memory.
- Remote shell execution, arbitrary file writes, unattended autonomous agents, or safe cloud browser control.
- Free infinite storage or guaranteed zero-cost unlimited AI usage.

**Practical next steps:** manually test the live Cloudflare Worker, improve memory retrieval beyond FTS5 keywords, introduce signed-in user-specific permissions before offering NOVA publicly, and build evaluation suites against real, independently scored examples.
