# NOVA AI · Mobile AI Workshop

> **Stronger pretrained model update:** NOVA Pro already selects **Qwen3.8-27B** in the Worker code, with an optional, owner-controlled paid DeepSeek V4.1 Flash path. [See verified model choices](training/NOVA_STRONG_MODEL_CHOICE.md). A [Qwen3-8B 4-bit LoRA training notebook](training/NOVA_Strong_8B_QLoRA_Colab.ipynb) is also available for custom GPU fine-tuning. No extra paid service was activated and no new GPU training has run by adding the notebook.

> **Training update (November 10, 2026):** NOVA Core was trained for **6,000 additional CPU steps**, totaling **23,000**. Same-split held-out synthetic test loss decreased **2.378%** compared with 17,000 steps. Sample generations are still incoherent, and the checkpoint has not been deployed. [Read the measured results](training/NOVA_CORE_ROUND10_RESULTS.md).

> **NOVA Core training update:** 5,200 more CPU training steps completed, now **17,000 cumulative steps**. Held-out synthetic test loss fell **4.169%** versus the 11,800-step checkpoint; sample responses remain incoherent. [Read the verified evaluation](training/NOVA_CORE_ROUND8_RESULTS.md). These model weights are not deployed to the website.

> **NOVA Core training update (Nov 10, 2026):** Original 137K-parameter byte transformer continued from 6,800 to **11,800 steps**. Held-out synthetic test loss improved **7.56%**, but generated text is still incoherent and no live model deployment occurred. [See validated results and caveats](training/NOVA_CORE_ROUND6_RESULTS.md).

> **NEW: NOVA Open Model training.** [Training guide](training/NOVA_OPEN_TRAINING_GUIDE.md) · [Colab GPU notebook](training/NOVA_Open_Training_Colab.ipynb). Adds supervised LoRA fine-tuning, curated training/validation/test data, held-out evaluation and a local adapter test. This **does not** train ChatGPT/Claude or replace the deployed NOVA Pro model automatically.

> **NEW NOVA Create Studio:** [Generate pictures and genuine downloadable GLB starter models](NOVA_CREATE_STUDIO.md) from one prompt. Image creation runs through Cloudflare FLUX when connected; basic GLB creation works offline on your phone. An optional Pro mode plans custom 3D parts. These are starter meshes rather than finished high-detail vehicle models.

> **Cloudflare auto-deployment and phone cache fixes:** To connect the GitHub repo to the actual NOVA Worker once, follow [Cloudflare automatic deployment setup](CLOUDFLARE_AUTO_DEPLOY_SETUP.md). GitHub Pages and the Worker are separate; the Web and cloud-memory UI may appear before the cloud service is deployed.

> **New owner-controlled capabilities:** Cloud-memory correction and JSON export, optional Cloudflare image analysis, offline HTML/CSS/JS checks, and manual NOVA Pro answer review. [Read the setup and limits](NOVA_CAPABILITIES_RELEASE_2026-11-10.md). Deployment and owner configuration still required for Cloudflare features.

> **November 10, 2026 upgrade:** NOVA now has an explicit **✦ Pro** shortcut for hosted conversational AI, selective opt-in off-device Cloudflare D1 memory, on-demand Tavily extraction for user-requested public webpages, and sandboxed JavaScript preview error reporting with a user-reviewed **✦ Fix errors** workflow. [Read the complete upgrade and setup guide](NOVA_UPGRADE_GUIDE.md). These GitHub changes need Cloudflare deployment and credentials/bindings for hosted features; the original NOVA neural model has not become frontier-class.

NOVA is an experimental AI workshop built for chat, creating editable code files, simple website previews, local project exports, and optional reference search. It is **not** Claude or a model of equivalent intelligence. Live language-model responses use Cloudflare Workers AI after deployment; there is no secret AI service or fake chat backend in the offline version.

## NOVA Native Online — sourced research without switching models

**NOVA Native can now use the internet while keeping its own neural model local.** Turn on **Web** in NOVA Native to get online search excerpts and clickable reference links. The feature uses the configured Cloudflare Worker if available, and falls back to a direct Wikipedia search from GitHub Pages when the Worker is unavailable. It does **not** require Cloudflare Workers AI or a paid model, and local project generation still works as before.

Native Online sends only the current search question to a reference source, not the entire chat, uploaded files or neural weights. Wikipedia is the free default; a separately configured Tavily search provider can provide broader web results for requests authenticated by the NOVA owner. This is **lookup with sources**, not unrestricted web browsing or a frontier language model.

See [How to use NOVA Native Online](NOVA_NATIVE_ONLINE.md) and [the online integration tests](tests/nova_online.cjs).

