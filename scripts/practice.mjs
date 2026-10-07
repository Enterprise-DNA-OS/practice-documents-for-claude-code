#!/usr/bin/env node
// The one CLI for an accounting practice's documents and workflow. Human tables by default, --json for machines.
// Names match case-insensitively and by partial text, code or ID prefix; an ambiguous name lists the
// candidates and exits 1. Every write runs in one transaction. Nothing here sends, lodges or deletes a file.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { parseCsv, pick } from './lib/csv.mjs';
import { table } from './lib/format.mjs';

export const reads = {
  attention: 'select kind,client,detail,owner from v_attention order by kind,client',
  clients: 'select c.code,c.name,c.entity,c.country,p.name partner,m.name manager,c.id_verified_on,c.hold,c.active from clients c left join staff p on p.id=c.partner_id left join staff m on m.id=c.manager_id order by c.name',
  staff: 'select name,role,email,active from staff order by role,name',
  categories: "select name,coalesce(retain_years::text,'country rule') retain_years,note from categories order by name",
  'job-types': "select t.code,t.name,t.service,coalesce(string_agg(c.name,', ' order by c.name),'') required from job_types t left join job_type_requirements r on r.job_type_id=t.id left join categories c on c.id=r.category_id group by t.code,t.name,t.service order by t.code",
  jobs: 'select name,client,job_type,state,due_on,days_to_due,manager,requests_open,documents,missing from v_jobs where open order by due_on nulls last,name',
  wip: "select state,count(*)::integer jobs,count(*) filter (where days_to_due<0)::integer overdue,string_agg(name,', ' order by due_on) list from v_jobs where open group by state order by array_position(array['planned','in_progress','awaiting_client','review','signing'],state)",
  due: "select name,client,state,due_on,days_to_due,manager,requests_open,missing from v_jobs where open and due_on<=current_date+setting('job_due_days')::integer order by due_on",
  'manager-load': "select coalesce(j.manager,'(none)') manager,count(*)::integer open_jobs,count(*) filter (where j.days_to_due<0)::integer overdue,count(*) filter (where j.state='awaiting_client')::integer awaiting_client,(select count(*) from v_documents d where d.status='review' and d.reviewer=j.manager)::integer reviewing from v_jobs j where j.open group by j.manager order by open_jobs desc",
  documents: "select client,category,title,kind,status,doc_date,filed_by,filed_on from v_documents where status<>'disposed' order by filed_on desc,title limit 50",
  unfiled: 'select id,title,kind,email_from,received_from,filed_on,current_date-filed_on days_waiting,path from v_documents where client_id is null and status<>\'disposed\' order by filed_on',
  'review-queue': "select reviewer,client,title,job,submitted_on,current_date-submitted_on days_waiting,id from v_documents where status='review' order by submitted_on",
  signatures: 'select client,title,signer,method,sent_on,days_out,job,id from v_signatures where signed_on is null order by sent_on',
  'awaiting-client': "select client,job,item,requested_on,due_on,days_overdue,chases,last_chased_on,manager from v_requests where status='open' order by due_on",
  'chase-list': "select client,job,item,days_overdue,chases,last_chased_on,manager,email,id from v_requests where chase_now order by days_overdue desc",
  engagements: 'select client,service,signed_on,review_on,days_to_review,letter from v_engagements where not superseded order by review_on',
  'engagements-due': "select client,service,'review '||review_on detail from v_engagements where not superseded and review_on<current_date+30 union all select client,service,'no signed letter for open job '||job from v_unengaged order by 1",
  aml: "select name client,entity,country,aml_risk,id_verified_on,id_method,case when id_verified_on is null then 'not verified' when aml_risk='high' and id_verified_on<current_date-setting('id_refresh_days')::integer then 're-verify' else 'ok' end status from clients where active order by status desc,name",
  retention: 'select client,country,category,title,doc_date,retain_until,days_past,id from v_retention order by retain_until',
  holds: "select c.name client,c.hold_reason reason,(select count(*) from documents d where d.client_id=c.id and d.status='final')::integer documents from clients c where c.hold union all select v.client,'document hold: '||v.title,1 from v_documents v join documents d on d.id=v.id where d.hold order by 1",
  duplicates: "select sha256,count(*)::integer copies,string_agg(coalesce(client,'(inbox)')||': '||title,' | ' order by title) documents from v_documents where sha256 is not null and status<>'disposed' group by sha256 having count(*)>1 order by copies desc",
  'client-years': "select client,year,count(*)::integer documents,string_agg(distinct category,', ') categories from v_documents where client is not null and status<>'disposed' group by client,year order by client,year desc",
  templates: 'select code,name,length(body)::integer characters from templates order by code',
  settings: 'select key,value,note from settings order by key',
  archive: 'select source_file,count(*)::integer rows from import_rows group by source_file order by source_file',
  compliance: `select 'ENGAGEMENT' rule,client record,job||': no signed engagement letter for '||service finding from v_unengaged
    union all select 'ENGAGEMENT-REVIEW',client,service||' terms signed '||signed_on||', review was due '||review_on from v_engagements where not superseded and review_on<current_date
    union all select 'IDENTITY',c.name,'Open job and no identity verification recorded' from clients c where c.active and c.id_verified_on is null and exists(select 1 from v_jobs j where j.client_id=c.id and j.open)
    union all select 'IDENTITY-REFRESH',name,'High-risk client last verified '||id_verified_on||' (practice policy)' from clients where active and aml_risk='high' and id_verified_on<current_date-setting('id_refresh_days')::integer
    union all select 'MISSING',client,name||' is '||state||' with '||missing||' required document type(s) not final' from v_jobs where not open and missing>0
    union all select 'RETENTION',client,title||': kept '||days_past||' days past '||retain_until from v_retention
    union all select 'UNFILED','(inbox)',title||' unfiled since '||filed_on from v_documents where client_id is null and status<>'disposed' and filed_on<=current_date-setting('unfiled_days')::integer`,
};

