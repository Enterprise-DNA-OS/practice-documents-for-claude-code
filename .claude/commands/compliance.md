---
description: Check the records against the rules in docs/compliance.md (engagement terms, client identity, retention, required documents, unfiled items) and report what is breached or due, with the source.
---

1. Run `node scripts/practice.mjs compliance --json`.
2. Read `docs/compliance.md`. Match each finding's `rule` to its section and source link.
3. Report a table: rule, record, finding, source. Order: IDENTITY, ENGAGEMENT, MISSING, ENGAGEMENT-REVIEW, IDENTITY-REFRESH, RETENTION, UNFILED.
4. For each finding, offer the fix the operator can approve: `/verify-id` once identity is seen, `/draft-letter --template=ENGAGE` then `/engage` once signed, `/checklist` then `/file` for MISSING, `/assign` for UNFILED. For RETENTION, list the documents and ask the partner per document before `/dispose`; never dispose of anything for a client on hold.
5. If a rule in `docs/compliance.md` looks out of date, say so and stop. The operator confirms the rule; then update the doc, the `settings` row and the check together through `/customise`.

These are record checks, not legal advice or a compliance certificate.
