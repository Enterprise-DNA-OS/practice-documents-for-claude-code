---
description: Add a client, staff member, category, job type, requirement, template, job or client request.
---

Run `node scripts/practice.mjs add request --client="CLIENT" --job="JOB" --item="WHAT YOU NEED" --due=2026-10-21 [--category="Client Source Docs"]`. Add `--json` when you need to work with the rows.

Other forms: add client --name= --code= --country=AU|NZ --manager=; add job --name= --client= --type= --period-end= --due=; add job-type --code= --name= --service=; add requirement --job-type= --category=; add category --name= [--retain-years=]; add staff --name= --role=; add template --code= --name= --body=

Present the result as a short table in plain words. Never send, lodge or delete a file from here.
