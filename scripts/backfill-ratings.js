#!/usr/bin/env node
/**
 * Backfill real GMB rating + review_count from clinics_data.json → Supabase
 * Matches by slug (most reliable key)
 */

const { createClient } = require('@supabase/supabase-js')
const clinicsData = require('../clinics_data.json')

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addReviewCountColumn() {
  // Add review_count column if missing (ignore error if it already exists)
  const { error } = await sb.rpc('exec_sql', {
    sql: 'ALTER TABLE clinics ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;'
  }).catch(() => ({ error: 'rpc not available' }))
  
  if (error) {
    // Try direct SQL via REST
    console.log('Note: review_count column may need to be added manually in Supabase dashboard')
    console.log('SQL to run: ALTER TABLE clinics ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;')
  }
}

async function backfill() {
  const withRating = clinicsData.filter(c => c.rating && c.rating > 0)
  console.log(`Found ${withRating.length} records with real ratings to backfill`)

  let updated = 0
  let notFound = 0
  const batchSize = 50

  for (let i = 0; i < withRating.length; i += batchSize) {
    const batch = withRating.slice(i, i + batchSize)
    
    await Promise.all(batch.map(async (clinic) => {
      const slug = (clinic.slug || '').replace(/^\/+/, '')
      if (!slug) return

      const reviewCount = clinic.reviews || 0
      // glow_score: normalize rating (0-5 scale) to match existing data
      const glowScore = clinic.rating || 0

      const { error } = await sb
        .from('clinics')
        .update({
          glow_score: glowScore,
          review_count: reviewCount,
        })
        .eq('slug', slug)

      if (error) {
        // Try without review_count if column doesn't exist
        await sb.from('clinics').update({ glow_score: glowScore }).eq('slug', slug)
        notFound++
      } else {
        updated++
      }
    }))

    if (i % 500 === 0) {
      console.log(`Progress: ${Math.min(i + batchSize, withRating.length)}/${withRating.length} (updated: ${updated})`)
    }
  }

  console.log(`\nDone. Updated: ${updated} | Not matched: ${notFound}`)
}

async function main() {
  console.log('Step 1: Backfilling glow_score from real GMB ratings...')
  await backfill()
  
  // Verify
  const { count: withScore } = await sb.from('clinics').select('*', { count: 'exact', head: true }).gt('glow_score', 0)
  console.log(`\nVerification: ${withScore} clinics now have glow_score > 0`)
}

main().catch(console.error)
