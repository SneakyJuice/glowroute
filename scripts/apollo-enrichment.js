#!/usr/bin/env node
/**
 * T-11: Apollo.io contact enrichment — Tier 1 & 2 clinics
 * Finds owner/medical director name + email for each clinic via Apollo People Search
 *
 * Usage:
 *   node scripts/apollo-enrichment.js --tier 1         # Tier 1 only
 *   node scripts/apollo-enrichment.js --tier 2         # Tier 2 only
 *   node scripts/apollo-enrichment.js --all            # Both tiers
 *   node scripts/apollo-enrichment.js --all --dry-run  # Preview
 *   node scripts/apollo-enrichment.js --limit 50       # First N clinics
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const files = [
    path.join(__dirname, '../.env.local'),
    path.join(process.env.HOME, '.openclaw/workspace/.keys.env'),
  ];
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
      const m = line.match(/^(?:export\s+)?([A-Z_0-9]+)=['"]?([^'"]+)['"]?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://psiuknphchmhsthvhkpt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APOLLO_KEY   = process.env.APOLLO_API_KEY;

const args     = process.argv.slice(2);
const TIER     = args.includes('--tier') ? args[args.indexOf('--tier') + 1] : null;
const ALL      = args.includes('--all') || !TIER;
const DRY_RUN  = args.includes('--dry-run');
const LIMIT    = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 9999;

if (!SUPABASE_KEY) { console.error('❌ SUPABASE_SERVICE_ROLE_KEY missing'); process.exit(1); }
if (!APOLLO_KEY)   { console.error('❌ APOLLO_API_KEY missing'); process.exit(1); }

// ── HTTP ──────────────────────────────────────────────────────────────────────
function request(method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method,
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'GlowRoute/1.0', ...headers,
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}) },
      timeout: 15000,
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Supabase ──────────────────────────────────────────────────────────────────
async function fetchTierClinics(tier) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/clinics`);
  // Note: apollo_enriched_at column may not exist yet — add via Supabase dashboard if needed
  url.searchParams.set('visibility', 'eq.visible');
  url.searchParams.set('select', 'id,name,city,state,website,phone,glow_score,review_count');
  url.searchParams.set('limit', String(LIMIT));

  if (tier === '1') {
    url.searchParams.set('glow_score', 'eq.5');
    url.searchParams.set('review_count', 'gte.100');
  } else if (tier === '2') {
    url.searchParams.set('glow_score', 'gte.4');
    url.searchParams.set('review_count', 'gte.50');
  } else {
    url.searchParams.set('glow_score', 'gte.4');
    url.searchParams.set('review_count', 'gte.50');
  }
  url.searchParams.set('order', 'review_count.desc');

  const res = await request('GET', url.toString(), null, {
    'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`
  });
  return JSON.parse(res.body || '[]');
}

async function updateClinicContact(id, data) {
  if (DRY_RUN) return true;
  const res = await request('PATCH',
    `${SUPABASE_URL}/rest/v1/clinics?id=eq.${id}`,
    { ...data, apollo_enriched_at: new Date().toISOString() },
    { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=minimal' }
  );
  return res.status < 300;
}

// ── Apollo People Search ──────────────────────────────────────────────────────
function extractDomain(website) {
  if (!website) return null;
  try {
    // Strip UTM params and clean URL first
    const clean = website.split('?')[0].split('#')[0].trim();
    const url = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
    return url.hostname.replace(/^www\./, '');
  } catch { return null; }
}

const OWNER_TITLES = ['owner','founder','medical director','CEO','president','director','practice manager','physician','doctor','nurse practitioner','pa-c','aesthetic director'];

async function findContact(clinic) {
  const domain = extractDomain(clinic.website);
  if (!domain) return null;

  try {
    // Step 1: Org enrichment → get org ID + phone
    const orgRes = await request('GET',
      `https://api.apollo.io/api/v1/organizations/enrich?domain=${encodeURIComponent(domain)}`,
      null,
      { 'X-Api-Key': APOLLO_KEY, 'Content-Type': 'application/json' }
    );
    if (orgRes.status !== 200) return null;
    const orgData = JSON.parse(orgRes.body);
    const orgId = orgData?.organization?.id;
    const orgPhone = orgData?.organization?.phone || null;
    if (!orgId) return null;

    // Step 2: Search for people at org (redacted list, pick best title)
    const searchRes = await request('POST',
      'https://api.apollo.io/api/v1/mixed_people/api_search',
      { organization_ids: [orgId], per_page: 5 },
      { 'X-Api-Key': APOLLO_KEY, 'Content-Type': 'application/json' }
    );
    if (searchRes.status !== 200) return null;
    const searchData = JSON.parse(searchRes.body);
    const people = searchData?.people || [];
    if (!people.length) return null;

    // Pick best contact by title priority
    const ranked = [...people].sort((a, b) => {
      const aScore = OWNER_TITLES.findIndex(t => (a.title||'').toLowerCase().includes(t));
      const bScore = OWNER_TITLES.findIndex(t => (b.title||'').toLowerCase().includes(t));
      return (aScore === -1 ? 99 : aScore) - (bScore === -1 ? 99 : bScore);
    });
    const best = ranked[0];

    // Step 3: Reveal/unlock the contact (costs 1 credit — only for best match)
    const revealRes = await request('POST',
      'https://api.apollo.io/api/v1/people/match',
      {
        id: best.id,
        reveal_personal_emails: true,
        reveal_phone_number: false,
      },
      { 'X-Api-Key': APOLLO_KEY, 'Content-Type': 'application/json' }
    );
    if (revealRes.status !== 200) return null;
    const revealData = JSON.parse(revealRes.body);
    const person = revealData?.person || best;

    const fullName = person.name ||
      [person.first_name, person.last_name].filter(Boolean).join(' ') || null;

    return {
      contact_name:     fullName,
      contact_email:    person.email || null,
      contact_title:    person.title || best.title || null,
      contact_linkedin: person.linkedin_url || null,
      contact_phone:    person.sanitized_phone || orgPhone,
    };
  } catch { return null; }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🎯 Apollo Contact Enrichment — GlowRoute Tier 1 & 2');
  console.log(`Tier: ${TIER || 'All'} | Dry run: ${DRY_RUN} | Limit: ${LIMIT}`);
  console.log('');

  const tiers = TIER ? [TIER] : ['1', '2'];
  let allClinics = [];

  for (const t of tiers) {
    const clinics = await fetchTierClinics(t);
    console.log(`Tier ${t}: ${clinics.length} unenriched clinics`);
    allClinics.push(...clinics.map(c => ({ ...c, tier: t })));
  }

  // Deduplicate if all tiers fetched
  if (!TIER) {
    const seen = new Set();
    allClinics = allClinics.filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id); return true;
    });
  }

  console.log(`\nTotal to process: ${allClinics.length}`);
  if (allClinics.length === 0) { console.log('✅ All clinics already enriched!'); return; }

  let found = 0, notFound = 0, errors = 0;
  const log = [];

  for (let i = 0; i < allClinics.length; i++) {
    const clinic = allClinics[i];
    process.stdout.write(`[${i+1}/${allClinics.length}] ${clinic.name} (${clinic.city})... `);

    try {
      const contact = await findContact(clinic);
      if (contact?.contact_name) {
        if (!DRY_RUN) await updateClinicContact(clinic.id, contact);
        console.log(`✅ ${contact.contact_name} <${contact.contact_email || 'no email'}>`);
        log.push({ ...clinic, ...contact });
        found++;
      } else {
        console.log(`— no contact found`);
        if (!DRY_RUN) await updateClinicContact(clinic.id, {}); // mark as attempted
        notFound++;
      }
    } catch (err) {
      console.log(`❌ ${err.message}`);
      errors++;
    }

    // Rate limit: Apollo allows ~200 req/min on paid plans
    await new Promise(r => setTimeout(r, 350));
  }

  // Save enriched CSV
  const csvPath = path.join(__dirname, '../output/tier1-tier2-enriched.csv');
  if (log.length > 0) {
    const headers = 'tier,name,city,state,website,glow_score,review_count,contact_name,contact_email,contact_title,contact_linkedin';
    const rows = log.map(c => [
      c.tier,
      `"${(c.name||'').replace(/"/g,'""')}"`,
      c.city||'', c.state||'', c.website||'',
      c.glow_score||'', c.review_count||'',
      `"${(c.contact_name||'').replace(/"/g,'""')}"`,
      c.contact_email||'', c.contact_title||'', c.contact_linkedin||''
    ].join(','));
    fs.writeFileSync(csvPath, headers + '\n' + rows.join('\n'));
    console.log(`\n📝 Enriched CSV: ${csvPath}`);
  }

  console.log('\n════════════════════════════════');
  console.log(`✅ Contacts found:  ${found}`);
  console.log(`— Not found:        ${notFound}`);
  console.log(`❌ Errors:          ${errors}`);
  console.log(`📊 Hit rate:        ${Math.round(found/(found+notFound)*100)||0}%`);
  if (DRY_RUN) console.log('\n(Dry run — no Supabase writes)');
  console.log('════════════════════════════════\n');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
