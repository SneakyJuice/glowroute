#!/usr/bin/env node
/**
 * WF-07: Apollo Contact Enrichment (v2)
 * 3-step flow: org enrich by domain → people search by orgId → reveal best contact
 * Targets clinics where apollo_enriched_at IS NULL AND website IS NOT NULL
 * 
 * Usage:
 *   node wf-07-apollo-enrich.js --test              # 5 clinics, no writes
 *   node wf-07-apollo-enrich.js --batch 100         # live run
 *   node wf-07-apollo-enrich.js --batch 100 --offset 200  # resume
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load env from .keys.env
function loadEnv() {
  const files = [
    path.join(process.env.HOME, '.openclaw/workspace/.keys.env'),
    path.join(__dirname, '../.env.local'),
  ];
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
      const m = line.match(/^(?:export\s+)?([A-Z_][A-Z_0-9]*)=['"']?([^'"'\n]+)['"']?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  }
}
loadEnv();

const APOLLO_KEY = process.env.APOLLO_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://psiuknphchmhsthvhkpt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!APOLLO_KEY || !SUPABASE_KEY) {
  console.error('Missing: APOLLO_API_KEY and/or SUPABASE_SERVICE_ROLE_KEY'); process.exit(1);
}

const args = process.argv.slice(2);
const TEST = args.includes('--test');
const BATCH = parseInt((args[args.indexOf('--batch')+1]) || '100');
const OFFSET = parseInt((args[args.indexOf('--offset')+1]) || '0');
const LIMIT = TEST ? 5 : BATCH;

const OWNER_TITLES = ['owner','founder','ceo','president','medical director','director','practice manager','manager'];

function req(method, url, body, headers={}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = body ? JSON.stringify(body) : null;
    const r = https.request({
      hostname: u.hostname, path: u.pathname+u.search, method,
      headers: { 'Content-Type':'application/json', ...headers,
        ...(payload ? {'Content-Length': Buffer.byteLength(payload)} : {}) },
      timeout: 15000
    }, res => {
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=>resolve({status:res.statusCode, body:JSON.parse(d||'{}')}));
    });
    r.on('error',reject);
    r.on('timeout',()=>{r.destroy();reject(new Error('timeout'));});
    if (payload) r.write(payload);
    r.end();
  });
}

function sleep(ms) { return new Promise(r=>setTimeout(r,ms)); }

function extractDomain(website) {
  try { return new URL(website.startsWith('http')?website:'https://'+website).hostname.replace(/^www\./,''); }
  catch { return null; }
}

async function enrichClinic(clinic) {
  const domain = extractDomain(clinic.website);
  if (!domain) return null;

  // Step 1: Org enrich by domain → get orgId
  const orgRes = await req('POST', 'https://api.apollo.io/api/v1/organizations/enrich',
    {domain}, {'x-api-key': APOLLO_KEY});
  if (orgRes.status !== 200) return null;
  const orgId = orgRes.body?.organization?.id;
  const orgPhone = orgRes.body?.organization?.phone || null;
  if (!orgId) return null;

  // Step 2: People search by orgId
  const peopleRes = await req('POST', 'https://api.apollo.io/api/v1/mixed_people/api_search',
    {organization_ids:[orgId], per_page:5}, {'x-api-key': APOLLO_KEY});
  if (peopleRes.status !== 200) return null;
  const people = peopleRes.body?.people || [];
  if (!people.length) return null;

  // Pick best by title
  const ranked = [...people].sort((a,b)=>{
    const s = t => OWNER_TITLES.findIndex(x=>(t||'').toLowerCase().includes(x));
    return (s(a.title)>=0?s(a.title):99)-(s(b.title)>=0?s(b.title):99);
  });
  const best = ranked[0];

  // Step 3: Reveal contact (costs 1 credit — only in live mode)
  let person = best;
  if (!TEST) {
    const revRes = await req('POST','https://api.apollo.io/api/v1/people/match',
      {id: best.id, reveal_personal_emails:true, reveal_phone_number:false},
      {'x-api-key': APOLLO_KEY});
    if (revRes.status===200) person = revRes.body?.person || best;
  }

  return {
    contact_name: person.name || [person.first_name,person.last_name].filter(Boolean).join(' ') || null,
    contact_email: person.email || null,
    contact_title: person.title || best.title || null,
    contact_phone: person.sanitized_phone || orgPhone || null,
    contact_linkedin: person.linkedin_url || null,
  };
}

async function getClinics() {
  const url = new URL(SUPABASE_URL+'/rest/v1/clinics');
  url.searchParams.set('select','id,name,website');
  url.searchParams.set('apollo_enriched_at','is.null');
  url.searchParams.set('website','not.is.null');
  url.searchParams.set('limit', LIMIT);
  url.searchParams.set('offset', OFFSET);
  const r = await req('GET', url.toString(), null,
    {'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY});
  return r.body;
}

async function updateClinic(id, data) {
  await req('PATCH', SUPABASE_URL+'/rest/v1/clinics?id=eq.'+id,
    {...data, apollo_enriched_at: new Date().toISOString()},
    {'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,
     'Content-Type':'application/json','Prefer':'return=minimal'});
}

async function main() {
  console.log('WF-07 Apollo Enrichment —', TEST?'TEST (no writes)':'LIVE', '| batch:',LIMIT,'offset:',OFFSET);
  const clinics = await getClinics();
  if (!Array.isArray(clinics)) { console.error('Supabase error:', clinics); process.exit(1); }
  console.log('Clinics to process:', clinics.length);

  let enriched=0, skipped=0, errors=0;
  const results = [];

  for (const clinic of clinics) {
    try {
      const contact = await enrichClinic(clinic);
      if (contact?.contact_name) {
        if (!TEST) await updateClinic(clinic.id, contact);
        console.log(' ✅', clinic.name, '→', contact.contact_name, '|', contact.contact_title, '|', contact.contact_email||'no-email');
        enriched++;
        results.push({clinic: clinic.name, ...contact});
      } else {
        console.log(' ⚪', clinic.name, '— no match');
        if (!TEST) await updateClinic(clinic.id, {contact_name:null,contact_email:null,contact_title:null,contact_phone:null});
        skipped++;
      }
    } catch(e) {
      console.error(' ❌', clinic.name+':', e.message);
      errors++;
    }
    await sleep(300);
  }

  const summary = {date:new Date().toISOString(), mode:TEST?'test':'live', offset:OFFSET, processed:clinics.length, enriched, skipped, errors};
  console.log('\nSummary:', enriched,'enriched |', skipped,'skipped |', errors,'errors');
  if (TEST) console.log('Results:', JSON.stringify(results,null,2));

  fs.mkdirSync('data/enrichment',{recursive:true});
  fs.writeFileSync('data/enrichment/WF07-'+new Date().toISOString().split('T')[0]+'-summary.json', JSON.stringify(summary,null,2));
}

main().catch(e=>{console.error('Fatal:',e);process.exit(1);});
