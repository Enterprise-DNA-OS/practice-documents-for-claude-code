-- Fictional accounting practice, Harbour Lane Accountants. Stable IDs and conflict handling make this seed repeatable.
-- Dates move with the day it is first seeded, so the attention list always has something to say.
insert into staff(id,name,role,email) values
 ('10000000-0000-0000-0000-000000000001','Ruth Okafor','Partner','ruth@example.invalid'),
 ('10000000-0000-0000-0000-000000000002','Daniel Price','Manager','daniel@example.invalid'),
 ('10000000-0000-0000-0000-000000000003','Priya Shah','Accountant','priya@example.invalid'),
 ('10000000-0000-0000-0000-000000000004','Leo Grant','Administrator','leo@example.invalid') on conflict do nothing;

insert into clients(id,code,name,entity,country,email,partner_id,manager_id,aml_risk,id_verified_on,id_method,hold,hold_reason) values
 ('20000000-0000-0000-0000-000000000001','BAYV01','Bayview Plumbing Pty Ltd','Company','AU','accounts@bayview.example.invalid','10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','standard',current_date-300,'Director licence, ASIC extract',false,null),
 ('20000000-0000-0000-0000-000000000002','CHEN01','Chen Family Trust','Trust','AU','wei.chen@example.invalid','10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','high',null,null,false,null),
 ('20000000-0000-0000-0000-000000000003','KOWH01','Kowhai Orchards Ltd','Company','NZ','office@kowhai.example.invalid','10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','standard',current_date-500,'Director passport, Companies Office extract',false,null),
 ('20000000-0000-0000-0000-000000000004','MITC01','Sarah Mitchell','Individual','AU','sarah.m@example.invalid','10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','low',current_date-700,'Driver licence',true,'Family law property settlement: keep all records until the solicitor releases them'),
 ('20000000-0000-0000-0000-000000000005','MITC02','Mitchell Super Fund','SMSF','AU','sarah.m@example.invalid','10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','low',current_date-700,'Trustee driver licence',false,null),
 ('20000000-0000-0000-0000-000000000006','IRON01','Ironbark Cafe Pty Ltd','Company','AU','hello@ironbark.example.invalid','10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','standard',current_date-900,'Director licence, ASIC extract',false,null) on conflict do nothing;

insert into categories(id,name,retain_years,note) values
 ('30000000-0000-0000-0000-000000000001','Tax Return',null,'Lodged returns and assessments'),
 ('30000000-0000-0000-0000-000000000002','Financial Statements',null,'Signed annual accounts'),
 ('30000000-0000-0000-0000-000000000003','Working Papers',null,'Workpapers and reconciliations'),
 ('30000000-0000-0000-0000-000000000004','Client Source Docs',null,'Bank statements, invoices, receipts the client supplied'),
 ('30000000-0000-0000-0000-000000000005','Signed Approval',null,'Client declarations and signed approvals to lodge'),
 ('30000000-0000-0000-0000-000000000006','Engagement',null,'Engagement letters and terms'),
 ('30000000-0000-0000-0000-000000000007','ATO Correspondence',null,'Notices and letters from the ATO'),
 ('30000000-0000-0000-0000-000000000008','IRD Correspondence',null,'Notices and letters from Inland Revenue'),
 ('30000000-0000-0000-0000-000000000009','Identity',7,'Client identification records: seven years under the AML/CTF rules'),
 ('30000000-0000-0000-0000-000000000010','Email',null,'Filed client emails') on conflict do nothing;

insert into job_types(id,code,name,service) values
 ('40000000-0000-0000-0000-000000000001','ITR','Individual tax return','Tax compliance'),
 ('40000000-0000-0000-0000-000000000002','CO-FY','Company accounts and return','Annual compliance'),
 ('40000000-0000-0000-0000-000000000003','SMSF','SMSF accounts, return and audit pack','SMSF compliance'),
 ('40000000-0000-0000-0000-000000000004','BAS','Quarterly BAS','BAS'),
 ('40000000-0000-0000-0000-000000000005','NZ-IR4','NZ company accounts and IR4','Annual compliance') on conflict do nothing;
