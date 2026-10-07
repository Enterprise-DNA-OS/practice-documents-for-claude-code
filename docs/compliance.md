# Record checks and their sources

Sources checked 7 October 2026. This is practice administration, not legal or tax advice and not a compliance certificate. Every number below lives in the `settings` table or on a category, so a rule change is one `/customise` away. Confirm each rule against your own obligations: which services you provide decides which of these apply to you.

## Retention: Australia

Source: ATO, [Records to keep longer than five years](https://www.ato.gov.au/businesses-and-organisations/preparing-lodging-and-paying/record-keeping-for-business/overview-of-record-keeping-rules-for-business/records-to-keep-longer-than-five-years), which sets out the general five-year retention period and the cases that need longer (losses carried forward, capital gains assets, depreciating assets, amended assessments). The rule sits in section 262A of the Income Tax Assessment Act 1936.

Setting `retain_years_au` = 5. The clock starts at the job's lodgement date if recorded, otherwise the period end, otherwise the document date. A category can carry a longer period (`retain_years`). Records that must be kept longer (a loss still being used, an asset still held) go on hold with `/hold` until that ends.

## Retention: New Zealand

Source: Inland Revenue, [Record keeping](https://www.ird.govt.nz/managing-my-tax/record-keeping/records-of-income-and-expenses): keep records for at least seven years. Tax Administration Act 1994, section 22.

Setting `retain_years_nz` = 7, applied to every client with country `NZ`, from the same start date as above.

## Disposal and holds

Source: the Privacy Act 1988 (Cth), [Australian Privacy Principle 11.2](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-quick-reference): take reasonable steps to destroy or de-identify personal information no longer needed. Privacy Act 2020 (NZ), [Information Privacy Principle 9](https://www.privacy.org.nz/privacy-principles/9/): do not keep personal information longer than needed.

How the records apply it: `retention` and the `RETENTION` rule list final documents past their date. `dispose` refuses a document still inside its period or for a client or document on hold, writes an append-only disposal record and a certificate (`npm run docs`), and never deletes the file: a person does that. A partner decides each disposal.

## Engagement terms

Source: APESB, [APES 305 Terms of Engagement](https://www.apesb.org.au/terms-of-engagement): members in public practice document and communicate the terms of engagement with each client, with guidance on recurring engagements. In New Zealand, the same expectation sits in the CA ANZ Code of Ethics and practice quality systems.

How the records apply it: every job type belongs to a service. `ENGAGEMENT` flags an open job whose client has no current signed terms for that service, and `job-state` will not mark it lodged or complete until there are. `ENGAGEMENT-REVIEW` flags terms past their review date. Setting `engagement_review_months` = 12 is practice policy, not a legal period.

## Client identity (AML/CTF and AML/CFT)

Sources: AUSTRAC, [Tranche 2 reforms](https://www.austrac.gov.au/amlctf-reform): accountants providing designated services (company and trust formation, acting as or arranging nominee directors or trustees, handling client money, buying or selling businesses) are regulated from 1 July 2026, with customer due diligence before the service and records kept for seven years. Department of Internal Affairs (NZ), [AML/CFT information for accountants](https://www.dia.govt.nz/AML-CFT-Information-for-Accountants): accountants have been reporting entities since 1 October 2018 for the same kinds of service; the Anti-Money Laundering and Countering Financing of Terrorism Act 2009 sets the identity and record keeping duties.

How the records apply it: `IDENTITY` flags an active client with an open job and no verification recorded. `IDENTITY-REFRESH` flags a high-risk client last verified more than `id_refresh_days` (365, practice policy) ago. The seeded `Identity` category keeps identity records seven years. This system records that a check happened and what was seen; it does not verify anyone, screen sanctions lists or file reports. Your AML/CTF programme decides which clients and services are in scope.

## Required documents per job

Practice policy, informed by APES 320 Quality Management for Firms that Provide Non-Assurance Services (keep enough documentation to show the work was done and reviewed). Each job type lists the categories it must hold. `checklist` shows them for one job; `MISSING` flags a lodged or completed job without a final document in each; `job-state` blocks lodged or complete until they are, unless overridden with a reason that is logged.

## Unfiled items

Practice policy: `unfiled_days` = 3. Client email and notices sitting in the inbox are invisible to the client's file. `UNFILED` lists them.