## More NOVA Native requests and creative skills

The original neural model recognizes **17 broad intent categories**—this is **not a limit of 17 messages**. NOVA Native and NOVA Tiny do not have a provider-side daily request quota. The optional personal daily-goal setting no longer stops local conversations, and its tracking range is up to one million/day; this is **not a guarantee of one million messages or a performance benchmark**.

NOVA now offers **14 additional local project generators**: habit tracker, expense planner, Kanban board, flashcards, drawing pad, color palettes, random picker, calendar planner, invoice draft, survey builder, unit converter, recipe organizer, bookmarks and typing test. Together with the existing nine starter templates, the workspace supports **23 template types**; the original 17-class neural checkpoint is unchanged. Each generated project has editable HTML/CSS/JavaScript and can be previewed within NOVA.

See [Expanded NOVA requests and skills](NOVA_EXPANDED_REQUESTS.md), the [modular skills source](nova-skills.js), and [automated tests](tests/nova_skills.cjs).

## NOVA original-model training pipeline

The [training system](training/TRAINING_SYSTEM.md) now provides an **actual experimental training workflow** for the original NOVA decoder transformer:

- **Approved-text pretraining:** `prepare_corpus.py` audits licensed local text, removes exact duplicates and obvious private information, and separates source-level training/validation/test sets. `pretrain.py` runs PyTorch next-token training, optionally with training-only synthetic examples.
- **Synthetic dialogue:** `synthetic_dialogue.py` makes conservative, provenance-labeled variants from original seed examples. It does not fake billions of conversations.
- **Opt-in feedback:** NOVA Studio has local **Helpful / Needs work** rating controls with private label export. Separately, `prepare_preferences.py` curates explicitly consenting preferred/rejected examples and `train_preferences.py` implements DPO-style gradient-based preference optimization for the original checkpoint.
- **Principle-guided review:** `nova_constitution.json` defines NOVA's own principles; `constitutional_review.py` flags simple risks for human inspection. This is **not** full model-based Constitutional AI or online RLHF.

The new work is **source code and a small demonstrator**, not billions of trained tokens or a fully trained general-purpose assistant. The web app's original NOVA Native model remains its trained intent classifier; generative transformer research checkpoints are not yet a selectable production model.

## NOVA Studio — redesigned website and installable app

NOVA now has a polished original interface for chat and editable Artifacts, with a desktop focus mode, smooth loading/entrance animations, a responsive mobile layout, dark/light themes, spacing and motion preferences, keyboard shortcuts, and useful accessibility options. The same site installs as a Progressive Web App on supported devices. It is **not** a native App Store/Play Store package.

**Slang and typos:** The local [NOVA language adapter](nova-language.js) expands supported abbreviations and repairs common task-word misspellings, discloses its interpretation, and asks for clarification when wording is too uncertain. This does **not** imply NOVA understands all slang or has general language-model intelligence. Its original neural classifier and trained weights remain the core of NOVA Native.

**Local creations:** NOVA Native can now create basic interactive quiz projects as well as websites, portfolios, task apps, note apps, timers, calculators, dashboards and small games. The **Activity** panel shows operations that really occurred. Full details and settings: [NOVA Studio guide](NOVA_STUDIO.md). Regression suite: `tests/nova_studio.cjs`.

## NOVA Native 2 — our own trained offline AI

**NOVA Native 2.0** is our original on-device neural intent model with **50,033 trained parameters**, now loaded instantly from an approximately **131 KiB** compressed checkpoint in `nova-native-weights.js`. It recognizes 17 task categories and can route supported requests to local tools that create editable websites and mini-app artifacts—no Cloudflare request, paid API, or passcode required.

**Independent intent-routing evaluations:** **58/68 (85.3%)** on one unseen test set and **24/34 (70.6%)** on a second. The first-generation Native 1.0 reached **14/68 (20.6%)** on the original test. These numbers assess *task recognition only*, not intelligence or open-ended response quality.

The neural classifier is trained from scratch; the project templates and simple calculations are deterministic code, not neural text generation. NOVA Native is **not equivalent to Claude or a frontier language model**. It is a practical base for our own research and can be taught additional intent examples under Settings.

Details: [NOVA Native model report](training/NOVA_NATIVE.md), [original model source](nova-native.js), [bundled trained weights](nova-native-weights.js), and [reproducible benchmark tests](tests/nova_native_checkpoint.cjs).

## What is in this repository?

- `nova-native.js` — our own trainable browser neural-network model and local task tools.
- `nova-native-weights.js` — bundled compressed weights trained on original NOVA examples, for immediate offline inference.
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