insert into job_type_requirements(job_type_id,category_id) values
 ('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000004'),('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001'),('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000005'),
 ('40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002'),('40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001'),('40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000003'),('40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000005'),
 ('40000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000002'),('40000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000001'),('40000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000003'),('40000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000005'),
 ('40000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000003'),
 ('40000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000002'),('40000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000001'),('40000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000005')
 on conflict do nothing;

insert into jobs(id,name,client_id,job_type_id,period_end,due_on,manager_id,state,lodged_on) values
 ('50000000-0000-0000-0000-000000000001','BAYV01 FY2026 accounts','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002','2026-06-30',current_date+20,'10000000-0000-0000-0000-000000000002','awaiting_client',null),
 ('50000000-0000-0000-0000-000000000002','MITC01 2026 ITR','20000000-0000-0000-0000-000000000004','40000000-0000-0000-0000-000000000001','2026-06-30',current_date+25,'10000000-0000-0000-0000-000000000003','signing',null),
 ('50000000-0000-0000-0000-000000000003','CHEN01 FY2026 trust return','20000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000002','2026-06-30',current_date+40,'10000000-0000-0000-0000-000000000002','in_progress',null),
 ('50000000-0000-0000-0000-000000000004','KOWH01 FY2026 accounts and IR4','20000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000005','2026-03-31',current_date+12,'10000000-0000-0000-0000-000000000002','review',null),
 ('50000000-0000-0000-0000-000000000005','IRON01 FY2025 accounts','20000000-0000-0000-0000-000000000006','40000000-0000-0000-0000-000000000002','2025-06-30',current_date-200,'10000000-0000-0000-0000-000000000002','complete',current_date-210),
 ('50000000-0000-0000-0000-000000000006','MITC02 FY2026 SMSF','20000000-0000-0000-0000-000000000005','40000000-0000-0000-0000-000000000003','2026-06-30',current_date+10,'10000000-0000-0000-0000-000000000003','planned',null),
 ('50000000-0000-0000-0000-000000000007','BAYV01 BAS Q1 FY2027','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000004','2026-09-30',current_date-3,'10000000-0000-0000-0000-000000000003','in_progress',null) on conflict do nothing;

