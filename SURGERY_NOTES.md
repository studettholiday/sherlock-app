# SURGERY_NOTES.md

Radical simplification of Sherlock. Roles collapsed to **teacher** + **student**;
the owner is a teacher with `is_owner = true`. Many features deleted.

Decisions locked with the maintainer: **1C** (root `src/` legacy demo app left
untouched — it is the live source of `sherlock.school`), **2A** (free-text
schedule, no groups), **3A** (student enrolment deleted), **4A** (role-switcher +
label-editor deleted). `@anthropic-ai/sdk` kept in `server/package.json` as a
safety net.

> **Root `src/` and root build configs were NOT touched** (`src/`, root
> `index.html`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`,
> `package.json`, `package.json.bak`).

## What was removed

**Roles:** `admin` and `assistant` deleted. `users.is_owner` (boolean) added.
Founding admins migrate to teacher+owner; assistants migrate to plain teacher.

**Features deleted entirely** (UI + routes + endpoints + DB): People management,
Manage panel (subjects/groups), Notify/announcements/broadcast, Events, student
absence Report, student My Notes (notes/diary/labels/trash), teacher Share Files,
teacher Announce, the AI model selector (Claude/GPT-4/Gemini), Stylize, the
role-switcher tabs, the "Edit" label-customiser, student class-enrolment
(`/choose-classes` + Plan panels), and the legacy school-codes feature.

**Kept:** AI chat, Knowledge Library upload/retrieval, Schedule (now free-text,
school-wide), invite-code generation (owner-gated), auth/school registration.

## Files deleted (5)

- `client/src/components/ChatWindow.jsx` — dead (imported, never rendered)
- `client/src/pages/ChooseClasses.jsx` — student enrolment (3A)
- `server/migrations/009_web_registrations.sql`
- `server/migrations/010_notes_labels_diary.sql`
- `server/migrations/run009.js`

## Files created (2)

- `server/migrations/011_simplify.sql` — schema migration (idempotent; runs at
  server startup via `runMigrations()`)
- `SURGERY_NOTES.md`

## Files modified (17)

**Client (7):** `App.jsx` (drop `/choose-classes` route + ChatWindow import),
`pages/Dashboard.jsx`, `pages/AppLayout.jsx`, `pages/Chat.jsx`,
`components/RolePanels.jsx` (**3508 → 543 lines**; 35 panel components deleted,
2 new: `SchedulePanel` view + `ScheduleEditorPanel` owner editor), `i18n.js`
(`adminEmail` → `ownerEmail`), `pages/Signup.jsx` ("Admin email" → "Owner email").

**Server (10):** `index.js` (`runMigrations()` now runs `011_simplify.sql`;
debug endpoint removed), `routes/auth.js` (founding user = teacher+owner;
`is_owner` in JWTs/login/me; `registrationStatus` block removed),
`routes/chat.js` (role context trimmed; `chat_mode_ceiling` removed),
`routes/invites.js` + `routes/library.js` (perm checks → owner),
`routes/school.js` (≈40 endpoints deleted; only the 4 `/schedule` handlers
remain, decoupled from groups), `routes/db.js` (dead `knowledge_library`
bootstrap removed), `services/ai.js` (dead provider functions removed),
`package.json`, `.env.example`.

## Database changes (`011_simplify.sql`)

- `users` += `is_owner`; roles collapsed; `CHECK (role IN ('teacher','student'))`.
- Tables dropped: `notifications`, `absence_reports`, `web_registrations`,
  `student_notes`, `student_diary`, `student_labels`, `events`,
  `knowledge_library`, `groups`, `subjects`.
- `schedule`: `subject` renamed → `class_name`; `group_id` dropped.
- `schools`: `assistant_code`, `teacher_code`, `student_code`,
  `chat_mode_ceiling` dropped.
- `invites.target_role` CHECK → `('teacher','student')`.
- The script is idempotent (safe to re-run) but **destructive** — `DROP TABLE`
  permanently deletes events/notes/enrolment/notification data on first run.

## Dependencies removed

`server/package.json`: `@google/generative-ai`, `openai`.
`@anthropic-ai/sdk` retained (per request). `client/package.json`: nothing
removed. Root `package.json`: untouched (still lists the two dead AI SDKs).

## Orphans & anomalies found during execution

1. **Fixed:** `Dashboard.jsx` and `AppLayout.jsx` were left with dead
   `GET /api/school/members` calls (endpoint deleted). The Dashboard one threw
   before `setInvites` ran — it **broke invite loading**. Both calls and the
   now-dead `members`/`membersLoading` state + prop plumbing were removed.
2. `groupSchedule()` in `client/src/App.jsx` — now unused (its only caller, the
   `schedule` demo array, was removed). Left in place; harmless dead function.
3. `rainbow-slider` CSS in `AppLayout.jsx`'s `<style>` block — dead after the
   Stylize hue slider was removed. Left; harmless.
4. `Dashboard` is imported by `client/src/App.jsx` but not rendered there
   (pre-existing orphan import; `AppLayout.jsx` does render it for mobile).
5. `@anthropic-ai/sdk` is now an unused-but-installed dependency (its only user,
   `ai.js`'s `callAnthropic`, was dead code and removed). Kept deliberately.
6. `node_modules` for `openai`/`@google/generative-ai` still on disk and
   `package-lock.json` files not regenerated — `npm install` was not run. Run
   `npm install` in `server/` to prune.
7. **Out-of-band schema:** `subjects`, `groups.subject_id`,
   `web_registrations.request_type` exist in production but in **no migration
   file** (added by manual SQL historically). `011_simplify.sql` handles them
   via `DROP TABLE ... CASCADE` — flagged for the DBA.
8. Migration `008` is kept as history; it still creates `groups`/`events`/
   `schedule.subject`. `011` idempotently collapses them — a fresh-DB replay
   (001-008 then 011) ends in the correct state.
9. `PATCH /api/school/schedule/:id` updates only `day_of_week`/`lesson_time`
   (matches prior behaviour). The new `ScheduleEditorPanel` uses add + delete,
   so this is fine; extend PATCH later if class_name editing is wanted.

## Transition note

`is_owner` is a new JWT field. Users holding pre-surgery tokens (7-day expiry)
will not have it — owner-only actions (invites, library upload, schedule edit)
will be denied until they log in again. Fail-closed, no data risk.

## Verification

- `cd client && npm run build` — **passes**: 205 modules, bundle 369 kB
  (was ~496 kB).
- `node --check` — **passes** on all modified server files
  (`index.js`, `routes/*.js`, `services/ai.js`).
- No automated test suite exists in the repo (confirmed earlier); none to run.

## Not done (per instructions)

Not deployed, not pushed, not committed. Migration `011_simplify.sql` has **not**
been run against any database — it will run automatically on the next server
start, or can be run manually first. Awaiting manual smoke test.
