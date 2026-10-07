#!/usr/bin/env node
// npm test: a fresh temporary database, migrate, seed twice, then every CLI command, the review and
// signing flow, locked final documents, retention and holds, an FYI export import with preview and
// rollback, drafts and HTML. TEST_DATABASE_URL runs the same checks against a disposable Postgres (CI does this).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { parseCsv } from './lib/csv.mjs';
import { migrate } from './migrate.mjs';
import { run, reads, writes, printResult } from './practice.mjs';

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'practice-docs-smoke-'));
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || '';
process.env.DATA_DIR = path.join(temp, 'db');
process.env.OUTPUT_DIR = temp;
let db, checks = 0;
const seen = new Set();
const go = async (...args) => { seen.add(args[0]); checks++; return run(db, args); };
const fail = async (args, re) => { seen.add(args[0]); checks++; await assert.rejects(() => run(db, args), re); };
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

try {
  db = await getDb();
  if (process.env.DATABASE_URL) await db.exec('drop schema public cascade; create schema public;');
  await migrate(db);
  assert.equal((await migrate(db)).ran.length, 0); checks++;
  assert.equal(parseCsv('id,text\n1,"  kept  "')[0].text, '  kept  ');
  assert.throws(() => parseCsv('id,text\n1,"open'), /unclosed/); checks += 2;

  const seed = fs.readFileSync(path.join(REPO_ROOT, 'supabase/seed.sql'), 'utf8');
  await db.exec(seed); await db.exec(seed);
  assert.equal((await go('clients')).length, 6);
  for (const cmd of Object.keys(reads)) { const rows = await go(cmd); assert.ok(Array.isArray(rows), cmd); assert.equal(typeof printResult(rows), 'string'); }

  // The seeded practice says what a Monday needs to hear.
  const attention = await go('attention');
  for (const kind of ['request', 'signature', 'review', 'unfiled', 'job', 'engagement', 'identity', 'missing', 'retention']) assert.ok(attention.some((r) => r.kind === kind), `attention lacks ${kind}`);
  const retention = await go('retention');
  assert.equal(retention.length, 3);
  assert.ok(!retention.some((r) => r.client === 'Sarah Mitchell'), 'a client on hold must never show for disposal');
  assert.equal(retention.find((r) => r.country === 'NZ').retain_until, '2025-03-31');
  assert.equal((await go('duplicates'))[0].copies, 2);
  assert.equal((await go('chase-list')).length, 3);
  assert.ok((await go('compliance')).some((r) => r.rule === 'IDENTITY' && r.record === 'Chen Family Trust'));
  assert.equal((await go('checklist', 'IRON01 FY2025')).find((r) => r.category === 'Signed Approval').status, 'missing');
  assert.equal((await go('client', 'kowh01')).client[0].name, 'Kowhai Orchards Ltd');
  assert.equal((await go('job', 'KOWH01')).job[0].state, 'review');
  assert.equal((await go('find', '--text=westpac')).length, 1);
  const helpCommands = (await go('help'))[0].commands.split(', ');
  await fail(['client', 'mitchell'], /Ambiguous[\s\S]*Mitchell Super Fund[\s\S]*Sarah Mitchell/);
  await fail(['client', 'nobody'], /No matching/);

  // Setup: staff, a client, a job type that needs three things, and a job.
  await go('add', 'staff', '--name=Test Manager', '--role=Manager');
  await go('add', 'staff', '--name=Test Junior', '--role=Accountant');
  await go('add', 'category', '--name=Test Category', '--retain-years=10', '--note=testing');
  await go('add', 'job-type', '--code=TST', '--name=Test job', '--service=Test service');
  await go('add', 'requirement', '--job-type=TST', '--category=Test Category');
  await go('add', 'requirement', '--job-type=TST', '--category=Signed Approval');
  await go('add', 'template', '--code=TEST', '--name=Test letter', '--body=Dear {{client}},\\n{{service}} from {{practice}}.');
  const [c] = await go('add', 'client', '--name=Test Client Ltd', '--code=TEST01', '--country=NZ', '--email=t@example.invalid', '--manager=Test Manager');
  const [job] = await go('add', 'job', '--name=TEST01 FY2026', '--client=TEST01', '--type=TST', '--period-end=2026-03-31', `--due=${day(30)}`);
  assert.equal(job.manager_id, c.manager_id);
  await fail(['add', 'request', '--client=Chen Family Trust', '--job=TEST01 FY2026', '--item=x', `--due=${day(1)}`], /another client/);

  // Requests: ask, chase, receive; the job moves to awaiting client and back.
  const [req] = await go('add', 'request', '--client=TEST01', '--job=TEST01 FY2026', '--item=Test bank statements', '--category=Test Category', `--due=${day(-1)}`);
  const [req2] = await go('add', 'request', '--client=TEST01', '--job=TEST01 FY2026', '--item=Test loan letter', `--due=${day(-1)}`);
  assert.equal((await go('job', 'TEST01 FY2026')).job[0].state, 'awaiting_client');
  assert.equal((await go('chase', req.id))[0].chases, 1);
  assert.ok(!(await go('chase-list')).some((r) => r.id === req.id), 'chased today, not due again');
  const [chaseDraft] = await go('draft-chase', 'TEST01');
  assert.match(fs.readFileSync(chaseDraft.draft, 'utf8'), /DRAFT ONLY[\s\S]*Test bank statements[\s\S]*Test loan letter/);
  const srcFile = path.join(temp, 'statement.pdf'); fs.writeFileSync(srcFile, 'test statement');
  const [stmt] = await go('file', '--client=TEST01', '--job=TEST01 FY2026', '--category=Test Category', '--title=Test statements', '--kind=scan', `--path=${srcFile}`, '--author=Test Junior', '--received-from=Client');
  assert.match(stmt.sha256, /^[0-9a-f]{64}$/); assert.equal(stmt.duplicate_of, null);
  const [again] = await go('file', '--client=TEST01', '--category=Test Category', '--title=Test statements again', `--path=${srcFile}`, '--author=Test Junior');
  assert.equal(again.duplicate_of, 'Test statements');
  await fail(['received', req.id, '--document=FY2025 financial statements'], /another client/);
  assert.equal((await go('received', req.id, `--document=${stmt.id}`))[0].still_open_for_job, 1);
  await go('waive', req2.id, '--reason=No loan this year');
  assert.equal((await go('job', 'TEST01 FY2026')).job[0].state, 'awaiting_client');
  await fail(['chase', req2.id], /already closed/);

  // Review, approval, signature, lock.
  const [wp] = await go('file', '--client=TEST01', '--job=TEST01 FY2026', '--category=Signed Approval', '--title=Test approval to lodge', '--status=draft', '--author=Test Junior');
  await fail(['finalise', wp.id], /Approve it first/);
  await fail(['submit', wp.id, '--reviewer=Test Junior'], /partner or manager/);
  await go('submit', wp.id, '--reviewer=Test Manager');
  await fail(['approve', wp.id, '--by=Someone Else'], /reviewer/);
  await go('approve', wp.id, '--by=Test Manager');
  const [sig] = await go('send-signature', wp.id, '--signer=Test Director', '--email=t@example.invalid');
  assert.equal((await go('job', 'TEST01 FY2026')).job[0].state, 'signing');
  await fail(['send-signature', wp.id, '--signer=Again'], /Already out/);
  await fail(['signed', sig.id, `--date=${day(3)}`], /between sending and today/);
  await go('signed', 'Test approval to lodge', `--date=${day(0)}`);
  await go('finalise', wp.id);
  await assert.rejects(() => db.query("update documents set title='changed' where id=$1", [wp.id]), /immutable/); checks++;
  await assert.rejects(() => db.query('delete from documents where id=$1', [wp.id]), /immutable/); checks++;

  // Lodging needs every required document final, a signed engagement and leaves a trail when overridden.
  await fail(['job-state', 'TEST01 FY2026', '--state=lodged'], /engagement/);
  await go('engage', 'TEST01', '--service=Test service', `--signed=${day(-1)}`);
  await go('engage', 'TEST01', '--service=Test service', `--signed=${day(0)}`, `--document=${stmt.id}`);
  const terms = (await go('engagements')).filter((e) => e.client === 'Test Client Ltd');
  assert.equal(terms.length, 1); assert.ok(terms[0].review_on > day(330) && terms[0].review_on < day(370));
  assert.equal((await go('job-state', 'TEST01 FY2026', '--state=lodged'))[0].state, 'lodged');
  await fail(['job-state', 'CHEN01', '--state=complete'], /required document|engagement/);
  await go('job-state', 'CHEN01', '--state=review', '--override', '--reason=testing trail', '--author=Test Manager');
  assert.ok((await go('client', 'Chen Family Trust')).activity.some((a) => /overridden: testing trail/.test(a.body)));
  await fail(['job-state', 'TEST01 FY2026', '--state=done'], /must be one of/);

  // Inbox filing happens once; identity; holds; disposal on schedule only.
  const [inbox] = await go('file', '--title=Test inbox email', '--kind=email', '--from=t@example.invalid', '--author=Outlook');
  assert.equal((await go('assign', inbox.id, '--client=TEST01', '--category=Email', '--job=TEST01 FY2026'))[0].title, 'Test inbox email');
  await fail(['assign', inbox.id, '--client=Chen Family Trust', '--category=Email'], /Already filed/);
  await go('verify-id', 'Chen Family Trust', `--date=${day(0)}`, '--method=Trustee licences, trust deed', '--risk=high');
  await fail(['verify-id', 'Chen Family Trust', `--date=${day(2)}`, '--method=x'], /future/);
  assert.equal((await go('aml')).find((r) => r.client === 'Chen Family Trust').status, 'ok');
  await fail(['dispose', wp.id, '--by=Test Manager'], /Keep until/);
  await go('hold', 'Ironbark', '--reason=Test audit');
  await fail(['dispose', 'FY2019 supplier invoices', '--by=Ruth Okafor'], /On hold/);
  await go('hold', 'Ironbark', '--release');
  const [gone] = await go('dispose', 'FY2019 supplier invoices', '--by=Ruth Okafor', '--method=secure shred');
  assert.match(gone.next, /never deletes files/);
  await assert.rejects(() => db.query('delete from disposals'), /Append-only/); checks++;
  assert.equal((await go('retention')).length, 2);
  await go('log', 'TEST01', '--text=Called about the loan', '--author=Test Manager');
  const [letter] = await go('draft-letter', 'TEST01', '--template=TEST', '--service=Test service');
  assert.match(fs.readFileSync(letter.draft, 'utf8'), /Dear Test Client Ltd,\nTest service from/);

  // FYI Bulk Export: preview rolls back, repeat imports add nothing, a bad layout undoes the run.
  const exp = path.join(temp, 'FYI - Export', '2026-10-01 0915');
  for (const [p, body] of [['Kowhai Group/Kowhai Orchards Ltd/2024/Tax Return/IR4 2024.pdf', 'ir4'], ['Smith Group/Jo Smith/2023/GST_BAS/BAS Q1.xlsx', 'bas'], ['Smith Group/Jo Smith/2023/Email/RE question.msg', 'mail']]) {
    fs.mkdirSync(path.dirname(path.join(exp, p)), { recursive: true }); fs.writeFileSync(path.join(exp, p), body);
  }
  const clientsCsv = path.join(temp, 'clients.csv');
  fs.writeFileSync(clientsCsv, '﻿Client Name,Client Code,Email,Partner,Manager\r\nJo Smith,SMIT01,jo@example.invalid,Ruth Okafor,Test Manager\r\n');
  const imp = ['import', 'fyi', `--dir=${exp}`, '--structure=group/client/year/category', `--clients=${clientsCsv}`];
  const preview = await go(...imp, '--dry-run');
  assert.equal(preview.at(-1).new_documents, 3);
  assert.equal((await go('archive')).length, 0);
  await go(...imp);
  assert.equal((await go('archive')).length, 2);
  const smith = await go('client', 'SMIT01');
  assert.equal(smith.client[0].manager, 'Test Manager');
  assert.equal(smith.documents.length, 2);
  assert.ok(smith.documents.some((d) => d.category === 'GST_BAS'));
  assert.equal((await go('find', '--text=IR4 2024'))[0].client, 'Kowhai Orchards Ltd');
  const repeat = await go(...imp);
  assert.equal(repeat.reduce((a, x) => a + x.new_clients + x.new_documents + x.new_archive_rows, 0), 0);
  assert.equal((await go('archive-search', '--text=BAS Q1')).length, 1);
  fs.mkdirSync(path.join(exp, 'Loose'), { recursive: true }); fs.writeFileSync(path.join(exp, 'Loose', 'stray.pdf'), 'x');
  await fail(imp, /expected 4 folder levels/);
  assert.equal((await db.query("select * from import_rows where payload::text like '%stray%'")).length, 0); checks++;
  await fail(['import', 'fyi', `--dir=${exp}`, '--structure=client/colour'], /Structure level/);
  await go('export', `--dir=${path.join(temp, 'export')}`);
  assert.ok(JSON.parse(fs.readFileSync(path.join(temp, 'export', 'disposals.json'), 'utf8')).length === 1); checks++;

  for (const cmd of helpCommands) assert.ok(seen.has(cmd), `Command not exercised: ${cmd}`);
  assert.deepEqual([...new Set(helpCommands)].sort(), [...Object.keys(reads), ...writes].sort());
  await db.close(); db = null;

  // Rendered paperwork and views, then the real CLI's exit code on an ambiguous name.
  for (const script of ['view.mjs', 'docs.mjs']) {
    const res = spawnSync(process.execPath, [path.join(REPO_ROOT, 'scripts', script)], { env: process.env, encoding: 'utf8' });
    assert.equal(res.status, 0, res.stderr); checks++;
  }
  const requests = fs.readdirSync(path.join(temp, 'docs-out', 'request-list')).map((f) => fs.readFileSync(path.join(temp, 'docs-out', 'request-list', f), 'utf8')).join('');
  assert.match(requests, /Vehicle loan statement/); assert.ok(!requests.includes('Test bank statements')); checks++;
  assert.ok(fs.readdirSync(path.join(temp, 'docs-out', 'disposal-certificate')).length === 1); checks++;
  assert.match(fs.readFileSync(path.join(temp, 'views', 'week.html'), 'utf8'), /Bayview Plumbing/); checks++;
  const cli = spawnSync(process.execPath, [path.join(REPO_ROOT, 'scripts', 'practice.mjs'), 'client', 'Mitchell', '--json'], { env: process.env, encoding: 'utf8' });
  assert.equal(cli.status, 1); assert.match(cli.stderr, /Sarah Mitchell/); checks++;

  console.log(`PASS: ${checks} checks, ${seen.size} CLI commands exercised (${process.env.DATABASE_URL ? 'postgres' : 'pglite'}): requests and chasers, review and signing, locked documents, engagements, identity, retention and holds, FYI import, drafts and HTML`);
} finally {
  await db?.close();
  fs.rmSync(temp, { recursive: true, force: true });
}
