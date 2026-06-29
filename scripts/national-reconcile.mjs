import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
for (const line of readFileSync('.env.local','utf8').split('\n')) { const m=line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if(m) process.env[m[1]]=m[2].replace(/^[\x27"]|[\x27"]$/g,'') }
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// placeholder set = any image URL reused >1x table-wide
const allImg=[]; let f=0
while(true){ const {data}=await sb.from('clinics').select('hero_image_url').not('hero_image_url','is',null).range(f,f+999); allImg.push(...data); if(data.length<1000)break; f+=1000 }
const cnt={}; allImg.forEach(r=>cnt[r.hero_image_url]=(cnt[r.hero_image_url]||0)+1)
const placeholders=new Set(Object.entries(cnt).filter(([,n])=>n>1).map(([u])=>u))
console.log('placeholder URLs:', placeholders.size)

// pull ALL hidden rows (paginate)
const hidden=[]; f=0
while(true){ const {data}=await sb.from('clinics').select('id,name,city,state,hero_image_url,review_count,description,visibility').eq('visibility','hidden').range(f,f+999); hidden.push(...data); if(data.length<1000)break; f+=1000 }
console.log('total hidden pulled:', hidden.length)

const hasRealImg = r => r.hero_image_url && !placeholders.has(r.hero_image_url)
const clean = hidden.filter(r => hasRealImg(r) && (r.review_count||0)>=1)
const cleanNoReview = hidden.filter(r => hasRealImg(r) && (r.review_count||0)<1)
const noImgOrPlaceholder = hidden.filter(r => !hasRealImg(r))

console.log('=== NATIONAL CLEAN SET (real image + review>=1) ===')
console.log('  CLEAN total:', clean.length)
const byState={}; clean.forEach(r=>byState[r.state||'?']=(byState[r.state||'?']||0)+1)
console.log('  by state:', JSON.stringify(Object.entries(byState).sort((a,b)=>b[1]-a[1]).slice(0,15)))
console.log('  of clean, has desc>=50:', clean.filter(r=>r.description&&r.description.length>=50).length)
console.log('=== HOLD: real image but 0 reviews:', cleanNoReview.length)
console.log('=== EXCLUDE: no image or placeholder:', noImgOrPlaceholder.length)

writeFileSync('/tmp/national_clean_ids.json', JSON.stringify(clean.map(r=>r.id)))
writeFileSync('/tmp/national_clean_full.json', JSON.stringify(clean,null,2))
console.log('wrote /tmp/national_clean_ids.json ('+clean.length+' ids)')
