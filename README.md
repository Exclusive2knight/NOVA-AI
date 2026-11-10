# NOVA AI · Mobile AI Workshop

NOVA is an experimental AI workshop built for chat, creating editable code files, simple website previews, local project exports, and optional reference search. It is **not** Claude or a model of equivalent intelligence. Live language-model responses use Cloudflare Workers AI after deployment; there is no secret AI service or fake chat backend in the offline version.

## What is in this repository?

- `index.html` — mobile-friendly **offline** NOVA workspace. This opens in a browser and supports local files, editing, previews and exports. It does not call an AI model.
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
The config is in `cloudflare/wrangler.jsonc`. Only the Cloudflare-hosted site has the server APIs; GitHub Pages is **offline-workspace-only**.

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

The GitHub Pages site provides the offline workspace and experimental local model, including saved files. The online features (hosted model chat, web reference search and AI-generated files) require the separate Cloudflare Worker. If the Cloudflare Worker has not been deployed, choosing Gemma/GLM/Qwen will show a setup message instead of pretending to answer.

User data is stored in that browser by default. Speech input may involve the browser vendor's speech service; check your browser's privacy terms. AI chat sent to the Cloudflare backend shares submitted content with that service. Keep credentials in Worker secrets only.

## Project status

Source uploaded to GitHub. The root page is an **offline workspace** until GitHub Pages is enabled. **Live AI is not deployed** until the Cloudflare Worker is published and configured.

MIT licensed — see [LICENSE](LICENSE).
