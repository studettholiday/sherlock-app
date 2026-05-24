-- 017_library_content_binary.sql
-- Add raw-bytes storage to library_files so PDFs and images can be served back
-- in-app for view-only rendering. The existing `content` column keeps the
-- extracted text used as AI context. Rows uploaded before this migration have
-- NULL content_binary and will 404 on the view endpoint until re-uploaded.
-- Idempotent — safe to re-run.

ALTER TABLE library_files ADD COLUMN IF NOT EXISTS content_binary BYTEA;
