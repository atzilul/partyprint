CREATE TABLE IF NOT EXISTS contact_leads (
 id TEXT PRIMARY KEY NOT NULL,
 token_hash TEXT NOT NULL,
 token_expires_at INTEGER NOT NULL,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 version INTEGER NOT NULL DEFAULT 1,
 mail_status TEXT NOT NULL DEFAULT 'pending',
 data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS contact_leads_updated ON contact_leads(updated_at);
