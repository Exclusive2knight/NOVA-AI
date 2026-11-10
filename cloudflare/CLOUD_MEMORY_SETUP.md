# NOVA Cloud Memory: off-device, free-tier setup

This option stores searchable memory on **Cloudflare D1 servers**, not in your phone's browser.
It is an **opt-in** addition to NOVA's existing local conversation history.
Claude-like memory uses retrieval of useful entries, rather than loading an entire database
into a language model's context window.

Cloudflare D1 Free currently provides **5 GB combined storage**, up to **10 databases of
500 MB each**, and can be started **without a credit card**. These are provider limits,
not capacity already allocated to NOVA or a guarantee of uninterrupted free service.
Source: https://developers.cloudflare.com/d1/platform/limits/
D1 pricing: https://www.cloudflare.com/products/d1/

## 1. Create the database on your Cloudflare account

1. Visit https://dash.cloudflare.com/ and log in.
2. Select **Storage & Databases → D1** (sometimes **Workers & Pages → D1**).
3. Select **Create database** and name it `nova-memory`.
4. Select the new database and open its **Console**.
5. Paste/run the SQL in [0001_nova_cloud_memory.sql](migrations/0001_nova_cloud_memory.sql):

```sql
CREATE VIRTUAL TABLE IF NOT EXISTS nova_memories USING fts5(
    body,
    source UNINDEXED,
    created_at UNINDEXED,
    id UNINDEXED,
    tokenize='unicode61'
);
```

This SQL creates an FTS5 search index, not an AI model or an already filled database.

## 2. Bind it to your existing NOVA Worker

1. Open Cloudflare **Workers & Pages → nova-ai → Settings → Bindings**.
2. Choose **Add binding → D1 database**.
3. Binding/variable name: `NOVA_MEMORY` (exact spelling).
4. Select database `nova-memory` and save/deploy.
5. Keep your existing `NOVA_PASSCODE` Worker secret. The same passcode protects cloud
   memory; **do not post it publicly**.

**Important if deployed by Git/Wrangler:** A managed Wrangler configuration can override
dashboard binding settings. In the root `wrangler.jsonc`, add the following with the
actual database ID shown in your D1 database overview:

```json
"d1_databases": [
  {
    "binding": "NOVA_MEMORY",
    "database_name": "nova-memory",
    "database_id": "PASTE-YOUR-ACTUAL-CLOUDFLARE-D1-DATABASE-ID"
  }
]
```

Keep the existing `ai`, `name`, `main`, and `compatibility_date` config fields.
If the Cloudflare Build root directory is `cloudflare`, put the binding in
`cloudflare/wrangler.jsonc` instead, with that real database ID. The ID is not a secret,
but **never** put API tokens or passcodes in GitHub. Deploy the updated Worker.

If your Worker build reports D1 binding missing, recheck the dashboard and the active
Wrangler config. This repository intentionally does **not** invent or hardcode a database ID.

## 3. Enable off-device memory in NOVA

1. Open https://exclusive2knight.github.io/NOVA-AI/ .
2. Select **Settings → Memory & privacy**.
3. Enter the Worker URL and your **NOVA owner passcode** in Settings.
4. Check **Enable off-device cloud memory (Cloudflare D1)**, then **Save settings**.
5. Open Settings again and select **Check cloud memory**. It should show
   `Connected to Cloudflare`, followed by the number of saved entries.
6. Choose **NOVA Pro** or another functioning hosted model for recall in normal answers.
7. Chat. Selected user-stated project facts and preferences will be stored in
   your D1 account and retrieved when relevant. NOVA does not automatically
   save every chat turn or an AI-generated reply as a fact.
8. To store an important fact right away, write it under **NOVA memory notes** and
   press **Save these notes to cloud memory**.

On another device, open the same NOVA site, set the same Worker URL and owner passcode,
and enable cloud memory. Both devices then read from the same database.

## Privacy, security and caveats

- Memory is **off by default**. Enabling it permits selected project facts and
  preferences from your new messages to be stored on your Cloudflare account. This may include project details and whatever you type, so
  avoid entering secrets, private credentials, or sensitive information.
- Memory is not end-to-end encrypted. Transport is HTTPS, and Cloudflare controls server
  storage. This is currently **single-owner access** protected by `NOVA_PASSCODE`.
  It is **not** a production-ready multi-user authentication system.
- Existing local chats are **not** automatically uploaded or transferred to other devices.
  The web app continues caching its chat interface/history locally, but **cloud memory
  entries are stored off-device**.
- Chat deletion in the local website does not delete cloud memory. Use **View / delete
  memories** or **Clear cloud memory** to remove cloud entries. These operations happen
  in your server-side database and cannot be undone without separate backups.
- The search is FTS5 lexical retrieval, not semantic embeddings or guaranteed understanding.
  Duplicate text is skipped; obvious credentials are rejected. This does not guarantee
  every memory is correct or non-sensitive; review entries regularly.
  The system retrieves relevant snippets and sends a small number to the hosted AI as
  reference material. The **model context window does not become 5 GB**.
- This feature is not connected to the Python 1 TB local memory index, and it does not
  provide 1 TB of free cloud capacity.
- The memory entries live on Cloudflare; backup/restore is not yet implemented for
  this off-device memory. If you want a durable archive, plan export and backup features.
- Database writes/reads and other Worker usage are subject to Cloudflare's free quotas.
  If you exceed free limits, requests may fail or a paid upgrade might be needed.
- This feature cannot be turned on solely by changing files on GitHub: you have to create
  the D1 database and binding in **your** Cloudflare account first.

## Tests

GitHub Actions executes `node tests/nova_cloud_memory.cjs` against a mocked D1 binding
to check owner authorization, saved memories, search, delete and clear behavior.
This test does **not** verify your Cloudflare account's live database or deployment.
