# NOVA practical intelligence upgrade — November 10, 2026

This release improves **product capabilities** and the assistant's use of external services. It does **not** mean the original NOVA neural network has been trained to Claude/Fable/GPT level. NOVA Native remains a small intent classifier and experimental local skills. NOVA Pro uses a **separately hosted open-weight language model** subject to Cloudflare's allocation and actual deployments.

## Implemented in GitHub

### 1. Smarter conversation entry

- **✦ Pro** in the chat header selects the hosted conversational model with one tap.
- NOVA's Native intent router handles common informal greetings and typographical variants without replacing the answer with web links.
- Web toggle means permission to research **when useful**, not an instruction to search every message.
- More factual and current questions can trigger searches; ordinary conversation does not.

**Important:** If the Worker isn't deployed, AI binding is missing, or owner passcode is wrong, NOVA Pro cannot produce hosted model answers. NOVA Native by itself remains limited in general reasoning.

### 2. Search public webpages, not only search snippets

- NOVA supports Tavily / Brave whole-web search when an owner key is configured.
- An **explicit** request to **read, summarize, or analyze a public HTTPS URL** can use Tavily's Extract API to retrieve page text, before generating an answer.
- It never directly fetches arbitrary URLs from the Worker; the extraction request goes to Tavily's fixed provider endpoint.
- It rejects obvious private-network/localhost targets, prevents non-HTTPS extraction, and only returns bounded excerpts to the model.
- Tavily extraction consumes search-provider credits (availability and quotas set by Tavily). If extraction is unavailable, NOVA falls back to search snippets; this is not full autonomous browsing.
- The hosted system instructions now encourage direct synthesized answers with citations and explicitly distinguish extracted page text from short search snippets.

To activate: configure **TAVILY_API_KEY** as a Worker secret and **NOVA_PASSCODE**, deploy the updated Worker, and toggle **Web** in NOVA. Search is optional. Do **not** put API keys in GitHub source.

### 3. Memory focused on useful, trusted facts

- Off-device memory uses an opt-in Cloudflare D1 database bound as **NOVA_MEMORY**.
- A conservative memory policy saves user-stated project decisions, persistent preferences, and explicit “remember” statements rather than storing every conversation and AI response.
- It avoids automatic saves containing obvious credentials and sensitive account information.
- Server-side memory saves also reject recognizable credentials and de-duplicate identical memory content.
- It retrieves up to five ranked passages using D1's full-text search, passing bounded references into the hosted model request.
- **View / delete memories** and **Clear cloud memory** provide manual deletion, separately from locally saved chat history.

The D1 database must be created, the schema applied, and the Worker binding configured **in your Cloudflare account**. Code commits do not create the database. Check **Settings → Memory & privacy → Check cloud memory** to confirm the live connection.

D1 Free provides up to **5 GB combined** over up to **10 databases with 500 MB maximum per database** as of November 10, 2026; these limits are not allocated space. Official limits: https://developers.cloudflare.com/d1/platform/limits/ . Memory is not end-to-end encrypted, and this implementation has **single-owner passcode access only**. Avoid storing personal/sensitive details. The Python 1 TB index remains an **independent local prototype**, not free cloud capacity or direct model context.

Full setup: [Cloudflare D1 memory instructions](cloudflare/CLOUD_MEMORY_SETUP.md).

### 4. Safer project debugging

- HTML/CSS/JavaScript artifact previews still run in an **iframe sandbox without same-origin access**.
- The preview catches JavaScript errors and unhandled promise rejections and shows a short diagnostic summary.
- **✦ Fix errors** copies preview errors into a proposed NOVA Pro Build-mode prompt, with the active artifact's files. The user reviews it and presses Send before using hosted AI.
- No arbitrary shell execution, filesystem access, automatic deployments, remote build access, or guaranteed repairs are claimed. The preview is **browser-only**.

### 5. Regressions and reproducible testing

GitHub Actions runs:
```sh
node tests/nova_smoke.cjs
node tests/nova_native.cjs
node tests/nova_online.cjs
node tests/nova_preview.cjs
node tests/nova_cloud_memory.cjs
node tests/nova_behavior_eval.cjs
python3 training/test_pipeline.py
python3 training/test_memory_index.py
```

The **NOVA behavior evaluation** tests routing and privacy policies on a fixed set of examples. It is not a general-intelligence score or a Claude comparison. Cloudflare's actual database, the live Tavily key, hosted inference quality, and browser runtime on an iPhone require live testing after deployment.

## Quick verification on your phone

1. Open https://exclusive2knight.github.io/NOVA-AI/ and reload the page so updated files are loaded.
2. Tap **✦ Pro**, then enter a valid Worker URL and owner passcode in Settings if needed.
3. Ask **“How are we doing?”** with Web on. It should be normal conversation (not a link list).
4. Ask **“Search the web for the latest public electric vehicle information.”** with Web on. If Tavily is configured, expect sources across the public web.
5. Ask **“Read and summarize https://example.com/review”** with Web on, replacing the URL with an actual *public HTTPS page*. With Tavily set up, the backend can extract bounded page text.
6. In **Settings → Memory & privacy**, enable cloud memory, run **Check cloud memory**, then add a non-sensitive project note and save it to the cloud.
7. Build a small HTML/JS project, open its Artifact preview, and use **✦ Fix errors** if an error is detected.

## Not yet achieved

- A frontier-quality original general-purpose language model. This requires much larger licensed datasets, suitable compute, modern architecture, intensive training, expert evaluations, and safety work.
- Real long-running autonomous computer use, deployment, or shell execution.
- Image understanding, audio understanding, and video analysis approaching frontier multimodal models.
- Secure multi-user accounts, E2E-encrypted memory, semantic vector search at large scale, memory export/restore, or a deployed terabyte-class database.
- Any credible “percent as capable as Claude Fable” measurement. A UI feature count is not a model intelligence evaluation.

**Next engineering priorities:** controlled model benchmarking on representative prompts, stronger retrieval ranking and memory corrections, secure account authentication before serving other users, and a deliberately permissioned coding sandbox with measured end-to-end success rates. These are substantial further projects, not automatically completed by this release.
