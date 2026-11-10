# Connect NOVA GitHub to Cloudflare once, then deploy automatically

NOVA's frontend runs on **GitHub Pages**, while hosted AI, Tavily search and off-device
memory use a **separate Cloudflare Worker**. The code in GitHub is not automatically
deployed to Cloudflare until you authorize the GitHub Actions workflow.

This repository contains an opt-in workflow:
[Deploy NOVA to Cloudflare](.github/workflows/nova-deploy-cloudflare.yml).

## Status and privacy

- The workflow is **disabled by default** for automatic deployment. It does not deploy
  while `NOVA_AUTO_DEPLOY` is unset or not equal to `true`.
- It only automatically deploys a successful CI-tested push to `main`, never a pull request.
- It can also run manually via **GitHub → Actions → Deploy NOVA to Cloudflare → Run workflow**
  on `main`, after the owner configures secrets.
- The workflow deploys the existing `nova-ai` Worker and binds Cloudflare Workers AI as `AI`
  and an existing D1 database `nova-memory` as `NOVA_MEMORY`. It applies the initial
  D1 migration before publishing the Worker. It does **not** create a D1 database.
- It **does not read, upload or overwrite** your existing `NOVA_PASSCODE` or
  `TAVILY_API_KEY` secrets. Those must already exist securely in your Worker settings.
- Never put API keys, passwords, passcodes, private chat data or credentials in GitHub
  files, public GitHub issues, screenshots, or a chat message.

## Step 1 — create / verify the cloud memory database

1. Sign in to https://dash.cloudflare.com/.
2. Open **Storage & Databases → D1**.
3. Create a database called `nova-memory`, if it does not already exist.
4. Copy the database **UUID** from its overview. The ID is not a password but you
   can store it in a GitHub Actions secret as configured below.

## Step 2 — create a restricted Cloudflare API token

1. In Cloudflare, go to **Account → Manage account → Account API Tokens**.
2. Click **Create Token** and choose a permission setup sufficient to deploy
   only the existing `nova-ai` Worker and apply D1 migrations to `nova-memory`.
   Cloudflare calls this the **Edit Cloudflare Workers** permission template;
   verify that your token also has permission to edit the `nova-memory` D1 database.
3. Restrict the scope to your account and, where supported, the specific Worker and D1
   database rather than granting access to everything.
4. Create and copy the API token **directly into your GitHub repository secret**
   in the next step. Do not put it anywhere in the project files.
5. Find your Cloudflare **Account ID** in the Cloudflare dashboard. This is distinct
   from the D1 database UUID.

Official instructions:
https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/

## Step 3 — add three private GitHub Actions secrets

Open https://github.com/Exclusive2knight/NOVA-AI/settings/secrets/actions
(or **GitHub repository → Settings → Secrets and variables → Actions → Secrets**).

Create these three **repository secrets**, using the exact names:

| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | The restricted Cloudflare API token |
| `CLOUDFLARE_ACCOUNT_ID` | The account ID from Cloudflare |
| `NOVA_D1_DATABASE_ID` | The `nova-memory` database UUID |

The workflow generates `wrangler.ci.json` only inside the temporary GitHub Actions runner.
This file is ignored by Git and never committed. It retains the existing AI binding and
adds the D1 database binding.

## Step 4 — test a one-time deployment

1. Open **GitHub → Actions → Deploy NOVA to Cloudflare**.
2. Choose **Run workflow**, select the `main` branch, and run it.
3. Wait for the run to succeed. If it fails, inspect the error message in GitHub Actions;
   **do not copy any secrets or tokens into support chats**.
4. Open NOVA at https://exclusive2knight.github.io/NOVA-AI/ and refresh.
5. In NOVA, go to **Settings → Memory & privacy**, enable off-device cloud memory,
   then select **Check cloud memory**. It should report that Cloudflare is connected.
6. Ensure your existing Cloudflare Worker also has secret `NOVA_PASSCODE` set.
   To enable Tavily-powered web research, its secret `TAVILY_API_KEY` must be set.

## Step 5 — enable automatic deploys (optional)

Open https://github.com/Exclusive2knight/NOVA-AI/settings/variables/actions
(or **Repository Settings → Secrets and variables → Actions → Variables**).

Create a **repository variable**:

`NOVA_AUTO_DEPLOY` = `true`

Once enabled, a successful **push to main** that passes the existing
**NOVA code and artifacts checks** workflow automatically triggers a Cloudflare deployment.

To pause automatic deployments without changing code or removing private secrets,
change the variable to `false` or delete it. You can still choose **Run workflow**
manually when ready.

## Why the old app might still appear

The website and Worker are **different deployments**. GitHub Pages can be green while
the Worker deployment is still skipped. NOVA's phone app also previously used cache-first
JavaScript; the updated service worker now prefers network copies with an offline fallback.

If the **Web** or **☁ Memory** button seems to have disappeared:
1. Open the main GitHub Pages URL in Safari instead of the existing Home Screen app.
2. Refresh the page.
3. Confirm you can see **Web** and **☁ Memory** beside the message box (the labels may be
   shortened to icons on small phone screens).
4. Tap **☁ Memory** to open the Memory & privacy section of settings.
5. Tap **Check cloud memory**. This **does not** claim to be connected until the server
   confirms the D1 binding and table are available.
6. If it says unavailable, inspect the deploy workflow and the `NOVA_MEMORY` binding.

GitHub Pages publishing success does not confirm the Cloudflare Worker has updated or
that the database is live.

## Usage, quotas and costs

The automated tests do not spend provider API credits. Actual Cloudflare deployments,
Workers AI requests and D1 migrations use your Cloudflare account, and are subject to its
free-tier or paid-plan limits. Keep monitoring usage and choose billing intentionally.

The full memory schema and privacy notes:
[cloudflare/CLOUD_MEMORY_SETUP.md](cloudflare/CLOUD_MEMORY_SETUP.md).
