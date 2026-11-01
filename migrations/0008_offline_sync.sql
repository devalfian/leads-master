-- Offline sync (Phase 5)
--
-- When the workspace is used without a connection every write is queued in the
-- browser and replayed once the network returns. A replay can therefore arrive
-- twice: the browser gave up on a request the server had already committed.
-- Each queued write carries an `Idempotency-Key` header, and the server answers
-- the repeat with the response it stored the first time instead of performing
-- the write again.
--
-- `status = 0` marks a reservation: the request that claimed the key is still
-- running. A second request that finds a reservation it does not own must not
-- run the same write, because the first one may be committing right now.
--
-- Receipts are never read by the application other than by key. They are safe to
-- prune at any time (`DELETE FROM mutation_receipts WHERE created_at < ?`), and
-- the row count stays proportional to the number of offline writes, which is
-- small for a single-user workspace.

CREATE TABLE IF NOT EXISTS mutation_receipts (
  idempotency_key TEXT PRIMARY KEY,
  nonce TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status INTEGER NOT NULL DEFAULT 0,
  body TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mutation_receipts_created_at
  ON mutation_receipts (created_at);
