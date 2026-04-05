import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Client-side Supabase client with anon key.
 * Use in browser components, hooks, and client-side data fetching.
 */
export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set — client queries disabled')
    return null
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  })
}

/**
 * Server-side Supabase client with service role key.
 * Only use in API routes — never expose to client.
 * Returns null if env vars are not configured (graceful degradation).
 */
export function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[supabase] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — DB writes skipped')
    return null
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })
}

export type ClinicPlan = 'free' | 'basic' | 'pro'

export interface ClinicSubscription {
  plan: ClinicPlan
  stripe_customer_id: string
  subscription_id: string
  claimed_at: string
}