insert into documents(id,client_id,job_id,category_id,title,kind,status,doc_date,year,path,sha256,bytes,email_from,received_from,reviewer_id,submitted_on,filed_by,filed_on) values
 ('60000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',null,'30000000-0000-0000-0000-000000000006','Engagement letter 2025','letter','final',current_date-400,2025,'Clients/Bayview Plumbing Pty Ltd/2025/Engagement/Engagement letter 2025.pdf','a1a1000000000000000000000000000000000000000000000000000000000001',182044,null,'Practice',null,null,'Leo Grant',current_date-400),
 ('60000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000004','Westpac statements Jul-Dec 2025','scan','final',current_date-30,2026,'Clients/Bayview Plumbing Pty Ltd/2026/Client Source Docs/Westpac Jul-Dec.pdf','b2b2000000000000000000000000000000000000000000000000000000000002',901233,'accounts@bayview.example.invalid','Client',null,null,'Leo Grant',current_date-30),
 ('60000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000003','FY2026 bank reconciliation','workpaper','draft',current_date-6,2026,'Clients/Bayview Plumbing Pty Ltd/2026/Working Papers/Bank rec.xlsx',null,null,null,'Practice',null,null,'Priya Shah',current_date-6),
 ('60000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000004','50000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','2026 individual tax return for signing','document','approved',current_date-12,2026,'Clients/Sarah Mitchell/2026/Tax Return/ITR 2026 draft.pdf','c3c3000000000000000000000000000000000000000000000000000000000003',240511,null,'Practice',null,null,'Priya Shah',current_date-12),
 ('60000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000004','50000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000004','Rental property statements 2026','scan','final',current_date-40,2026,'Clients/Sarah Mitchell/2026/Client Source Docs/Rental statements.pdf','d4d4000000000000000000000000000000000000000000000000000000000004',350220,'sarah.m@example.invalid','Client',null,null,'Leo Grant',current_date-40),
 ('60000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000004',null,'30000000-0000-0000-0000-000000000001','2019 individual tax return','document','final','2019-10-31',2019,'Clients/Sarah Mitchell/2019/Tax Return/ITR 2019.pdf','e5e5000000000000000000000000000000000000000000000000000000000005',220114,null,'Practice',null,null,'import','2019-10-31'),
 ('60000000-0000-0000-0000-000000000007','20000000-0000-0000-0000-000000000003','50000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000002','FY2026 financial statements','document','review',current_date-9,2026,'Clients/Kowhai Orchards Ltd/2026/Financial Statements/FS 2026.pdf',null,null,null,'Practice','10000000-0000-0000-0000-000000000001',current_date-8,'Daniel Price',current_date-9),
 ('60000000-0000-0000-0000-000000000008','20000000-0000-0000-0000-000000000003',null,'30000000-0000-0000-0000-000000000002','FY2018 financial statements','document','final','2018-03-31',2018,'Clients/Kowhai Orchards Ltd/2018/Financial Statements/FS 2018.pdf','f6f6000000000000000000000000000000000000000000000000000000000006',410332,null,'Practice',null,null,'import','2018-06-30'),
 ('60000000-0000-0000-0000-000000000009','20000000-0000-0000-0000-000000000003',null,'30000000-0000-0000-0000-000000000002','FY2020 financial statements','document','final','2020-03-31',2020,'Clients/Kowhai Orchards Ltd/2020/Financial Statements/FS 2020.pdf','0707000000000000000000000000000000000000000000000000000000000007',398100,null,'Practice',null,null,'import','2020-06-30'),
 ('60000000-0000-0000-0000-000000000010','20000000-0000-0000-0000-000000000006',null,'30000000-0000-0000-0000-000000000002','FY2019 financial statements','document','final','2019-06-30',2019,'Clients/Ironbark Cafe Pty Ltd/2019/Financial Statements/FS 2019.pdf','0808000000000000000000000000000000000000000000000000000000000008',377000,null,'Practice',null,null,'import','2019-09-30'),
 ('60000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000006',null,'30000000-0000-0000-0000-000000000004','FY2019 supplier invoices','scan','final','2019-06-30',2019,'Clients/Ironbark Cafe Pty Ltd/2019/Client Source Docs/Invoices 2019.pdf','0909000000000000000000000000000000000000000000000000000000000009',1200400,null,'Client',null,null,'import','2019-08-01'),
 ('60000000-0000-0000-0000-000000000012','20000000-0000-0000-0000-000000000006','50000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000002','FY2025 financial statements','document','final',current_date-215,2025,'Clients/Ironbark Cafe Pty Ltd/2025/Financial Statements/FS 2025.pdf','1010000000000000000000000000000000000000000000000000000000000010',402100,null,'Practice',null,null,'Daniel Price',current_date-215),
 ('60000000-0000-0000-0000-000000000013','20000000-0000-0000-0000-000000000006','50000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000001','FY2025 company tax return','document','final',current_date-212,2025,'Clients/Ironbark Cafe Pty Ltd/2025/Tax Return/CTR 2025.pdf','1111000000000000000000000000000000000000000000000000000000000011',198200,null,'Practice',null,null,'Daniel Price',current_date-212),
 ('60000000-0000-0000-0000-000000000014','20000000-0000-0000-0000-000000000006','50000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000003','FY2025 workpapers','workpaper','final',current_date-216,2025,'Clients/Ironbark Cafe Pty Ltd/2025/Working Papers/Workpapers 2025.xlsx','1212000000000000000000000000000000000000000000000000000000000012',88100,null,'Practice',null,null,'Priya Shah',current_date-216),
 ('60000000-0000-0000-0000-000000000015','20000000-0000-0000-0000-000000000006','50000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000003','FY2025 workpapers (copy)','workpaper','final',current_date-216,2025,'Clients/Ironbark Cafe Pty Ltd/2025/Working Papers/Workpapers 2025 (1).xlsx','1212000000000000000000000000000000000000000000000000000000000012',88100,null,'Practice',null,null,'Priya Shah',current_date-216),
 ('60000000-0000-0000-0000-000000000016',null,null,null,'RE: Super contribution notices','email','final',current_date-5,2026,'Inbox/RE Super contribution notices.msg','1313000000000000000000000000000000000000000000000000000000000013',45200,'sarah.m@example.invalid','Client',null,null,'Outlook',current_date-5),
 ('60000000-0000-0000-0000-000000000017',null,null,null,'ATO notice of assessment','email','final',current_date-4,2026,'Inbox/ATO notice of assessment.msg','1414000000000000000000000000000000000000000000000000000000000014',61000,'noreply@ato.example.invalid','ATO',null,null,'Outlook',current_date-4),
 ('60000000-0000-0000-0000-000000000018','20000000-0000-0000-0000-000000000004',null,'30000000-0000-0000-0000-000000000006','Engagement letter 2026','letter','final',current_date-90,2026,'Clients/Sarah Mitchell/2026/Engagement/Engagement 2026.pdf','1515000000000000000000000000000000000000000000000000000000000015',150000,null,'Practice',null,null,'Leo Grant',current_date-90),
 ('60000000-0000-0000-0000-000000000019','20000000-0000-0000-0000-000000000003',null,'30000000-0000-0000-0000-000000000009','Director passport and Companies Office extract','scan','final',current_date-500,2025,'Clients/Kowhai Orchards Ltd/Identity/ID pack.pdf','1616000000000000000000000000000000000000000000000000000000000016',520000,null,'Client',null,null,'Leo Grant',current_date-500)
 on conflict do nothing;

