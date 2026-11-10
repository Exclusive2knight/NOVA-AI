# NOVA Native Online — whole-web search with owner configuration

NOVA can now search **general public websites** through Brave Search or Tavily (when enabled in your Cloudflare Worker), instead of only Wikipedia. These search engines return ranked public webpage results with titles, short excerpts and clickable source links. NOVA Pro can use those sources to support its generated answers when hosted AI is configured. Native mode shows source excerpts without pretending the local intent model can reliably summarize the full internet.

**Deployment status:** Code is committed, but full-web search only operates after your Cloudflare Worker is deployed with a valid provider API key and NOVA owner passcode. If these secrets are missing, NOVA explicitly falls back to Wikipedia, not general web search. Search provider quotas, terms and fees apply.

## Set up on your phone or computer

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com/) and go to **Workers & Pages** → your NOVA Worker → **Settings**.
2. Under **Variables and Secrets**, choose **Add** and select **Secret**. Add **one** of:
   - `TAVILY_API_KEY` — a Tavily Search API key
   - `BRAVE_SEARCH_API_KEY` — a Brave Search API key
3. Add `NOVA_PASSCODE` as a separate secret if you haven't already. Use your own strong value; keep it private and do not send it through this chat or commit it to GitHub.
4. Optionally set `NOVA_SEARCH_PROVIDER` to `brave` or `tavily` if both keys exist. Otherwise, Tavily is chosen first when available.
5. **Deploy the Worker** with the latest backend code from `cloudflare/NOVA_3_Phone_Deploy_Worker.js`. If you use Cloudflare's Git-connected deployment, confirm that the latest commit is live; GitHub Pages publishing alone does *not* deploy Worker code.
6. Open [NOVA AI](https://exclusive2knight.github.io/NOVA-AI/), go to **Settings**, confirm the Worker address and enter your `NOVA_PASSCODE` in the existing owner field. Turn on **Web**, then try `Search the web for EV charging standards`.

Your search runs through the Worker, which sends only the current query to the configured provider. API keys are stored in Worker secrets; the browser never receives provider tokens. The owner passcode is used to authorize searches that could consume provider credits. The passcode is stored in NOVA's existing browser settings, so avoid shared devices. Anonymous or unauthorized users cannot spend the owner's search-provider credits; their searches use Wikipedia.

## What works, and what does not

- **Works:** full-web results from Brave or Tavily (if configured), clickable links, short source previews, optional sourced responses through separately hosted models, Wikipedia fallback, source sanitization, and strict SafeSearch for Brave.
- **Not yet supported:** a general-purpose internet browser that can click into arbitrary sites, navigate logins, fill forms, read entire pages, or autonomously research dozens of documents. Search results may be incomplete, outdated or misleading.
- **Not free by default:** providers control pricing, free credits and rate limits. A quota target is not unlimited API access. Do not expose an owner passcode publicly or give unrestricted access to a paid provider.

## Developer testing

```sh
node tests/nova_online.cjs
```

Regression tests mock all provider requests and verify that public requests cannot spend a configured Brave or Tavily API key. GitHub Actions runs these checks; they do not prove the owner has deployed or configured the key.

Official documentation:
- Brave Search API: https://api-dashboard.search.brave.com/app/documentation/web-search
- Tavily Search API: https://help.tavily.com/articles/4840311948-tavily-search-api
- Cloudflare Worker Secrets: https://developers.cloudflare.com/workers/configuration/secrets/

---

## Original Wikipedia/reference-only setup (historical)

NOVA Native's **own local neural network** still runs in your browser. This historical section describes the original Wikipedia fallback; see the whole-web setup above. Online mode adds real reference retrieval, not a replacement hosted chatbot.

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
