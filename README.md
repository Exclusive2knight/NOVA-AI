# NOVA AI · Mobile AI Workshop

NOVA is an experimental AI workshop built for chat, creating editable code files, simple website previews, local project exports, and optional reference search. It is **not** Claude or a model of equivalent intelligence. Live language-model responses use Cloudflare Workers AI after deployment; there is no secret AI service or fake chat backend in the offline version.

## What is in this repository?

- `index.html` — mobile-friendly **offline** NOVA workspace. This opens in a browser and supports local files, editing, previews and exports. It can call your connected Cloudflare Worker when the server URL and passcode are configured; otherwise it runs as an offline workspace.
- `cloudflare/NOVA_3_Phone_Deploy_Worker.js` — **full online NOVA app and backend**, including an embedded website, chat APIs, AI and search integrations.
- `cloudflare/wrangler.jsonc` — Cloudflare Worker deployment configuration with a Workers AI binding called `AI`.
- `LICENSE` — MIT License (copyright 2026 Exclusive2knight).
- `.nojekyll` — keeps GitHub Pages static hosting simple.

## Open the offline website

The root `index.html` works as a static site without installing anything. To host it with GitHub Pages, open your repository **Settings → Pages** and select **Deploy from a branch**, **main**, **/(root)**, then save. Note that GitHub Free generally requires a **public repository** for GitHub Pages. This repository was private when these files were uploaded. Changing visibility is your choice; don't put private data, API keys, or passwords in a public repo.

The GitHub Pages URL will normally be `https://exclusive2knight.github.io/NOVA-AI/` **only after Pages is enabled and a deployment succeeds**.

## Enable real AI on Cloudflare

To make the actual AI work, deploy the `cloudflare/NOVA_3_Phone_Deploy_Worker.js` file as a **Cloudflare Worker**. It includes the entire website so no static assets are required. It can be deployed from a computer with Wrangler or pasted into the Cloudflare Worker code editor:

1. Use an eligible Cloudflare account, create a Worker and deploy the script.
2. Add an **AI binding** named `AI` in Worker settings.
3. Set a secret named `NOVA_PASSCODE` (at least 8 characters) using Cloudflare's **Secrets/Variables** controls. Do **not** paste a passcode into GitHub.
4. Visit the Worker URL ending in `.workers.dev`, open NOVA Settings, and enter the same passcode.
5. Try a chat message, then Build mode. The live AI depends on the model and free-tier allowances available to your account.

If using Wrangler on a laptop, run from the `cloudflare` folder with a compatible Node.js install:
```sh
npx wrangler deploy
npx wrangler secret put NOVA_PASSCODE
```
The config is in `cloudflare/wrangler.jsonc`. The browser can also call the deployed Cloudflare Worker from GitHub Pages using NOVA's configured server URL. GitHub Pages itself does not execute AI inference.

## Search, files, and limitations

- Wikipedia reference lookup is included. Broader Tavily web search is optional and requires an independently configured `TAVILY_API_KEY` secret and an eligible provider account.
- The file workspace supports editable **text/code files**, site previews and ZIP downloads; it does not run arbitrary programs, produce compiled apps or generate GLB files itself.
- Chat data, memory notes and workspace files are stored locally in the browser by default. Export a backup if you want to move devices.
- Sending a chat to live AI shares the submitted text and selected file contents with the Cloudflare AI service. Do not send passwords, personal documents or private keys.
- The shared passcode is suitable only for a personal experiment, not a fully secured public multi-user AI platform.
- Web hosting and AI capacity are separate: free plans have limits and availability can change.


## NOVA 4 preview: formal design, voice, install, model selection

The repository now has a restrained navy/blue **NOVA** logo and UI, plus a Progressive Web App manifest, icons, and offline app-shell service worker.

### Install on your phone or computer

- **iPhone/iPad**: open the deployed website in Safari, tap **Share**, choose **Add to Home Screen**, and open the new NOVA icon. Browser speech recognition varies on iOS; typed chat remains available.
- **Android/desktop**: open the deployed website in Chrome or a compatible browser, then choose **Install app** / **Add to Home Screen** in the browser menu.
- This installs the **web app** (PWA). It is not a downloadable native iOS IPA, Windows EXE, or Android APK.

### Models, speech, and our original research models

The model dropdown offers **Gemma 4**, **GLM 4.7 Flash**, **Qwen 3.8**, and **NOVA Tiny (local experiment)**.
The first three use Cloudflare Workers AI **only after deploying and configuring the Worker**. They are third-party open-weight models, not original NOVA weights. Usage and availability depend on the Cloudflare account and model catalog.
NOVA Tiny is a locally trained *word-transition model* with a tiny corpus. It is not a language model comparable to Claude and cannot reliably answer general questions. You can teach it short examples in Settings.

The new **training/train_nova.py** file implements a separate, genuinely original decoder-only *neural transformer* that can be trained from scratch using the data files. This neural checkpoint does not yet run in NOVA's web interface and requires substantial further development. See [training/README.md](training/README.md).

The **microphone** control uses browser speech recognition where supported; microphone permission is required, and results are inserted into the composer. **Listen** uses the device's speech-synthesis voices to read a response aloud, with an optional auto-read setting. These are browser features, not a custom trained speech model.

### Hosting status

The GitHub Pages site provides the interface, local artifacts and experimental local model. It can connect to the separate Cloudflare Worker at the prefilled server URL for hosted-model chat, web reference search and AI-generated files. If the Cloudflare Worker has not been deployed, choosing Gemma/GLM/Qwen will show a setup message instead of pretending to answer.

