-- Phase 2 — Callbook context fields.
--
-- Purely additive: every new column is nullable (or has a safe default), so
-- existing Callbooks, published snapshots and call history keep working exactly
-- as before. Nothing is renamed, dropped or rewritten.
--
-- `market_id` / `niche_category_id` reference the Phase 1 guide tables, so a
-- Callbook reuses the existing market and niche source of truth instead of a
-- second enum that could drift.

ALTER TABLE callbooks ADD COLUMN market_id TEXT REFERENCES markets (id);
ALTER TABLE callbooks ADD COLUMN niche_category_id TEXT REFERENCES niche_categories (id);
ALTER TABLE callbooks ADD COLUMN language TEXT;
ALTER TABLE callbooks ADD COLUMN internal_notes TEXT NOT NULL DEFAULT '';

ALTER TABLE call_nodes ADD COLUMN step_type TEXT;
ALTER TABLE call_nodes ADD COLUMN purpose TEXT;
ALTER TABLE call_nodes ADD COLUMN talking_points_json TEXT NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_callbooks_market
  ON callbooks (market_id, niche_category_id);

CREATE INDEX IF NOT EXISTS idx_call_nodes_step_type
  ON call_nodes (callbook_id, step_type, sort_order);