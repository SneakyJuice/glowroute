import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
for (const line of readFileSync('.env.local','utf8').split('\n')) { const m=line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if(m) process.env[m[1]]=m[2].replace(/^[\x27"]|[\x27"]$/g,'') }
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const ids = JSON.parse(readFileSync('/tmp/national_clean_ids.json','utf8'))
console.log('flipping', ids.length, 'clinics hidden -> visible')

// SNAPSHOT current state of these rows (reversible backup)
const snap=[]; for(let i=0;i<ids.length;i+=500){ const {data}=await sb.from('clinics').select('id,visibility').in('id',ids.slice(i,i+500)); snap.push(...(data||[])) }
const stamp=new Date().toISOString().replace(/[:.]/g,'-')
writeFileSync('/tmp/flip-backup-'+stamp+'.json', JSON.stringify(snap,null,2))
console.log('backup saved: /tmp/flip-backup-'+stamp+'.json ('+snap.length+' rows, all were:', [...new Set(snap.map(r=>r.visibility))].join('/')+')')

// FLIP in batches
let updated=0
for(let i=0;i<ids.length;i+=500){
  const batch=ids.slice(i,i+500)
  const {error,count}=await sb.from('clinics').update({visibility:'visible'},{count:'exact'}).in('id',batch)
  if(error){console.log('ERR batch',i,error.message);process.exit(1)}
  updated+=count||batch.length
  process.stdout.write('  updated '+updated+'/'+ids.length+'\r')
}
console.log('\nDONE updated:', updated)

// VERIFY new counts
const c=async b=>{const {count}=await b;return count}
console.log('=== post-flip counts ===')
console.log('visible:', await c(sb.from('clinics').select('*',{count:'exact',head:true}).eq('visibility','visible')))
console.log('hidden:', await c(sb.from('clinics').select('*',{count:'exact',head:true}).eq('visibility','hidden')))
