# NOVA Native — original offline AI model

**NOVA Native** is our own small neural-network model. Its source is [`nova-native.js`](../nova-native.js). Its weights are **initialized and trained from scratch on your device**, using the original examples embedded in the project. It does **not** call Claude, GPT, Gemma, Qwen, GLM, Cloudflare Workers AI, or a paid API for its local responses.

## What it is

- A compact 2-layer neural **intent classifier**, not a generative large language model.
- 192 hashed bag-of-word/bigram input features → 48 tanh hidden units → 17 skill categories.
- **10,097 trainable floating-point parameters**, trained by local supervised gradient updates and cross-entropy loss. It learns how to select a task category.
- A set of transparent **local tools/templates** generates actual editable HTML, CSS, and JavaScript when a supported task is recognized. Those tools are deterministic code, not a neural language generator.
- A local mathematical calculator, basic extractive summarizer, and limited conversational responses.
- Training weights and custom intent examples saved to the current browser's local storage, independently of NOVA chat history.

The activity view shows **real executed stages** (local training, tokenization, neural intent classification, local skill routing, file creation, artifact saving). It **does not show hidden private AI reasoning or execute terminal commands**. It does not claim to do either.

## Use it

1. Open [NOVA AI](https://exclusive2knight.github.io/NOVA-AI/).
2. Choose **NOVA Native · Original AI** at the top. For existing installations, refresh the page to get the latest service worker.
3. Ask `Build a website for my business`, `Create a to-do app`, `Make a timer`, or `What is 8 * 7?`.
4. On first use, NOVA trains its neural weights in the browser. Future requests run on your device without waiting for a Cloudflare model.
5. Expand **Activity** under its answer to see actual work stages; open the **artifact** card to preview/edit/export generated files.
6. Under **Settings → Original NOVA Native model**, you can manually retrain the classifier or teach it new examples mapped to a supported category.

The local project generator currently supports responsive websites, portfolios, to-do lists, notes, timers, four-operation calculators, dashboards with clearly marked example data, and a simple clicker mini game. Projects are starting points and should be tested and customized.

## Privacy and limitations

- No hosted AI request or passcode is needed for NOVA Native. You can use the installed PWA offline after its assets have been cached.
- Model weights are **not** shared across devices and are **not** included in standard NOVA chat backups. Clear browser site data to delete the local weights.
- You cannot train NOVA Native to understand arbitrary new skills by adding a prompt example alone; additional skills require implementing and testing new code.
- Not suitable for important factual advice, complex coding, medical/legal decisions, or open-ended reasoning. The classifier may select the wrong skill. The keyword checks improve task routing but are not neural intelligence.
- **NOVA Native is not smarter than Claude or any frontier language model.** It is a real and small beginning for independent model development.
- The separate [PyTorch model lab](train_nova.py) implements a basic decoder-only transformer with **Tiny, Mini, and Core** profiles, but it is not integrated into this browser app and does not have trained, general-purpose weights. Running and scaling those transformer models requires a separate compute environment, datasets, evaluation, and further engineering.

## Next technical milestones

1. Evaluate the classifier on a held-out dataset, add confidence calibration, improve vocabulary and out-of-distribution handling.
2. Build a genuine on-device neural text generator (tokenizer + decoder transformer), train it on a legally usable dataset, and benchmark coherence.
3. Build safe, transparent local tools and a permission-aware sandbox to plan and verify more multi-step tasks.
4. Add optional encrypted cross-device project sync and searchable document memory.
5. Deploy an original model inference service when there is sufficient compute; until then, the locally trained model remains intentionally small.

The project is open under the repository's MIT License. Local training is free; no cloud credits are required.
