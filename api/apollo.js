const B='https://api.apollo.io/api/v1';
const E={
people_enrichment:['POST','/people/match'],bulk_people_enrichment:['POST','/people/bulk_match'],
org_enrichment:['GET','/organizations/enrich'],bulk_org_enrichment:['POST','/organizations/bulk_enrich'],
people_search:['POST','/mixed_people/search'],organization_search:['POST','/mixed_companies/search'],
org_job_postings:['GET','/organizations/{id}/job_postings'],org_info:['GET','/organizations/{id}'],
news_search:['POST','/news/search'],
create_account:['POST','/accounts'],update_account:['PATCH','/accounts/{id}'],
bulk_create_accounts:['POST','/accounts/bulk_create'],search_accounts:['POST','/accounts/search'],
view_account:['GET','/accounts/{id}'],list_account_stages:['GET','/account_stages'],
create_contact:['POST','/contacts'],update_contact:['PATCH','/contacts/{id}'],
bulk_create_contacts:['POST','/contacts/bulk_create'],search_contacts:['POST','/contacts/search'],
view_contact:['GET','/contacts/{id}'],list_contact_stages:['GET','/contact_stages'],
create_deal:['POST','/deals'],list_deals:['GET','/deals'],view_deal:['GET','/deals/{id}'],
update_deal:['PATCH','/deals/{id}'],list_deal_stages:['GET','/deal_stages'],
search_sequences:['POST','/emailer_campaigns/search'],
add_to_sequence:['POST','/emailer_campaigns/{id}/add_contact_ids'],
create_task:['POST','/tasks'],search_tasks:['POST','/tasks/search'],
api_usage:['POST','/usage'],list_users:['GET','/users'],
list_email_accounts:['GET','/email_accounts'],list_lists:['GET','/labels'],
};
export default async function handler(req,res){
res.setHeader('Access-Control-Allow-Origin','*');
res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,PUT,OPTIONS');
res.setHeader('Access-Control-Allow-Headers','Content-Type');
if(req.method==='OPTIONS')return res.status(200).end();
try{
const body=typeof req.body==='string'?JSON.parse(req.body):(req.body||{});
const key=body.api_key||req.query.api_key||process.env.APOLLO_KEY||'';
const action=body.action||req.query.action||'people_search';
if(!key)return res.json({error:'api_key kerak'});
const ep=E[action];
if(!ep)return res.json({error:'Noma\'lum: '+action,available:Object.keys(E)});
let url=B+ep[1];
if(body.id)url=url.replace('{id}',body.id);
const p={...body};delete p.action;delete p.api_key;delete p.id;
if(ep[0]==='GET'){const q=new URLSearchParams();Object.keys(p).forEach(k=>{if(p[k]!=null)q.append(k,p[k]);});const s=q.toString();if(s)url+='?'+s;}
const o={method:ep[0],headers:{'Content-Type':'application/json','Cache-Control':'no-cache','x-api-key':key,'accept':'application/json'}};
if(['POST','PATCH','PUT'].includes(ep[0]))o.body=JSON.stringify({...p,api_key:key});
const r=await fetch(url,o);const d=await r.json();
res.json({...d,_action:action,_status:r.status});
}catch(e){res.json({error:e.message});}
}