export const writes = ['client', 'job', 'checklist', 'find', 'add', 'file', 'assign', 'submit', 'approve', 'finalise', 'received', 'chase', 'waive', 'send-signature', 'signed', 'engage', 'verify-id', 'job-state', 'hold', 'dispose', 'log', 'draft-chase', 'draft-letter', 'import', 'export', 'archive-search'];
export const entities = ['settings', 'staff', 'clients', 'categories', 'job_types', 'job_type_requirements', 'jobs', 'documents', 'requests', 'signatures', 'engagements', 'templates', 'disposals', 'activity', 'import_rows'];

function required(o, k) { if (o[k] === undefined || o[k] === '' || o[k] === true) throw Error(`Required --${k}=...`); return o[k]; }
function int(v, label, min = 0, max = 100000000) { if (!/^\d+$/.test(String(v)) || Number(v) < min || Number(v) > max) throw Error(`Invalid ${label}`); return Number(v); }
function date(v) { if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) !== v) throw Error('Use a real date YYYY-MM-DD'); return v; }
function oneOf(v, list, label) { if (!list.includes(v)) throw Error(`${label} must be one of: ${list.join(', ')}`); return v; }
const today = () => new Date().toISOString().slice(0, 10);
const STATES = ['planned', 'in_progress', 'awaiting_client', 'review', 'signing', 'lodged', 'complete'];
const KINDS = ['document', 'email', 'letter', 'scan', 'workpaper', 'note'];

// What a person types to find a record, per table. CODES match exactly as well.
const LABELS = {
  clients: 'name', staff: 'name', categories: 'name', jobs: 'name', documents: 'title', requests: 'item', templates: 'code', job_types: 'code',
  signatures: "(select d.title from documents d where d.id=document_id)||' '||signer",
};
const CODES = { clients: 'code', job_types: 'code', templates: 'code' };
export async function resolve(db, entity, term) {
  const col = LABELS[entity];
  if (!col || !term || term === true) throw Error(`Supply a ${entity} name or ID`);
  const code = CODES[entity] ? ` or lower(coalesce(${CODES[entity]},''))=lower($1)` : '';
  let rows = await db.query(`select id,${col} as label from ${entity} where id::text=$1 or lower(coalesce(${col},''))=lower($1)${code}`, [term]);
  if (!rows.length) rows = await db.query(`select id,${col} as label from ${entity} where starts_with(id::text,lower($1)) or strpos(lower(coalesce(${col},'')),lower($1))>0 order by 2`, [term]);
  if (rows.length !== 1) throw Error(`${rows.length ? 'Ambiguous' : 'No matching'} ${entity}: ${term}\n${rows.map((r) => `${r.id}  ${r.label || ''}`).join('\n')}`);
  return rows[0].id;
}
async function transaction(db, fn) { await db.exec('BEGIN'); try { const r = await fn(); await db.exec('COMMIT'); return r; } catch (e) { await db.exec('ROLLBACK'); throw e; } }
async function insert(db, t, values) { const keys = Object.keys(values); return db.query(`insert into ${t}(${keys.join(',')}) values(${keys.map((_, i) => '$' + (i + 1)).join(',')}) returning *`, Object.values(values)); }
async function one(db, sql, params) { const [r] = await db.query(sql, params); if (!r) throw Error('Record not found'); return r; }

