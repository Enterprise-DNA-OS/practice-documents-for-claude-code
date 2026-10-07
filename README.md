<h1 align="center">Practice Documents for Claude Code</h1>

<p align="center">
  <strong>The open-source document and workflow system for accounting practices that is just a database and Claude Code.</strong>
</p>

<p align="center">
  Created by <a href="https://www.enterprisedna.co"><strong>Enterprise DNA</strong></a>. Free and open source. Works with Claude Code, Codex, OpenCode or Cursor.
</p>

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your FYI Docs data brought across.<br/><a href="https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=fyi">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/fyi?utm_source=github&utm_medium=readme&utm_campaign=fyi">How it works</a></td>
  </tr>
</table>

<p align="center">
  <a href="#what-is-this">What is this</a> &bull;
  <a href="#why-no-front-end">Why no front end</a> &bull;
  <a href="#quick-start">Quick start</a> &bull;
  <a href="#the-commands">Commands</a> &bull;
  <a href="#instead-of-fyi">Instead of FYI Docs</a> &bull;
  <a href="#want-it-installed-and-run-for-you">Installed for you</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node-20+-339933?style=flat-square" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-any-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PGlite-embedded-3ecf8e?style=flat-square" alt="PGlite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

---

## What is this

Practice Documents for Claude Code does the job you pay FYI Docs for, as a Postgres database and a set of agent commands. There is no web front end. You open the folder in [Claude Code](https://claude.com/claude-code) (or Codex, OpenCode, Cursor: see `AGENTS.md`) and ask for what you want in plain language. It runs the right query, and it can answer questions the FYI Docs dashboard cannot.

FYI lists Intermediate at A$30, Pro at A$50 and Elite at A$70 per user per month, excluding GST, with a minimum of 5 users and migration, onboarding and consulting quoted separately ([pricing](https://fyi.app/pricing/), checked 7 October 2026). Ten users on Pro is A$6,000 a year; on Elite, A$8,400. That is not a five-figure bill, so the case for this repo is ownership, fit and answers, not a big saving.

Want the same thing with a web front end, or built on a different stack? That is a customisation, and it is exactly what Enterprise DNA does: [book a call](https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=fyi).

It is built for an accounting practice of two to fifty people in Australia or New Zealand. It keeps the register of every client document (your files stay on your drive, SharePoint or OneDrive; this is the index with a fingerprint of each file), the jobs and the documents each job must hold, what you have asked clients for and how often you have chased, reviews and client signatures, engagement terms per service, identity checks, and retention with holds and disposal records. It drafts chasers and letters but never sends them, never lodges anything, and never deletes a file.

## Why no front end

- The front end was only ever there because the database was hard to talk to. That is no longer true.
- Your data sits in plain Postgres tables you own. Any tool can read them. No export, no lock-in.
- No seats, no tiers, no add-ons. Read [docs/why-no-front-end.md](docs/why-no-front-end.md) for the honest trade-offs too.

## Quick start

Sixty seconds, no database install (an embedded Postgres runs inside Node):

```bash
git clone https://github.com/Enterprise-DNA-OS/practice-documents-for-claude-code.git
cd practice-documents-for-claude-code
npm install
npm run demo
```

Then open the folder in Claude Code and type a slash command. Start with `/attention`, then `/chase-list` and `/wip`. The fictional practice, Harbour Lane Accountants, has three overdue client requests, a tax return out for signature for ten days, financial statements stuck in partner review, two emails sitting unfiled in the inbox, a BAS job past due, a new trust client with no engagement letter and no identity check, engagement terms past review, a finished job with no signed approval on file, the same workpaper filed twice, and three old documents past retention (and a client on hold whose old records are correctly left alone). Dates move with the day you seed it.

```bash
npm test        # fresh temporary database, every command exercised
npm run view    # views/week.html, jobs.html, records.html
npm run docs    # client request lists, document registers, job file summaries, disposal records
```

### Use it with your own Postgres or Supabase

Copy `.env.example` to `.env`, set `DATABASE_URL`, then `npm run migrate`. Same commands, shared data, no per-seat fee.

## The commands

Every read takes `--json`. Names match without case and by partial text, client code or ID prefix; an ambiguous name lists the candidates and exits 1. Full syntax is in [CLAUDE.md](CLAUDE.md).

| Command | What it does |
|---|---|
| `/attention` | The Monday list: overdue client requests, unsigned documents, stuck reviews, unfiled email, jobs due, missing engagement letters and identity checks, records past retention. |
| `/clients` | The client list with partner, manager, identity check and hold. |
| `/client` | One client: jobs, open requests, engagement terms, recent documents and activity. |
| `/staff` | Partners, managers, accountants and administrators. |
| `/categories` | Document categories and the retention each one carries. |
| `/job-types` | Job types, the service each one falls under, and the documents each must hold. |
| `/jobs` | Open jobs with state, due date, manager, open requests and missing documents. |
| `/job` | One job: checklist, documents, requests and signatures. |
| `/checklist` | For one job, which required documents are final, filed but not final, or missing. |
| `/wip` | Work in progress by state, with overdue counts. |
| `/due` | Open jobs due within the practice window, soonest first. |
| `/manager-load` | Open jobs, overdue jobs, jobs waiting on clients and reviews by manager. |
| `/documents` | The fifty most recently filed documents. |
| `/find` | Search titles, file paths, client names and senders. |
| `/unfiled` | Inbox items not yet filed to a client. |
| `/review-queue` | Documents waiting for partner or manager review, oldest first. |
| `/signatures` | Documents out for client signature and not yet signed. |
| `/awaiting-client` | Everything the practice has asked clients for and not received. |
| `/chase-list` | Overdue requests due a chaser today, with the client email. |
| `/engagements` | Current engagement terms by client and service with review dates. |
| `/engagements-due` | Engagement terms due for review in 30 days, and open jobs with no signed terms. |
| `/aml` | Identity verification status by client and risk rating. |
| `/retention` | Final documents past their retention date with no hold: candidates for disposal. |
| `/holds` | Clients and documents on hold, and why. |
| `/duplicates` | The same file filed more than once (matching fingerprint). |
| `/client-years` | Documents held per client per year, by category: the gaps show. |
| `/templates` | Letter and email templates. |
| `/settings` | The practice rules the commands read (retention years, chase interval, review window). |
| `/archive` | Inventory of preserved FYI export rows. |
| `/compliance` | Record checks against the cited rules in docs/compliance.md. |
| `/add` | Add a client, staff member, category, job type, requirement, template, job or client request. |
| `/file` | File a document (or an email to the inbox) with its path; the file is fingerprinted when the path is reachable. |
| `/assign` | File an inbox item to a client, job and category (once). |
| `/submit` | Send a draft for review by a partner or manager. |
| `/approve` | Approve a document in review (the named reviewer signs off). |
| `/finalise` | Make a document final; it can no longer change. |
| `/received` | Mark a client request received against the document that answered it. |
| `/chase` | Record that a chaser went to the client. |
| `/waive` | Close a request the job no longer needs, with the reason. |
| `/send-signature` | Record an approved document going to the client for signature. |
| `/signed` | Record the date a client signed. |
| `/engage` | Record signed engagement terms for a service; replaces the previous terms for that service. |
| `/verify-id` | Record a client identity verification and risk rating. |
| `/job-state` | Move a job; lodged or complete needs every required document final and signed terms. |
| `/hold` | Put a client on hold (nothing is disposed of) or release it. |
| `/dispose` | Record disposal of a document past retention with no hold; a person deletes the file. |
| `/log` | Append a note of a call or meeting to a client. |
| `/draft-chase` | Draft one chaser email listing everything a client still owes. |
| `/draft-letter` | Draft a letter or email from a template (engagement, ready to sign, your own). |
| `/import` | Import an FYI Bulk Export folder: preview first, then import. |
| `/export` | Export every table to JSON in a private folder. |
| `/archive-search` | Search the preserved FYI export rows. |
| `/weekly-review` | The Monday review: one decision list from attention, due jobs, the chase list, the review queue and compliance. |
| `/customise` | Add a field or change a practice rule in plain language; writes and applies the migration. |
| `/new-view` | Add a branded read-only page of your records. |

## Ten questions, one command each

Each runs today on the demo data. FYI has search, reports and a jobs board; these are the questions a practice manager asks on a Monday and usually answers by hand.

1. What have we asked clients for that is overdue, and who is due a chaser today? `/chase-list`
2. Which finished jobs have no signed approval, financial statements or return on file? `/compliance`, then `/checklist`
3. Which open jobs have no signed engagement terms for that service? `/engagements-due`
4. Which clients with open work have no identity check recorded? `/aml`
5. Which documents are past their retention date, and which clients are on hold so nothing goes? `/retention`, `/holds`
6. Which documents have sat in partner review longer than five days? `/review-queue`
7. Which returns are out with clients for signature, and for how long? `/signatures`
8. Which files have we filed twice? `/duplicates`
9. For each client, which years do we hold, and in which categories? The gaps show. `/client-years`
10. How many open jobs, overdue jobs and jobs waiting on clients does each manager carry? `/manager-load`

## Your first hour: ten things to ask for

1. What needs my attention this week, grouped by who owns it?
2. Draft one chaser to Bayview Plumbing listing everything they still owe us.
3. File the ATO notice of assessment in the inbox to Sarah Mitchell under ATO Correspondence.
4. What is stopping the Kowhai Orchards accounts from being lodged?
5. Record that we verified the Chen Family Trust trustees today from their licences and the trust deed.
6. Draft an engagement letter for the Chen Family Trust's annual compliance.
7. Which Ironbark Cafe documents can we dispose of, and what does the disposal record look like?
8. Change our chase interval to five days.
9. Add a "BAS agent" field to each client and show it on the client record.
10. Make a page of every job due this month by manager.

## Instead of FYI

Run FYI's Bulk Export (an FYI Admin, with Bulk Export enabled by FYI Support) to OneDrive or AWS with a folder structure that includes the client, year and category. Then preview and import:

```bash
node scripts/practice.mjs import fyi --dir="FYI - Export/2026-10-01 0915" --structure=group/client/year/category --clients=clients.csv --dry-run
node scripts/practice.mjs import fyi --dir="FYI - Export/2026-10-01 0915" --structure=group/client/year/category --clients=clients.csv
```

Every file lands in the register under its client, year and category with a SHA-256 fingerprint, and every exported row is kept in a searchable archive. A second run adds nothing. [The full guide](docs/replace-fyi.md) covers what maps, what FYI does not export (versions, web links, file notes) and the cutover checks.

## Rules and limits

[docs/compliance.md](docs/compliance.md) sets out each check and its source: ATO five-year and Inland Revenue seven-year retention, privacy rules on disposal, APES 305 engagement terms, AUSTRAC and DIA identity duties, and the documents each job must hold. These are record checks, not legal advice. The local version has no user login or role separation: put it on your own Postgres with your own access controls before real client data goes in.

## Architecture

```
practice-documents-for-claude-code/
  CLAUDE.md                 how the operator wants this run (routing table + house rules)
  AGENTS.md                 the same, for Codex / OpenCode / Cursor / Gemini CLI
  .claude/commands/         the slash commands
  scripts/                  the CLI the commands drive
  scripts/lib/db.mjs        one adapter: DATABASE_URL (pg) or embedded PGlite
  supabase/migrations/      plain SQL schema
  supabase/seed.sql         demo data
  docs/                     the thesis and the migration guide
```

## Built for coding agents

The database, CLI and command recipes work with Claude Code, Codex, OpenCode or Cursor. Ask your coding agent for a new command and have it implement and test the change against the same records.

## Contributing

Issues and pull requests are welcome. Keep the shape: plain SQL, a small CLI, a slash command per recurring job, no front end.

## Want it installed and run for you?

Enterprise DNA installs Practice Documents for Claude Code for your business, migrates your FYI Docs data, connects it to the rest of your tools, and runs it for you as part of **Omni**, our managed Command Center. One setup fee, then a monthly retainer.

- Book a call: [enterprisedna.co/omni/book](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=fyi)
- Read more: [enterprisedna.co/omni/instead-of/fyi](https://enterprisedna.co/omni/instead-of/fyi?utm_source=github&utm_medium=readme&utm_campaign=fyi)

## License

MIT. Copyright (c) 2026 Enterprise DNA.
