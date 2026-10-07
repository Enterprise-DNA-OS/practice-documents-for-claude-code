---
description: File a document (or an email to the inbox) with its path; the file is fingerprinted when the path is reachable.
---

Run `node scripts/practice.mjs file --client="CLIENT" --job="JOB" --category="CATEGORY" --title="TITLE" --path="PATH" --author="WHO" [--kind=email|scan|workpaper|letter] [--status=draft] [--supersedes=DOC]`. Add `--json` when you need to work with the rows.

Leave out --client to file to the inbox. Show duplicate_of if it is not empty.

Present the result as a short table in plain words. Never send, lodge or delete a file from here.