function hashFile(file) {
  const h = createHash('sha256');
  h.update(fs.readFileSync(file));
  return { sha256: h.digest('hex'), bytes: fs.statSync(file).size };
}
function walk(dir, base = dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full, base)); else if (e.isFile()) out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}
const kindOf = (file) => (/\.(msg|eml)$/i.test(file) ? 'email' : /\.(xlsx?|xlsm|csv)$/i.test(file) ? 'workpaper' : /\.(jpe?g|png|tiff?|heic)$/i.test(file) ? 'scan' : 'document');

// FYI Bulk Export writes one folder per export run, laid out by the Folder Structure the admin set
// (client group, client, year, category, ...). --structure names those levels in order; files stay
// where they are and every one lands in the register with its hash. An optional clients CSV brings
// codes, email, partner and manager.
async function importFyi(db, o) {
  const dir = path.resolve(required(o, 'dir'));
  if (!fs.existsSync(dir)) throw Error(`No folder ${dir}`);
  const structure = String(o.structure || 'client/year/category').split('/').map((s) => s.trim().toLowerCase());
  for (const s of structure) oneOf(s, ['client', 'code', 'group', 'year', 'category', 'job', '_'], `Structure level "${s}"`);
  if (!structure.includes('client') && !structure.includes('code')) throw Error('--structure needs a client or code level');
  const country = oneOf(o.country || 'AU', ['AU', 'NZ'], 'country');
  return transaction(db, async () => {
    const report = [];
    const archive = async (source, payload) => (await db.query('insert into import_rows(source_file,fingerprint,payload) values($1,$2,$3) on conflict(fingerprint) do nothing returning id',
      [source, createHash('sha256').update(source + '\n' + JSON.stringify(payload)).digest('hex'), JSON.stringify(payload)])).length;
    if (o.clients) {
      const file = path.resolve(o.clients);
      const rows = parseCsv(fs.readFileSync(file, 'utf8'));
      let added = 0, archived = 0;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        archived += await archive(path.basename(file), r);
        const name = pick(r, 'Client Name', 'Name', 'Client');
        if (!name) throw Error(`${path.basename(file)} row ${i + 2}: client name required`);
        const staffId = async (n) => (n ? (await db.query('select id from staff where lower(name)=lower($1)', [n]))[0]?.id || null : null);
        const code = pick(r, 'Client Code', 'Code', 'Client ID') || null;
        if ((await db.query('select 1 from clients where lower(name)=lower($1) or (code is not null and code=$2)', [name, code])).length) continue;
        added += (await db.query('insert into clients(external_id,code,name,email,country,partner_id,manager_id) values($1,$2,$3,$4,$5,$6,$7) on conflict do nothing returning id',
          [`fyi:${name}`, code, name, pick(r, 'Email', 'Email Address') || null, oneOf(pick(r, 'Country') || country, ['AU', 'NZ'], `row ${i + 2} country`),
            await staffId(pick(r, 'Partner')), await staffId(pick(r, 'Manager'))])).length;
      }
      report.push({ source: path.basename(file), rows: rows.length, new_clients: added, new_categories: 0, new_documents: 0, new_archive_rows: archived });
    }
    let files = 0, docs = 0, newClients = 0, newCats = 0, archived = 0;
    for (const rel of walk(dir)) {
      files++;
      const segs = rel.split('/');
      const dirs = segs.slice(0, -1);
      if (dirs.length < structure.length) throw Error(`${rel}: expected ${structure.length} folder levels (${structure.join('/')}); check --structure`);
      const at = (k) => { const i = structure.indexOf(k); return i < 0 ? '' : dirs[i]; };
      const { sha256, bytes } = hashFile(path.join(dir, rel));
      archived += await archive(path.basename(dir), { path: rel, bytes, sha256 });
      const ext = `fyi:${rel}`;
      if ((await db.query('select 1 from documents where external_id=$1', [ext])).length) continue;
      const clientName = at('client') || at('code');
      let [c] = await db.query('select id,country from clients where lower(name)=lower($1) or lower(coalesce(code,\'\'))=lower($1)', [clientName]);
      if (!c) { [c] = await insert(db, 'clients', { external_id: `fyi:${clientName}`, name: clientName, code: at('code') && at('client') ? at('code') : null, country }); newClients++; }
      let categoryId = null;
      const cat = at('category');
      if (cat) {
        let [k] = await db.query('select id from categories where lower(name)=lower($1)', [cat]);
        if (!k) { [k] = await insert(db, 'categories', { name: cat, note: 'From FYI export' }); newCats++; }
        categoryId = k.id;
      }
      const yearText = at('year');
      const year = /^\d{4}$/.test(yearText) ? Number(yearText) : null;
      const jobName = at('job');
      const [job] = jobName ? await db.query('select id from jobs where client_id=$1 and lower(name)=lower($2)', [c.id, jobName]) : [];
      await insert(db, 'documents', {
        external_id: ext, client_id: c.id, job_id: job?.id || null, category_id: categoryId, title: segs.at(-1).replace(/\.[^.]+$/, ''), kind: kindOf(rel), status: 'final',
        doc_date: year ? (c.country === 'NZ' ? `${year}-03-31` : `${year}-06-30`) : today(), year, path: path.join(o['path-prefix'] || dir, ...segs), sha256, bytes, filed_by: 'FYI import',
      });
      docs++;
    }
    report.push({ source: path.basename(dir), rows: files, new_clients: newClients, new_categories: newCats, new_documents: docs, new_archive_rows: archived });
    if (o['dry-run']) { await db.exec('ROLLBACK'); await db.exec('BEGIN'); report.forEach((r) => { r.mode = 'preview (rolled back)'; }); }
    return report;
  });
}

