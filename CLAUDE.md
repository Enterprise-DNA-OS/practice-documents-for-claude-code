# Practice Documents for Claude Code: operating instructions

This file is the brain. Claude Code reads it at the start of every session. It says who this is for, how work gets done, and the one right way to do each recurring job.

## Who this is for

- **Business:** [YOUR PRACTICE] (the demo is Harbour Lane Accountants, fictional)
- **Operator:** [YOUR NAME], [your role]
- **What matters most:** [the one or two outcomes you care about]

Fill this in once. A worker with context knows. A worker without it guesses.

## How to work

1. **Take a brief, not a script.** The operator describes the outcome. You run the right command and present the answer.
2. **Read before you write.** Before drafting anything about a record, read its full history first.
3. **Plain language.** Short sentences. No filler. Numbers in tables.
4. **Silent success, loud problems.** No play-by-play. Say what broke and what you did about it.
5. **Stop at the line.** Anything that sends, deletes, or faces a customer waits for a yes in this session.

## Routing table: one right way for each recurring job

| When the operator asks for... | Use this |
|---|---|
| The Monday list: overdue client requests, unsigned documents, stuck reviews, unfiled email, jobs due, missing engagement letters and identity checks, records past retention. | `/attention`: `node scripts/practice.mjs attention` |
| The client list with partner, manager, identity check and hold. | `/clients`: `node scripts/practice.mjs clients` |
| One client: jobs, open requests, engagement terms, recent documents and activity. | `/client`: `node scripts/practice.mjs client "CLIENT"` |
| Partners, managers, accountants and administrators. | `/staff`: `node scripts/practice.mjs staff` |
| Document categories and the retention each one carries. | `/categories`: `node scripts/practice.mjs categories` |
| Job types, the service each one falls under, and the documents each must hold. | `/job-types`: `node scripts/practice.mjs job-types` |
| Open jobs with state, due date, manager, open requests and missing documents. | `/jobs`: `node scripts/practice.mjs jobs` |
| One job: checklist, documents, requests and signatures. | `/job`: `node scripts/practice.mjs job "JOB"` |
| For one job, which required documents are final, filed but not final, or missing. | `/checklist`: `node scripts/practice.mjs checklist "JOB"` |
| Work in progress by state, with overdue counts. | `/wip`: `node scripts/practice.mjs wip` |
| Open jobs due within the practice window, soonest first. | `/due`: `node scripts/practice.mjs due` |
| Open jobs, overdue jobs, jobs waiting on clients and reviews by manager. | `/manager-load`: `node scripts/practice.mjs manager-load` |
| The fifty most recently filed documents. | `/documents`: `node scripts/practice.mjs documents` |
| Search titles, file paths, client names and senders. | `/find`: `node scripts/practice.mjs find --text="WORDS"` |
| Inbox items not yet filed to a client. | `/unfiled`: `node scripts/practice.mjs unfiled` |
| Documents waiting for partner or manager review, oldest first. | `/review-queue`: `node scripts/practice.mjs review-queue` |
| Documents out for client signature and not yet signed. | `/signatures`: `node scripts/practice.mjs signatures` |
| Everything the practice has asked clients for and not received. | `/awaiting-client`: `node scripts/practice.mjs awaiting-client` |
| Overdue requests due a chaser today, with the client email. | `/chase-list`: `node scripts/practice.mjs chase-list` |
| Current engagement terms by client and service with review dates. | `/engagements`: `node scripts/practice.mjs engagements` |
| Engagement terms due for review in 30 days, and open jobs with no signed terms. | `/engagements-due`: `node scripts/practice.mjs engagements-due` |
| Identity verification status by client and risk rating. | `/aml`: `node scripts/practice.mjs aml` |
| Final documents past their retention date with no hold: candidates for disposal. | `/retention`: `node scripts/practice.mjs retention` |
| Clients and documents on hold, and why. | `/holds`: `node scripts/practice.mjs holds` |
| The same file filed more than once (matching fingerprint). | `/duplicates`: `node scripts/practice.mjs duplicates` |
| Documents held per client per year, by category: the gaps show. | `/client-years`: `node scripts/practice.mjs client-years` |
| Letter and email templates. | `/templates`: `node scripts/practice.mjs templates` |
| The practice rules the commands read (retention years, chase interval, review window). | `/settings`: `node scripts/practice.mjs settings` |
| Inventory of preserved FYI export rows. | `/archive`: `node scripts/practice.mjs archive` |
| Record checks against the cited rules in docs/compliance.md. | `/compliance`: `node scripts/practice.mjs compliance` |
| Add a client, staff member, category, job type, requirement, template, job or client request. | `/add`: `node scripts/practice.mjs add request --client="CLIENT" --job="JOB" --item="WHAT YOU NEED" --due=2026-10-21 [--category="Client Source Docs"]` |
| File a document (or an email to the inbox) with its path; the file is fingerprinted when the path is reachable. | `/file`: `node scripts/practice.mjs file --client="CLIENT" --job="JOB" --category="CATEGORY" --title="TITLE" --path="PATH" --author="WHO" [--kind=email\|scan\|workpaper\|letter] [--status=draft] [--supersedes=DOC]` |
| File an inbox item to a client, job and category (once). | `/assign`: `node scripts/practice.mjs assign DOC --client="CLIENT" --category="CATEGORY" [--job="JOB"]` |
| Send a draft for review by a partner or manager. | `/submit`: `node scripts/practice.mjs submit DOC --reviewer="REVIEWER"` |
| Approve a document in review (the named reviewer signs off). | `/approve`: `node scripts/practice.mjs approve DOC --by="REVIEWER" [--override]` |
| Make a document final; it can no longer change. | `/finalise`: `node scripts/practice.mjs finalise DOC [--path="FINAL PATH"]` |
| Mark a client request received against the document that answered it. | `/received`: `node scripts/practice.mjs received REQUEST --document=DOC` |
| Record that a chaser went to the client. | `/chase`: `node scripts/practice.mjs chase REQUEST` |
| Close a request the job no longer needs, with the reason. | `/waive`: `node scripts/practice.mjs waive REQUEST --reason="WHY"` |
| Record an approved document going to the client for signature. | `/send-signature`: `node scripts/practice.mjs send-signature DOC --signer="NAME" --email=ADDRESS [--method=e-signature]` |
| Record the date a client signed. | `/signed`: `node scripts/practice.mjs signed SIGNATURE --date=2026-10-07` |
| Record signed engagement terms for a service; replaces the previous terms for that service. | `/engage`: `node scripts/practice.mjs engage "CLIENT" --service="Annual compliance" --signed=2026-10-07 [--document=DOC] [--review=2027-10-07]` |
| Record a client identity verification and risk rating. | `/verify-id`: `node scripts/practice.mjs verify-id "CLIENT" --date=2026-10-07 --method="WHAT WAS SEEN" [--risk=low\|standard\|high]` |
| Move a job; lodged or complete needs every required document final and signed terms. | `/job-state`: `node scripts/practice.mjs job-state "JOB" --state=lodged [--override --reason="WHY" --author="WHO"]` |
| Put a client on hold (nothing is disposed of) or release it. | `/hold`: `node scripts/practice.mjs hold "CLIENT" --reason="WHY" \| hold "CLIENT" --release` |
| Record disposal of a document past retention with no hold; a person deletes the file. | `/dispose`: `node scripts/practice.mjs dispose DOC --by="PARTNER" [--method="secure delete"] [--reason="WHY"]` |
| Append a note of a call or meeting to a client. | `/log`: `node scripts/practice.mjs log "CLIENT" --text="WHAT HAPPENED" --author="WHO"` |
| Draft one chaser email listing everything a client still owes. | `/draft-chase`: `node scripts/practice.mjs draft-chase "CLIENT" [--job="JOB"]` |
| Draft a letter or email from a template (engagement, ready to sign, your own). | `/draft-letter`: `node scripts/practice.mjs draft-letter "CLIENT" --template=ENGAGE [--job="JOB"] [--service="SERVICE"]` |
| Import an FYI Bulk Export folder: preview first, then import. | `/import`: `node scripts/practice.mjs import fyi --dir="FYI - Export/2026-10-01 0915" --structure=group/client/year/category [--clients=clients.csv] [--country=AU] --dry-run` |
| Export every table to JSON in a private folder. | `/export`: `node scripts/practice.mjs export --dir="PRIVATE FOLDER"` |
| Search the preserved FYI export rows. | `/archive-search`: `node scripts/practice.mjs archive-search --text="WORDS"` |
| The Monday review: one decision list from attention, due jobs, the chase list, the review queue and compliance. | `/weekly-review` |
| Add a field or change a practice rule in plain language; writes and applies the migration. | `/customise` |
| Add a branded read-only page of your records. | `/new-view` |