User data is stored in that browser by default. Speech input may involve the browser vendor's speech service; check your browser's privacy terms. AI chat sent to the Cloudflare backend shares submitted content with that service. Keep credentials in Worker secrets only.


## Live GitHub Pages website and Cloudflare AI connection

**Public NOVA website:** https://exclusive2knight.github.io/NOVA-AI/

**Connect the AI to this website:** Follow [CONNECT_CLOUDFLARE.md](CONNECT_CLOUDFLARE.md). Deploy the Worker from the `cloudflare` subfolder of this repository via Cloudflare's GitHub import, set the `AI` binding and `NOVA_PASSCODE` secret on Cloudflare, then open NOVA **Settings → Connection & installation** and confirm the prefilled `https://nova-ai.jmoreygreer.workers.dev` address. Select **Test AI server connection**, enter your passcode locally, and save.

GitHub Pages hosts the interface. Chat and Build using hosted AI models will only function after the Cloudflare Worker is deployed. The Worker explicitly allows API requests from `https://exclusive2knight.github.io` but not arbitrary origins. **Never commit passcodes, passwords, or API keys to GitHub.**

## NOVA Pro and local usage dashboard

**NOVA Pro is a goal and a configuration—not a Claude Fable-level custom model.** The current free-compatible Pro route uses `@cf/qwen/qwen3.8-27b` with adaptive reasoning effort, a longer response budget, and response-style preferences. Qwen is a third-party hosted model; it is not trained by NOVA.

**Optional advanced hosted backend (PAID ONLY):** An eligible Cloudflare account owner can explicitly set `NOVA_ENABLE_PAID_PRO=true` on the **Worker server** to route Pro to `@cf/deepseek-ai/deepseek-v4.1-flash-1017`. This model requires Workers Paid or prepaid AI Gateway credits and can cause usage charges. It is **disabled by default**. Never add billing information, API secrets, or passcodes to GitHub or to browser code. Neither option has been evaluated as equal to Claude Fable.

The NOVA interface tracks successful locally initiated requests (including locally generated NOVA Tiny replies and Worker chat/build requests) in this browser. The usage dashboard shows:

- **Today’s requests** and a configurable daily goal (UTC calendar day)
- **Requests during the last seven UTC days** and a configurable weekly goal
- **Today’s requests by selected model**, with visual bars
- An optional **browser-only daily pause** that can be adjusted in Settings

**These are counts, not token totals or Cloudflare neuron usage.** They do not aggregate other browsers, devices, app installations or other visitors to the Worker, and they are not an enforceable server-side billing limit. For provider usage, open the [Cloudflare Workers AI dashboard](https://dash.cloudflare.com/). To avoid unexpected charges, do not enable paid Pro unless you understand its billing.

### Expanded settings

The Settings panel includes model selection, response length and tone, creativity, dark/light/system appearance, default web/Build toggles, device voice choice and speed, optional voice read-aloud, memory notes, backup import/export, the browser-only daily pause, reset usage counts and delete local chat history. Existing browser data is retained by the same app storage key.

**Status:** The source was uploaded and the JavaScript passed syntax/unit-level checks. This does not verify an active Worker deployment, inference availability, cloud quotas, or phone microphone behavior.


## NOVA Artifacts and long-answer continuation

**NOVA Artifacts** are real editable text/code creations stored in the local browser workspace. Use **Build** to ask NOVA to create a project, or click **Create artifact** on a reply that contains a supported fenced code block. NOVA stores a snapshot (up to ten recent artifacts), displays an artifact card in the conversation, and lets you use **Preview**, **Edit**, and **Download ZIP**. The Artifacts gallery is available inside Files. HTML/CSS/JS previews run in sandboxed iframes inside NOVA, not on an unrestricted server. The backup import/export carries artifact snapshots.

**Long answers:** NOVA now reads streaming finish reasons and attempts up to two extra continuation requests when the provider reports an output-token limit. Each additional request uses provider resources and can be blocked by quota. Use the **Continue** action under a response for additional output. Existing chat history is kept locally; recent messages plus selected relevant older excerpts are sent to the hosted model. This may improve continuity but is not perfect recall, and cannot guarantee unlimited length or infinite context.

**Reasoning:** NOVA Pro defaults to quick reasoning on short questions instead of spending a large budget on hidden reasoning. Settings offers Auto, Quick, Standard, and Deep. The Extended response option requests a larger output allowance, which Cloudflare may limit. Provider model availability, charges and streaming truncation still apply.

**Original NOVA research:** [Training profiles](training/train_nova.py), [checkpoint inference](training/infer_nova.py), [local SQLite document retrieval](training/memory_index.py), and [long-memory roadmap](training/LONG_MEMORY_ROADMAP.md) are included. NOVA Tiny, Mini and Core have from-scratch **training code**, but their checkpoints are **not** pretrained, not integrated into Cloudflare, and not frontier models. The browser's NOVA Tiny is a separate word-transition experiment. The SQLite index is a local prototype; it has not been tested at a billion-token scale and does not provide a billion-token context window.

**Tests:** [GitHub Actions checks](.github/workflows/nova-ci.yml) validate the frontend, Worker bundle, training Python syntax, and the document index. GitHub Pages deployment only verifies static hosting; neither test proves paid/free Cloudflare inference is working.


## Project status

Source uploaded to GitHub. GitHub Pages has deployed successfully. Hosted AI works only after the separate Cloudflare Worker is deployed and correctly configured with a compatible model and private passcode. No live inference test was completed from ChatGPT.

MIT licensed — see [LICENSE](LICENSE).
