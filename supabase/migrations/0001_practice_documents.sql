-- Accounting practice documents and workflow. No extension required on PostgreSQL 14+ or PGlite.
-- Staff and clients; categories and job types with the documents each job must hold; jobs; the
-- document register (files stay in your drive, this is the index); client requests and chasers;
-- reviews and signatures; engagement letters; identity checks; retention, holds and disposals.
create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create function immutable_record() returns trigger language plpgsql as $$ begin raise exception 'Append-only record'; end $$;

-- Practice rules the commands read. Change them with /customise, never in code.
create table settings (key text primary key, value numeric not null, note text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on settings for each row execute function touch_updated_at();
insert into settings(key,value,note) values
 ('retain_years_au',5,'ATO: keep tax records for five years (Income Tax Assessment Act 1936 s262A)'),
 ('retain_years_nz',7,'Inland Revenue: keep business records for at least seven years (Tax Administration Act 1994 s22)'),
 ('engagement_review_months',12,'Practice policy: confirm engagement terms at least this often (APES 305 asks for terms to be reviewed when circumstances change)'),
 ('review_days',5,'Practice policy: flag a document sitting in review longer than this'),
 ('sign_chase_days',7,'Practice policy: flag a document out for signature longer than this'),
 ('chase_every_days',7,'Practice policy: chase an overdue client request again after this many days'),
 ('unfiled_days',3,'Practice policy: flag inbox items not filed to a client after this many days'),
 ('job_due_days',14,'Practice policy: list open jobs due within this many days'),
 ('id_refresh_days',365,'Practice policy: re-verify a high-risk client after this many days (enhanced due diligence)');

create table staff (id uuid primary key default gen_random_uuid(), name text not null unique,
 role text not null check(role in ('Partner','Manager','Accountant','Administrator')), email text, active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on staff for each row execute function touch_updated_at();

create table clients (id uuid primary key default gen_random_uuid(), external_id text unique, code text unique, name text not null,
 entity text not null default 'Company' check(entity in ('Individual','Company','Trust','Partnership','SMSF','Sole trader','Not for profit')),
 country text not null default 'AU' check(country in ('AU','NZ')), email text,
 partner_id uuid references staff, manager_id uuid references staff,
 aml_risk text not null default 'standard' check(aml_risk in ('low','standard','high')), id_verified_on date, id_method text,
 hold boolean not null default false, hold_reason text, active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on clients for each row execute function touch_updated_at();

-- Cabinets of the old system become categories. retain_years overrides the country rule (identity records, minutes).
create table categories (id uuid primary key default gen_random_uuid(), name text not null unique, retain_years integer check(retain_years between 1 and 100), note text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on categories for each row execute function touch_updated_at();

create table job_types (id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, service text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on job_types for each row execute function touch_updated_at();
create table job_type_requirements (id uuid primary key default gen_random_uuid(), job_type_id uuid not null references job_types, category_id uuid not null references categories, unique(job_type_id,category_id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on job_type_requirements for each row execute function touch_updated_at();

create table jobs (id uuid primary key default gen_random_uuid(), external_id text unique, name text not null unique, client_id uuid not null references clients, job_type_id uuid not null references job_types,
 period_end date, due_on date, manager_id uuid references staff,
 state text not null default 'planned' check(state in ('planned','in_progress','awaiting_client','review','signing','lodged','complete')), lodged_on date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on jobs for each row execute function touch_updated_at();

-- The register. path is where the file lives (drive, SharePoint, OneDrive); sha256 proves it has not changed.
create table documents (id uuid primary key default gen_random_uuid(), external_id text unique, client_id uuid references clients, job_id uuid references jobs, category_id uuid references categories,
 title text not null, kind text not null default 'document' check(kind in ('document','email','letter','scan','workpaper','note')),
 status text not null default 'final' check(status in ('draft','review','approved','final','disposed')),
 doc_date date not null default current_date, year integer check(year between 1900 and 2200), path text, sha256 text, bytes bigint,
 email_from text, email_to text, received_from text, reviewer_id uuid references staff, submitted_on date, approved_by text,
 supersedes_id uuid references documents, filed_by text not null default 'import', filed_on date not null default current_date,
 hold boolean not null default false, disposed_on date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on documents for each row execute function touch_updated_at();
create index document_client on documents(client_id,doc_date);
create index document_hash on documents(sha256);

create table requests (id uuid primary key default gen_random_uuid(), client_id uuid not null references clients, job_id uuid references jobs, item text not null, category_id uuid references categories,
 requested_on date not null default current_date, due_on date not null, chases integer not null default 0, last_chased_on date,
 status text not null default 'open' check(status in ('open','received','waived')), document_id uuid references documents, closed_on date, waive_reason text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on requests for each row execute function touch_updated_at();

create table signatures (id uuid primary key default gen_random_uuid(), document_id uuid not null references documents, signer text not null, email text,
 method text not null default 'e-signature', sent_on date not null default current_date, signed_on date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on signatures for each row execute function touch_updated_at();

create table engagements (id uuid primary key default gen_random_uuid(), client_id uuid not null references clients, service text not null, document_id uuid references documents,
 signed_on date not null, review_on date not null, superseded boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on engagements for each row execute function touch_updated_at();

create table templates (id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, body text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on templates for each row execute function touch_updated_at();

create table disposals (id uuid primary key default gen_random_uuid(), document_id uuid not null unique references documents, disposed_on date not null, retain_until date not null,
 authorised_by text not null, method text not null, reason text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table activity (id uuid primary key default gen_random_uuid(), client_id uuid not null references clients, body text not null, author text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table import_rows (id uuid primary key default gen_random_uuid(), source_file text not null, fingerprint text not null unique, payload jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on import_rows for each row execute function touch_updated_at();
create trigger locked_disposal before update or delete on disposals for each row execute function immutable_record();
create trigger locked_activity before update or delete on activity for each row execute function immutable_record();

-- A final document never changes. Only its hold flag, or final to disposed, may move; an inbox item may be filed to a client once.
create function protect_final_document() returns trigger language plpgsql as $$
declare skip text[] := array['status','hold','updated_at','disposed_on'];
begin
 if old.status not in ('final','disposed') then if TG_OP='DELETE' then return old; end if; return new; end if;
 if TG_OP='DELETE' then raise exception 'Final document is immutable; dispose of it on schedule or file a new version'; end if;
 if old.client_id is null then skip := skip || array['client_id','job_id','category_id']; end if;
 if (to_jsonb(new) - skip) <> (to_jsonb(old) - skip)
  or (new.status<>old.status and not (old.status='final' and new.status='disposed'))
  or (old.status='disposed' and new.hold<>old.hold) then
  raise exception 'Final document is immutable; file a new version';
 end if;
 return new;
end $$;
create trigger locked_document before update or delete on documents for each row execute function protect_final_document();

create function setting(k text) returns numeric language sql stable as $$ select value from settings where key=k $$;

create view v_documents as
 select d.id,c.name client,c.code,c.country,j.name job,cat.name category,d.title,d.kind,d.status,d.doc_date,d.year,d.path,d.sha256,d.bytes,
 d.email_from,d.received_from,st.name reviewer,d.submitted_on,d.filed_by,d.filed_on,(d.hold or coalesce(c.hold,false)) on_hold,d.disposed_on,
 (coalesce(j.lodged_on,j.period_end,d.doc_date)+make_interval(years=>coalesce(cat.retain_years,case when c.country='NZ' then setting('retain_years_nz') else setting('retain_years_au') end)::integer))::date retain_until,
 d.client_id,d.job_id,d.category_id
 from documents d left join clients c on c.id=d.client_id left join jobs j on j.id=d.job_id left join categories cat on cat.id=d.category_id left join staff st on st.id=d.reviewer_id;

create view v_checklist as
 select j.id job_id,j.name job,c.name client,cat.name category,
 (select count(*) from documents d where d.job_id=j.id and d.category_id=cat.id and d.status<>'disposed')::integer filed,
 (select count(*) from documents d where d.job_id=j.id and d.category_id=cat.id and d.status='final')::integer final
 from jobs j join clients c on c.id=j.client_id join job_type_requirements r on r.job_type_id=j.job_type_id join categories cat on cat.id=r.category_id;

create view v_requests as
 select q.id,c.name client,j.name job,q.item,q.requested_on,q.due_on,greatest(0,current_date-q.due_on) days_overdue,q.chases,q.last_chased_on,
 m.name manager,c.email,q.status,q.client_id,q.job_id,
 q.status='open' and q.due_on<current_date and (q.last_chased_on is null or q.last_chased_on<=current_date-setting('chase_every_days')::integer) chase_now
 from requests q join clients c on c.id=q.client_id left join jobs j on j.id=q.job_id left join staff m on m.id=coalesce(j.manager_id,c.manager_id);

create view v_jobs as
 select j.id,j.name,c.name client,c.code,t.code job_type,t.service,j.state,j.period_end,j.due_on,j.due_on-current_date days_to_due,m.name manager,p.name partner,j.lodged_on,
 (select count(*) from requests q where q.job_id=j.id and q.status='open')::integer requests_open,
 (select count(*) from documents d where d.job_id=j.id and d.status<>'disposed')::integer documents,
 (select count(*) from v_checklist k where k.job_id=j.id and k.final=0)::integer missing,
 j.state not in ('lodged','complete') open,j.client_id
 from jobs j join clients c on c.id=j.client_id join job_types t on t.id=j.job_type_id left join staff m on m.id=j.manager_id left join staff p on p.id=c.partner_id;

create view v_signatures as
 select s.id,v.client,v.title,s.signer,s.method,s.sent_on,s.signed_on,current_date-s.sent_on days_out,v.job,s.document_id
 from signatures s join v_documents v on v.id=s.document_id;

create view v_engagements as
 select e.id,c.name client,e.service,e.signed_on,e.review_on,e.review_on-current_date days_to_review,v.title letter,e.superseded,e.client_id
 from engagements e join clients c on c.id=e.client_id left join v_documents v on v.id=e.document_id;

-- Open jobs whose service has no current signed engagement letter.
create view v_unengaged as
 select j.id,j.name job,j.client,j.service,j.manager from v_jobs j
 where j.open and not exists(select 1 from engagements e where e.client_id=j.client_id and lower(e.service)=lower(j.service) and not e.superseded);

create view v_retention as
 select id,client,code,country,category,title,doc_date,retain_until,current_date-retain_until days_past,path from v_documents
 where status='final' and client is not null and not on_hold and retain_until<current_date;

create view v_attention as
 select 'request' kind,client,item||' for '||coalesce(job,'no job')||': '||days_overdue||' days overdue, chased '||chases||' times' detail,manager owner from v_requests where status='open' and days_overdue>0
 union all select 'signature',client,title||' sent to '||signer||' '||days_out||' days ago',null from v_signatures where signed_on is null and days_out>=setting('sign_chase_days')
 union all select 'review',client,title||' with '||reviewer||' since '||submitted_on,reviewer from v_documents where status='review' and submitted_on<=current_date-setting('review_days')::integer
 union all select 'unfiled','(inbox)',title||coalesce(' from '||email_from,'')||', in the inbox since '||filed_on,null from v_documents where client_id is null and status<>'disposed' and filed_on<=current_date-setting('unfiled_days')::integer
 union all select 'job',client,name||' ('||state||') due '||due_on||case when days_to_due<0 then ', overdue '||(-days_to_due)||' days' else '' end,manager from v_jobs where open and due_on<=current_date+setting('job_due_days')::integer
 union all select 'engagement',client,job||': no signed engagement letter for '||service,manager from v_unengaged
 union all select 'engagement',client,service||' letter signed '||signed_on||', review was due '||review_on,null from v_engagements where not superseded and review_on<current_date
 union all select 'identity',c.name,'Open job and no identity verification recorded',m.name from clients c left join staff m on m.id=c.manager_id where c.active and c.id_verified_on is null and exists(select 1 from v_jobs j where j.client_id=c.id and j.open)
 union all select 'missing',client,name||' is '||state||' with '||missing||' required document type(s) missing',manager from v_jobs where not open and missing>0
 union all select 'retention',client,title||' kept past '||retain_until||' ('||category||')',null from v_retention;
