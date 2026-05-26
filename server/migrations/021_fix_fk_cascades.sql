-- 021_fix_fk_cascades.sql
-- Three FKs reference users(id) with the default NO ACTION rule. That blocks
-- ON DELETE CASCADE from propagating when a school (and its users) is deleted:
-- Postgres would raise FK-violation on library_files.uploaded_by /
-- invites.created_by / invites.used_by before the cascade can finish.
--
-- Switch all three to ON DELETE SET NULL: keep the row, just forget who did it.
-- Constraint names verified against live DB (default <table>_<col>_fkey).
-- Idempotent — safe to re-run.

ALTER TABLE library_files DROP CONSTRAINT IF EXISTS library_files_uploaded_by_fkey;
ALTER TABLE library_files ADD CONSTRAINT library_files_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE invites DROP CONSTRAINT IF EXISTS invites_created_by_fkey;
ALTER TABLE invites ADD CONSTRAINT invites_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE invites DROP CONSTRAINT IF EXISTS invites_used_by_fkey;
ALTER TABLE invites ADD CONSTRAINT invites_used_by_fkey
  FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL;
