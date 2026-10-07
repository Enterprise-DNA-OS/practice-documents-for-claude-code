# Moving off FYI

Your files stay where they are: on your drive, SharePoint or OneDrive. This replaces the register and the workflow on top of them. Plan a test run first and keep FYI read-only until the checks below pass.

## 1. Export from FYI

FYI's Bulk Export copies the current version of every document into a folder tree laid out by the Folder Structure your FYI Admin sets (client group, client, year, category and so on). See FYI's help articles [Bulk Export OneDrive](https://support.fyi.app/hc/en-us/articles/360024323671) and [Bulk Export AWS](https://support.fyi.app/hc/en-us/articles/360062123472).

- An FYI Admin asks FYI Support to enable Bulk Export, then runs it from Settings > Practice settings > Documents > Export. Exports run overnight.
- OneDrive suits fewer than 500 documents; use AWS for more.
- Set the folder structure to include the client and, if you can, the year and category. Note the order you chose.
- FYI does not export web links, phone calls, file notes, meetings or earlier versions. Copy anything you need from those before you leave.
- Category names with a backslash come out with an underscore (`GST\BAS` becomes `GST_BAS`).

If you can, export your client list from your practice manager as CSV with `Client Name`, `Client Code`, `Email`, `Partner` and `Manager` columns. Add your staff first (`/add staff`) so partner and manager names match.

## 2. Preview, then import

```bash
node scripts/practice.mjs import fyi --dir="FYI - Export/2026-10-01 0915" --structure=group/client/year/category --clients=clients.csv --country=AU --dry-run
node scripts/practice.mjs import fyi --dir="FYI - Export/2026-10-01 0915" --structure=group/client/year/category --clients=clients.csv --country=AU
```

`--structure` lists your folder levels in order. Use `client`, `code`, `group`, `year`, `category`, `job`, or `_` for a level to ignore. Every file below that depth is filed under the client, year and category its folders name. `--path-prefix` records where the files will live after you move them (for example the SharePoint library path) instead of the export folder.

The preview rolls back and reports files, new clients, new categories and new documents. Running the same import twice adds nothing. A file at the wrong depth stops the whole run and nothing is kept.

## What maps

| FYI | Here |
|---|---|
| Client (folder or client CSV) | `clients`, matched by name or code |
| Category or cabinet folder | `categories`, created if new |
| Year folder | `documents.year`; document date set to 30 June (AU) or 31 March (NZ) of that year |
| Job folder (if in your structure) | linked to a job of the same name, if you created it first |
| Each file | `documents`, final, with its path, size and SHA-256 fingerprint |
| Every exported file and client row | `import_rows`, searchable with `/archive-search` |

## What does not carry over

- Version history, drafts, web links, phone calls, file notes and meetings (FYI does not export them).
- FYI automations. Rebuild the ones you use as job types with required documents, templates and commands. Ask Claude Code for a command when the same job comes up twice.
- Tasks and jobs from your practice manager. Create open jobs with `/add job`, or ask for an import from your practice manager's job export.
- Who filed each document and when. The import records `FYI import` and the export date.

## Cutover checks

1. `/client-years` for five clients you know well: the years and categories look right.
2. `/find` for three documents you looked at last week: they are there with the right path.
3. `/duplicates`: decide which copy to keep.
4. `/retention` and `/holds`: put clients with disputes, audits or losses carried forward on hold before anyone disposes of anything.
5. Move the files to their long-term home, then re-run the import with `--path-prefix` on a fresh database, or update paths with `/customise`.
