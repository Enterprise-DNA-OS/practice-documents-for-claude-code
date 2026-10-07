---
description: The Monday review for the practice manager, written from attention, due jobs, the chase list, the review queue and compliance into one decision list.
---

1. Run, each with `--json`: `node scripts/practice.mjs attention`, `node scripts/practice.mjs due`, `node scripts/practice.mjs chase-list`, `node scripts/practice.mjs review-queue`, `node scripts/practice.mjs signatures`, `node scripts/practice.mjs compliance`.
2. Write `drafts/weekly-review-YYYY-MM-DD.md` with five short sections:
   - **Due this fortnight:** each job, its state, what is stopping it (requests open, review, signature, missing documents).
   - **Waiting on clients:** who owes what, days overdue, chasers already sent, and whether a chaser is due today.
   - **Reviews and signatures:** documents waiting on a partner or manager, and documents out with clients, oldest first.
   - **Risk:** open jobs with no signed engagement terms, clients with no identity check, terms past review.
   - **Records:** unfiled inbox items, duplicates, and documents past retention for a partner to decide on.
3. End with at most five decisions for the operator, each one line with the command that would carry it out.
4. Show the draft path and the five decisions in chat. Do not run any write command from this review.
