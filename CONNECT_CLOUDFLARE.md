# Connect NOVA to the deployed Cloudflare Worker

**Your known Worker address:** https://nova-ai.jmoreygreer.workers.dev

**Check API status:** https://nova-ai.jmoreygreer.workers.dev/api/status

**Your published website:** https://exclusive2knight.github.io/NOVA-AI/

NOVA now prepopulates its Cloudflare backend URL with your known Worker address on devices where you have not already selected another server. You still must configure the **Workers AI binding named `AI`** and the **`NOVA_PASSCODE` Worker secret. No secrets belong in GitHub, screenshots, or chat. A successful `/api/status` check should report `"ai": true` and `"passcodeProtected": true`. This proves only that the Worker advertises those configurations, not that every model invocation succeeds.

**Website:** https://exclusive2knight.github.io/NOVA-AI/

The GitHub Pages website is already deployed. It provides NOVA's chat UI, local files, experimental NOVA Tiny, and installation as a PWA. GitHub Pages itself cannot run the hosted AI. The server script is available in this repository at `cloudflare/NOVA_3_Phone_Deploy_Worker.js`, and the frontend has a Settings field for the Worker's URL.

## Part A — Deploy your AI server on Cloudflare (laptop)

You only need to do this once, using a Cloudflare account eligible to use Workers AI. **Do not put passwords, API keys, or credit card details in GitHub or ChatGPT.**

1. Sign in to https://dash.cloudflare.com/ and open **Workers & Pages**.
2. Click **Create application**, choose **Import an existing Git repository** / **GitHub**.
3. If prompted, authorize the **Cloudflare Workers and Pages** GitHub integration for your own `Exclusive2knight/NOVA-AI` repository. Choose that repository, then branch `main`.
4. Set the **Worker name** to **`nova-ai`** (it must match the `name` in the Wrangler configuration).
5. Set **Root directory** to **`cloudflare`** (not the repository root).
6. Leave the optional **Build command** blank. Set **Deploy command** to **`npx wrangler deploy`** (the default).
7. Click **Save and Deploy**. After a successful deploy, Cloudflare will provide a full HTTPS address like `https://nova-ai.jmoreygreer.workers.dev`. It will not be exactly this example; **copy your actual URL**.

The project configuration is already committed as `cloudflare/wrangler.jsonc`, with an **AI binding** named **`AI`**. If the Worker does not see it, open the deployed Worker **Settings → Bindings**, add **Workers AI**, and set the variable name to `AI`; then deploy again.

## Part B — Set your private access passcode

1. Open your Worker from Cloudflare's **Workers & Pages** list.
2. Go to **Settings → Variables and Secrets → Add**.
3. Choose type **Secret**, name it exactly **`NOVA_PASSCODE`**, and enter a unique, private password with at least 8 characters.
4. **Deploy** to apply the secret. Do not put this value in any GitHub file or share it in chat.

Keep `NOVA_ENABLE_PAID_PRO` **unset**. NOVA Pro will use a free-compatible hosted reasoning model when available. The optional paid model is only for an eligible account owner who explicitly opts in and accepts billing.

## Part C — Connect your GitHub Pages website

1. Open https://exclusive2knight.github.io/NOVA-AI/ in a browser.
2. Open **Settings**.
3. Under **Connection & installation**, paste your **Cloudflare AI server URL** (the `https://…workers.dev` address you copied) into **Cloudflare AI server URL**.
4. Click **Test AI server connection**. If it says the AI binding and passcode are configured, proceed.
5. Enter the **same passcode** you created in the `NOVA_PASSCODE` secret.
6. Select **Save settings**.
7. In the model selector choose **Gemma 4**, **Qwen 3.8**, **GLM 4.7**, or **NOVA Pro**. Type a simple question and tap Send.

The AI is now served by Cloudflare, while the interface keeps using your original GitHub Pages URL.

## Testing and troubleshooting

- **Site shows offline workspace:** The Worker URL may not be saved, or the Worker isn't deployed yet. Reopen Settings and test connection.
- **CORS or Failed to fetch:** Make sure you're using the new `cloudflare/NOVA_3_Phone_Deploy_Worker.js` version. The Worker only permits the GitHub Pages origin `https://exclusive2knight.github.io` and its own origin for API calls. Cloudflare must redeploy after the latest GitHub commit.
- **404 at /api/status:** The URL is incorrect or the wrong Cloudflare application was deployed. It must point to a Worker, not GitHub Pages.
- **401 Incorrect passcode:** The browser passcode must exactly match the Cloudflare `NOVA_PASSCODE` secret.
- **503 AI binding missing:** Check `AI` binding in Cloudflare Settings → Bindings, and redeploy.
- **AI free quota reached:** Check Cloudflare Workers AI usage and wait for the allowance to reset. NOVA's in-app daily request bars are **local counts**, not provider credit measurements.
- **Pages looks outdated:** Refresh. If installed as a PWA, close and reopen the app while connected to the internet.
- **Model unavailable:** Try Gemma 4 or GLM 4.7. Provider availability can change; users may need to choose a supported model.

The public site should not be used as an open multi-user AI service with a single shared passcode. NOVA's passcode provides basic access protection only and does not replace authentication and server-side rate limiting.

## References

- Cloudflare Workers import from Git: https://developers.cloudflare.com/workers/ci-cd/builds/
- Worker Git build settings: https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- Add Worker secrets: https://developers.cloudflare.com/workers/configuration/secrets/
- Workers AI bindings: https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/
