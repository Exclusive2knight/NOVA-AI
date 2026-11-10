# NOVA Native Online — connected reference search

NOVA Native's **own local neural network** still runs in your browser. Online mode adds real reference retrieval, not a replacement hosted chatbot.

## How to use

1. Open **https://exclusive2knight.github.io/NOVA-AI/**.
2. Choose **NOVA Native**.
3. Tap **Web** next to the message box. The status should change to **Native Online**.
4. Ask a research question, such as **“Look up how electric vehicles work.”**
5. NOVA shows source excerpts plus clickable links. Open the sources for the full information.
6. Tap **Web** again to disable outside searches. Native's local app builder still works without the internet.

## What runs where?

| Feature | Where it runs |
|---|---|
| NOVA Native neural intent recognition | Your device |
| Original NOVA project templates | Your device |
| Native Online research | Live internet request for one search query |
| Result presentation | Your browser, showing snippets and linked sources |
| Hosted NOVA Pro | Separately requires Cloudflare Workers AI (not needed for Native Online) |

NOVA first attempts `POST /api/native-search` at your configured Cloudflare Worker. This reference-only route **does not require** a Workers AI binding, paid model, or passcode. Public requests use Wikipedia search only.

If the Worker is missing or unavailable, NOVA tries Wikipedia's public MediaWiki Action API directly from the browser, using its documented `origin=*` CORS support. A configured Tavily full-web API key is used only when the authorized owner also supplies the correct `NOVA_PASSCODE`; anonymous search can never spend the owner's full-web provider quota through the new endpoint.

If the Worker isn't deployed at all, **Wikipedia browser fallback can still work on GitHub Pages** when the browser has internet access and Wikimedia permits the request.

**Limitations:** Without an authenticated full-web provider, this feature is Wikipedia/reference search, **not search across the whole internet**. It doesn't browse arbitrary links, compare live inventories, fact-check every sentence, or independently generate expert summaries. Results can be incomplete, outdated or wrong. NOVA labels excerpts as search references instead of pretending it reasoned from full documents.

## Privacy

- The feature is **opt-in**: turn on **Web** to allow online searches.
- The current **search query only** is sent to the configured Worker or, as fallback, directly to Wikimedia.
- **No entire conversation, uploaded files, saved notes, neural weights, or local training data** is included in Native Online requests.
- Wikipedia and any configured search provider may receive the user's network information and query; their privacy practices apply.
- Do not enter private passwords, secrets or sensitive personal information in online searches.
- Stored local chat history can still contain the text you typed; clear that history through NOVA Settings if needed.

## Code and testing

- `nova-online.js` — browser search router, public fallback, transparent excerpts
- `index.html` — Web control, sourced answers, Native Online indicator and privacy disclosure
- `cloudflare/NOVA_3_Phone_Deploy_Worker.js` — optional no-AI `/api/native-search` endpoint
- `tests/nova_online.cjs` — mock tests for Wikimedia fallback, app wiring, source handling, Cloudflare CORS, and protecting metered provider searches
- `sw.js` — caches the Online-mode client code for use when the PWA reconnects

Reference: https://www.mediawiki.org/wiki/API:Cross-site_requests

This upgrade does **not** train NOVA on retrieved material or change its original 50,033-parameter intent-classifier weights.
