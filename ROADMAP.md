# Future / Post-Launch

- Optical Music Recognition (OMR) — let the AI "read" notes from sheet music PDFs. Research candidates: Audiveris, Oemer. Likely needs a Python microservice. Decision needed: in-app feature or separate companion tool.
- Per-school AI language preference column (if needed)
- Full Georgian translation of Privacy Policy + Terms of Service (defer until 3rd-5th paying customer)
- Cloud-automated database backups (Cloudflare R2 + Railway cron) post-launch
- Capacitor wrap for Play Store + iOS App Store
- PDF viewer mobile quality improvements
- App-wide playful loading messages
- Library download bug — downloaded PDFs are ~668 bytes, corrupted/empty. Likely the download endpoint returns wrong content or original PDFs weren't stored.
- Library upload occasional failure — friend's normal Georgian PDF book wouldn't upload, cause unknown, need actual file to diagnose.
- Dual signup paths in auth.js (/signup invite branch vs /invite/accept) — refactor to one.
- Pre-existing client/node_modules/.package-lock.json tracked despite gitignore — harmless persistent "modified" in git status.
- Manual pg_dump backup before launch — open task.
- API key rotation before launch.
- Business email at support@sherlock.school via Namecheap forwarder ready before launch (14-day trial users need a real support address too).
- Sherlock persona should emerge from library content + observed school activities. Initially context is broad (general assistant). As school uploads materials, schedules lessons, adds students with roles — context narrows. Music PDFs → music tutor. Literature → literature tutor. Mixed library → multi-subject. Empty library + no signals → broad general assistant. Currently the prompt is too restrictive even with empty library.