function draft(name, id, text) {
  const dir = path.join(process.env.OUTPUT_DIR || REPO_ROOT, 'drafts');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}-${String(id).slice(0, 8)}-${Date.now()}.txt`);
  fs.writeFileSync(file, text, { mode: 0o600 });
  return [{ draft: file, sent: false }];
}
const merge = (body, values) => body.replace(/\{\{(\w+)\}\}/g, (_, k) => (values[k] ?? `[${k}]`));

export async function run(db, argv) {
  const o = {}, pos = [];
  for (const a of argv) { if (a.startsWith('--')) { const i = a.indexOf('='); o[a.slice(2, i < 0 ? undefined : i)] = i < 0 ? true : a.slice(i + 1); } else pos.push(a); }
  const [cmd = 'help', arg] = pos;
  if (cmd === 'help') return [{ commands: [...Object.keys(reads), ...writes].join(', ') }];
  if (reads[cmd]) return db.query(reads[cmd]);
  if (cmd === 'client') {
    const id = await resolve(db, 'clients', arg);
    const q = (sql) => db.query(sql, [id]);
    return {
      client: await q('select c.code,c.name,c.entity,c.country,c.email,p.name partner,m.name manager,c.aml_risk,c.id_verified_on,c.hold,c.hold_reason from clients c left join staff p on p.id=c.partner_id left join staff m on m.id=c.manager_id where c.id=$1'),
      jobs: await q('select name,job_type,state,due_on,requests_open,missing from v_jobs where client_id=$1 order by due_on desc nulls last'),
      requests: await q("select item,job,due_on,days_overdue,chases from v_requests where client_id=$1 and status='open' order by due_on"),
      engagements: await q('select service,signed_on,review_on,superseded from v_engagements where client_id=$1 order by signed_on desc'),
      documents: await q("select year,category,title,status,doc_date,retain_until from v_documents where client_id=$1 and status<>'disposed' order by doc_date desc limit 25"),
      activity: await q('select created_at,author,body from activity where client_id=$1 order by created_at'),
    };
  }
  if (cmd === 'job' || cmd === 'checklist') {
    const id = await resolve(db, 'jobs', arg);
    const checklist = await db.query("select category,filed,final,case when final>0 then 'ok' when filed>0 then 'not final' else 'missing' end status from v_checklist where job_id=$1 order by category", [id]);
    if (cmd === 'checklist') return checklist;
    const q = (sql) => db.query(sql, [id]);
    return {
      job: await q('select name,client,job_type,service,state,period_end,due_on,days_to_due,manager,partner,lodged_on from v_jobs where id=$1'),
      checklist,
      documents: await q("select category,title,kind,status,doc_date from v_documents where job_id=$1 and status<>'disposed' order by doc_date"),
      requests: await q('select item,status,due_on,days_overdue,chases from v_requests where job_id=$1 order by due_on'),
      signatures: await q('select signer,sent_on,signed_on,title from v_signatures where document_id in (select id from documents where job_id=$1)'),
    };
  }
  if (cmd === 'find') return db.query("select client,category,year,title,status,path,id from v_documents where status<>'disposed' and (strpos(lower(title),lower($1))>0 or strpos(lower(coalesce(path,'')),lower($1))>0 or strpos(lower(coalesce(client,'')),lower($1))>0 or strpos(lower(coalesce(email_from,'')),lower($1))>0) order by doc_date desc limit 100", [required(o, 'text')]);
  if (cmd === 'import') { if (arg !== 'fyi') throw Error('Use: import fyi --dir=<bulk export folder> [--structure=client/year/category] [--clients=clients.csv] [--country=AU|NZ] [--dry-run]'); return importFyi(db, o); }
  if (cmd === 'archive-search') return db.query('select source_file,payload from import_rows where strpos(lower(payload::text),lower($1))>0 limit 100', [required(o, 'text')]);
  if (cmd === 'export') {
    const dir = path.resolve(required(o, 'dir'));
    fs.mkdirSync(dir, { recursive: true });
    const report = [];
    await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ');
    try {
      for (const e of entities) { const rows = await db.query(`select * from ${e} order by created_at,1`); fs.writeFileSync(path.join(dir, e + '.json'), JSON.stringify(rows, null, 2) + '\n', { mode: 0o600 }); report.push({ entity: e, rows: rows.length }); }
      await db.exec('COMMIT');
    } catch (e) { await db.exec('ROLLBACK'); throw e; }
    return report;
  }
  return transaction(db, async () => {
    const staffId = async (v) => (v ? resolve(db, 'staff', v) : null);
    if (cmd === 'add') {
      if (arg === 'client') return insert(db, 'clients', { name: required(o, 'name'), code: o.code || null, entity: o.entity || 'Company', country: oneOf(o.country || 'AU', ['AU', 'NZ'], 'country'), email: o.email || null, partner_id: await staffId(o.partner), manager_id: await staffId(o.manager), aml_risk: o.risk || 'standard' });
      if (arg === 'staff') return insert(db, 'staff', { name: required(o, 'name'), role: required(o, 'role'), email: o.email || null });
      if (arg === 'category') return insert(db, 'categories', { name: required(o, 'name'), retain_years: o['retain-years'] ? int(o['retain-years'], 'retain-years', 1, 100) : null, note: o.note || '' });
      if (arg === 'job-type') return insert(db, 'job_types', { code: required(o, 'code'), name: required(o, 'name'), service: required(o, 'service') });
      if (arg === 'requirement') return insert(db, 'job_type_requirements', { job_type_id: await resolve(db, 'job_types', required(o, 'job-type')), category_id: await resolve(db, 'categories', required(o, 'category')) });
      if (arg === 'template') return insert(db, 'templates', { code: required(o, 'code'), name: required(o, 'name'), body: required(o, 'body').replace(/\\n/g, '\n') });
      if (arg === 'job') {
        const client = await resolve(db, 'clients', required(o, 'client'));
        return insert(db, 'jobs', { name: required(o, 'name'), client_id: client, job_type_id: await resolve(db, 'job_types', required(o, 'type')), period_end: o['period-end'] ? date(o['period-end']) : null, due_on: o.due ? date(o.due) : null, manager_id: await staffId(o.manager) ?? (await one(db, 'select manager_id from clients where id=$1', [client])).manager_id });
      }
      if (arg === 'request') {
        const client = await resolve(db, 'clients', required(o, 'client'));
        const job = o.job ? await resolve(db, 'jobs', o.job) : null;
        if (job && (await one(db, 'select client_id from jobs where id=$1', [job])).client_id !== client) throw Error('That job belongs to another client');
        const [r] = await insert(db, 'requests', { client_id: client, job_id: job, item: required(o, 'item'), category_id: o.category ? await resolve(db, 'categories', o.category) : null, due_on: date(required(o, 'due')) });
        if (job) await db.query("update jobs set state='awaiting_client' where id=$1 and state in ('planned','in_progress')", [job]);
        return [r];
      }
      throw Error('add client|staff|category|job-type|requirement|template|job|request');
    }
    if (cmd === 'file') {
      const client = o.client ? await resolve(db, 'clients', o.client) : null;
      const job = o.job ? await resolve(db, 'jobs', o.job) : null;
      if (job && (await one(db, 'select client_id from jobs where id=$1', [job])).client_id !== client) throw Error('That job belongs to another client');
      if (client && !o.category) throw Error('Required --category=... when filing to a client');
      let hash = { sha256: o.sha256 || null, bytes: null };
      if (o.path && fs.existsSync(o.path) && fs.statSync(o.path).isFile()) hash = hashFile(o.path);
      const supersedes = o.supersedes ? await resolve(db, 'documents', o.supersedes) : null;
      const [d] = await insert(db, 'documents', {
        client_id: client, job_id: job, category_id: o.category ? await resolve(db, 'categories', o.category) : null, title: required(o, 'title'),
        kind: oneOf(o.kind || 'document', KINDS, 'kind'), status: oneOf(o.status || 'final', ['draft', 'final'], 'status'), doc_date: o.date ? date(o.date) : today(),
        year: o.year ? int(o.year, 'year', 1900, 2200) : null, path: o.path || null, sha256: hash.sha256, bytes: hash.bytes, email_from: o.from || null,
        received_from: o['received-from'] || null, supersedes_id: supersedes, filed_by: required(o, 'author'),
      });
      const dupes = d.sha256 ? await db.query("select title from documents where sha256=$1 and id<>$2 and status<>'disposed'", [d.sha256, d.id]) : [];
      return [{ ...d, duplicate_of: dupes.map((x) => x.title).join(', ') || null }];
    }
    if (cmd === 'assign') {
      const id = await resolve(db, 'documents', arg);
      const d = await one(db, 'select * from documents where id=$1 for update', [id]);
      if (d.client_id) throw Error('Already filed to a client; file a new version instead');
      const client = await resolve(db, 'clients', required(o, 'client'));
      const job = o.job ? await resolve(db, 'jobs', o.job) : null;
      if (job && (await one(db, 'select client_id from jobs where id=$1', [job])).client_id !== client) throw Error('That job belongs to another client');
      return db.query('update documents set client_id=$2,job_id=$3,category_id=$4 where id=$1 returning id,title,status', [id, client, job, await resolve(db, 'categories', required(o, 'category'))]);
    }
    if (cmd === 'submit') {
      const id = await resolve(db, 'documents', arg);
      const d = await one(db, 'select * from documents where id=$1 for update', [id]);
      if (d.status !== 'draft') throw Error('Only a draft goes to review');
      const reviewer = await resolve(db, 'staff', required(o, 'reviewer'));
      if (!['Partner', 'Manager'].includes((await one(db, 'select role from staff where id=$1', [reviewer])).role)) throw Error('Reviewer must be a partner or manager');
      if (d.job_id) await db.query("update jobs set state='review' where id=$1 and state in ('planned','in_progress','awaiting_client')", [d.job_id]);
      return db.query("update documents set status='review',reviewer_id=$2,submitted_on=current_date where id=$1 returning id,title,status,submitted_on", [id, reviewer]);
    }
    if (cmd === 'approve') {
      const id = await resolve(db, 'documents', arg);
      const d = await one(db, 'select d.*,s.name reviewer from documents d left join staff s on s.id=d.reviewer_id where d.id=$1 for update of d', [id]);
      if (d.status !== 'review') throw Error('Only a document in review can be approved');
      const by = required(o, 'by');
      if (by.toLowerCase() !== String(d.reviewer).toLowerCase() && !o.override) throw Error(`${d.reviewer} is the reviewer; add --override if another partner signs it off`);
      return db.query("update documents set status='approved',approved_by=$2 where id=$1 returning id,title,status,approved_by", [id, by]);
    }
    if (cmd === 'finalise') {
      const id = await resolve(db, 'documents', arg);
      const d = await one(db, 'select * from documents where id=$1 for update', [id]);
      if (d.status === 'final') throw Error('Already final');
      if (d.status !== 'approved' && !(d.status === 'draft' && ['email', 'scan', 'letter', 'note'].includes(d.kind))) throw Error('Approve it first: drafts of documents and workpapers go through review');
      if (o.path) { d.path = o.path; if (fs.existsSync(o.path)) Object.assign(d, hashFile(o.path)); }
      return db.query("update documents set status='final',path=$2,sha256=$3,bytes=$4 where id=$1 returning id,title,status,sha256", [id, d.path, d.sha256, d.bytes]);
    }
    if (['received', 'chase', 'waive'].includes(cmd)) {
      const id = await resolve(db, 'requests', arg);
      const r = await one(db, 'select * from requests where id=$1 for update', [id]);
      if (r.status !== 'open') throw Error('That request is already closed');
      if (cmd === 'chase') return db.query('update requests set chases=chases+1,last_chased_on=current_date where id=$1 returning item,chases,last_chased_on', [id]);
      if (cmd === 'waive') return db.query("update requests set status='waived',waive_reason=$2,closed_on=current_date where id=$1 returning item,status", [id, required(o, 'reason')]);
      const doc = await resolve(db, 'documents', required(o, 'document'));
      if ((await one(db, 'select client_id from documents where id=$1', [doc])).client_id !== r.client_id) throw Error('That document is filed to another client');
      const [done] = await db.query("update requests set status='received',document_id=$2,closed_on=current_date where id=$1 returning item,status", [id, doc]);
      const [{ n }] = await db.query("select count(*)::integer n from requests where job_id=$1 and status='open'", [r.job_id]);
      if (r.job_id && n === 0) await db.query("update jobs set state='in_progress' where id=$1 and state='awaiting_client'", [r.job_id]);
      return [{ ...done, still_open_for_job: n }];
    }
    if (cmd === 'send-signature') {
      const id = await resolve(db, 'documents', arg);
      const d = await one(db, 'select * from documents where id=$1', [id]);
      if (!['approved', 'final'].includes(d.status)) throw Error('Approve the document before it goes for signature');
      if ((await db.query('select 1 from signatures where document_id=$1 and signed_on is null', [id])).length) throw Error('Already out for signature');
      if (d.job_id) await db.query("update jobs set state='signing' where id=$1 and state not in ('lodged','complete')", [d.job_id]);
      return insert(db, 'signatures', { document_id: id, signer: required(o, 'signer'), email: o.email || null, method: o.method || 'e-signature', sent_on: o.date ? date(o.date) : today() });
    }
    if (cmd === 'signed') {
      const id = await resolve(db, 'signatures', arg);
      const s = await one(db, 'select * from signatures where id=$1 for update', [id]);
      if (s.signed_on) throw Error('Already signed');
      const on = date(required(o, 'date'));
      if (on < s.sent_on || on > today()) throw Error('Signed date must fall between sending and today');
      return db.query('update signatures set signed_on=$2 where id=$1 returning signer,sent_on,signed_on', [id, on]);
    }
    if (cmd === 'engage') {
      const client = await resolve(db, 'clients', arg);
      const service = required(o, 'service');
      const signed = date(required(o, 'signed'));
      const months = Number((await one(db, "select value from settings where key='engagement_review_months'")).value);
      const review = o.review ? date(o.review) : (await one(db, 'select ($1::date+make_interval(months=>$2::integer))::date d', [signed, months])).d;
      const doc = o.document ? await resolve(db, 'documents', o.document) : null;
      await db.query('update engagements set superseded=true where client_id=$1 and lower(service)=lower($2) and not superseded', [client, service]);
      return insert(db, 'engagements', { client_id: client, service, document_id: doc, signed_on: signed, review_on: review });
    }
    if (cmd === 'verify-id') {
      const on = date(required(o, 'date'));
      if (on > today()) throw Error('Verification date cannot be in the future');
      return db.query('update clients set id_verified_on=$2,id_method=$3,aml_risk=coalesce($4,aml_risk) where id=$1 returning name,id_verified_on,id_method,aml_risk',
        [await resolve(db, 'clients', arg), on, required(o, 'method'), o.risk ? oneOf(o.risk, ['low', 'standard', 'high'], 'risk') : null]);
    }
    if (cmd === 'job-state') {
      const id = await resolve(db, 'jobs', arg);
      const state = oneOf(required(o, 'state'), STATES, 'state');
      const j = await one(db, 'select * from v_jobs where id=$1', [id]);
      if (['lodged', 'complete'].includes(state) && !o.override) {
        if (j.missing > 0) throw Error(`${j.missing} required document type(s) not final; see checklist, or add --override with a reason logged`);
        const [u] = await db.query('select 1 from v_unengaged where id=$1', [id]);
        if (u) throw Error('No signed engagement letter for this service; record it with engage first');
      }
      if (o.override) await insert(db, 'activity', { client_id: j.client_id, body: `${j.name} moved to ${state} with checks overridden: ${required(o, 'reason')}`, author: required(o, 'author') });
      return db.query("update jobs set state=$2,lodged_on=case when $2='lodged' then coalesce(lodged_on,current_date) else lodged_on end where id=$1 returning name,state,lodged_on", [id, state]);
    }
    if (cmd === 'hold') {
      const id = await resolve(db, 'clients', arg);
      if (o.release) return db.query('update clients set hold=false,hold_reason=null where id=$1 returning name,hold', [id]);
      return db.query('update clients set hold=true,hold_reason=$2 where id=$1 returning name,hold,hold_reason', [id, required(o, 'reason')]);
    }
    if (cmd === 'dispose') {
      const id = await resolve(db, 'documents', arg);
      const v = await one(db, 'select * from v_documents where id=$1', [id]);
      if (v.status !== 'final') throw Error('Only a final document can be disposed of');
      if (v.on_hold) throw Error('On hold: release the hold before disposal');
      if (v.retain_until >= today()) throw Error(`Keep until ${v.retain_until}`);
      await insert(db, 'disposals', { document_id: id, disposed_on: today(), retain_until: v.retain_until, authorised_by: required(o, 'by'), method: o.method || 'secure delete', reason: o.reason || 'Retention period ended' });
      await db.query("update documents set status='disposed',disposed_on=current_date where id=$1", [id]);
      return [{ title: v.title, client: v.client, retain_until: v.retain_until, file_still_at: v.path, next: 'A person deletes the file at that path. This system never deletes files.' }];
    }
    if (cmd === 'log') return insert(db, 'activity', { client_id: await resolve(db, 'clients', arg), body: required(o, 'text'), author: required(o, 'author') });
    if (cmd === 'draft-chase') {
      const client = await resolve(db, 'clients', arg);
      const job = o.job ? await resolve(db, 'jobs', o.job) : null;
      const items = await db.query("select item,due_on,job,manager,email,client from v_requests where client_id=$1 and status='open' and ($2::uuid is null or job_id=$2) order by due_on,item", [client, job]);
      if (!items.length) throw Error('Nothing outstanding for this client');
      const t = await one(db, "select body from templates where code='REQUEST'");
      const jobs = [...new Set(items.map((i) => i.job).filter(Boolean))];
      return draft('chase', client, `DRAFT ONLY. Check the recipient before sending, then run chase for each item.\nTo: ${items[0].email || '[verify address]'}\nSubject: Still needed: ${jobs.join(', ') || 'your information'}\n\n` +
        merge(t.body, { client: items[0].client, job: jobs.join(' and ') || 'your work', manager: items[0].manager || '[your name]', outstanding: items.map((i) => `- ${i.item} (due ${i.due_on})`).join('\n') }));
    }
    if (cmd === 'draft-letter') {
      const client = await resolve(db, 'clients', arg);
      const t = await one(db, 'select * from templates where id=$1', [await resolve(db, 'templates', required(o, 'template'))]);
      const c = await one(db, 'select c.name,c.email,p.name partner,m.name manager from clients c left join staff p on p.id=c.partner_id left join staff m on m.id=c.manager_id where c.id=$1', [client]);
      const job = o.job ? await one(db, 'select name,service from v_jobs where id=$1', [await resolve(db, 'jobs', o.job)]) : null;
      const practice = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'brand.json'), 'utf8')).business_name;
      return draft(t.code.toLowerCase(), client, `DRAFT ONLY. A person checks it and sends it.\nTo: ${c.email || '[verify address]'}\n\n` +
        merge(t.body, { client: c.name, partner: c.partner, manager: c.manager, job: job?.name, service: o.service || job?.service, practice }));
    }
    throw Error(`Unknown command ${cmd}; run help`);
  });
}

export function printResult(result, json = false) {
  if (json) return JSON.stringify(result, null, 2);
  if (!Array.isArray(result)) return Object.entries(result).map(([name, rows]) => `${name}\n${printResult(rows)}`).join('\n\n');
  if (!result.length) return '(none)';
  const rows = result.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k,
    v instanceof Date ? v.toISOString().slice(0, 16).replace('T', ' ') : v && typeof v === 'object' ? JSON.stringify(v) : v])));
  return table(rows, Object.keys(rows[0]).map((key) => ({ key, label: key, width: key === 'id' ? 10 : key === 'sha256' ? 12 : 60 })));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  let db;
  try { db = await getDb(); console.log(printResult(await run(db, process.argv.slice(2)), process.argv.includes('--json'))); }
  catch (e) { console.error(e.message); process.exitCode = 1; }
  finally { await db?.close(); }
}