insert into requests(id,client_id,job_id,item,category_id,requested_on,due_on,chases,last_chased_on,status,document_id,closed_on) values
 ('70000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','Westpac statements January to June 2026','30000000-0000-0000-0000-000000000004',current_date-21,current_date-7,1,current_date-10,'open',null,null),
 ('70000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','Vehicle loan statement at 30 June','30000000-0000-0000-0000-000000000004',current_date-21,current_date-2,0,null,'open',null,null),
 ('70000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','Westpac statements July to December 2025','30000000-0000-0000-0000-000000000004',current_date-45,current_date-31,0,null,'received','60000000-0000-0000-0000-000000000002',current_date-30),
 ('70000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000005','50000000-0000-0000-0000-000000000006','Contribution notices and fund bank statement','30000000-0000-0000-0000-000000000004',current_date-3,current_date+5,0,null,'open',null,null),
 ('70000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000003','Trust deed and trustee resolution','30000000-0000-0000-0000-000000000004',current_date-14,current_date-1,0,null,'open',null,null)
 on conflict do nothing;

insert into signatures(id,document_id,signer,email,method,sent_on,signed_on) values
 ('80000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000004','Sarah Mitchell','sarah.m@example.invalid','e-signature',current_date-10,null) on conflict do nothing;

insert into engagements(id,client_id,service,document_id,signed_on,review_on) values
 ('90000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Annual compliance','60000000-0000-0000-0000-000000000001',current_date-400,current_date-35),
 ('90000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','BAS','60000000-0000-0000-0000-000000000001',current_date-400,current_date-35),
 ('90000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000004','Tax compliance','60000000-0000-0000-0000-000000000018',current_date-90,current_date+275),
 ('90000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000003','Annual compliance',null,current_date-200,current_date+165),
 ('90000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000005','SMSF compliance',null,current_date-150,current_date+215),
 ('90000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000006','Annual compliance',null,current_date-300,current_date+65)
 on conflict do nothing;

insert into templates(id,code,name,body) values
 ('a0000000-0000-0000-0000-000000000001','REQUEST','Information request',E'Hi {{client}},\n\nTo finish {{job}} we still need:\n\n{{outstanding}}\n\nYou can reply to this email with the files attached.\n\nThanks,\n{{manager}}\n'),
 ('a0000000-0000-0000-0000-000000000002','ENGAGE','Engagement letter',E'{{client}}\n\nEngagement for {{service}}\n\nThis letter sets out the terms on which {{practice}} will provide {{service}} to {{client}}. [Partner to complete scope, responsibilities, fees and limitation of liability.]\n\nPartner: {{partner}}\n'),
 ('a0000000-0000-0000-0000-000000000003','SIGN','Documents ready to sign',E'Hi {{client}},\n\n{{job}} is ready for your review and signature. Please read it, check the figures and sign where marked.\n\nThanks,\n{{manager}}\n')
 on conflict do nothing;

insert into activity(id,client_id,body,author) values
 ('b0000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Phoned about the missing loan statement; bookkeeper away until Monday','Daniel Price'),
 ('b0000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','New trust client: identity pack for trustees and beneficial owners requested','Leo Grant')
 on conflict do nothing;
