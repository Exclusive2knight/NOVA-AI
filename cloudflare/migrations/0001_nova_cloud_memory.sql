-- NOVA Cloud Memory (owner-only, opt-in).
-- Cloudflare D1 supports SQLite FTS5 for full-text retrieval.
-- No sensitive information should be imported without user consent.
-- This database stores memory entries in the cloud (not in a model's context window).
CREATE VIRTUAL TABLE IF NOT EXISTS nova_memories USING fts5(
    body,
    source UNINDEXED,
    created_at UNINDEXED,
    id UNINDEXED,
    tokenize='unicode61'
);