If an ask fits nothing here, run the CLI directly (`npm run <cli> -- --help`) and then propose a new command for it.

## Hard rules

- Never send, lodge or e-sign anything. `send-signature`, `signed`, `chase` and `received` record what a person already did.
- Never delete a file. `dispose` records the decision after a partner says yes for that document in this session; a person deletes the file.
- Never dispose of anything for a client or document on hold, or inside its retention period.
- Final documents never change. A correction is a new document filed with `--supersedes`.
- Every client is AU or NZ; retention follows the country. Rule numbers live in the `settings` table or on a category. Change them with `/customise`, with the source.
- Never commit client data, exports, rendered documents or drafts. Tests use fictional data only.

- Never send email or messages from here. Draft to `drafts/`, a person sends.
- Never delete records without an explicit yes in this session. Prefer marking closed or archived.
- Never invent a record. If a name is ambiguous, list the candidates and ask.
- The database is the source of truth. If the answer is not in it, say so.

## Where things live

- `scripts/` the CLI. `scripts/lib/db.mjs` picks `DATABASE_URL` (Postgres, Supabase) or the embedded database in `.data/`.
- `supabase/migrations/` the schema, plain SQL. `npm run migrate` applies it.
- `.claude/commands/` the slash commands. Add one every time the same ask comes twice.
- `docs/` the thesis, the cited rules (`compliance.md`) and the guide for moving off FYI (`replace-fyi.md`).

Built by Enterprise DNA. Installed and run for you as part of Omni: https://enterprisedna.co/omni/instead-of/fyi
