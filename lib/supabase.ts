import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/** Bound every PostgREST call so a saturated pool cannot hold a render open. */
export const SUPABASE_FETCH_TIMEOUT_MS = 8_000

export function supabaseFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const timeout = AbortSignal.timeout(SUPABASE_FETCH_TIMEOUT_MS)
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout
  return fetch(input, { ...init, signal })
}

function createSupabase(key: string) {
  return createClient(supabaseUrl as string, key, {
    auth: { persistSession: false },
    global: { fetch: supabaseFetch },
  })
}

/**
 * Client-side Supabase client with anon key.
 * Use in browser components, hooks, and client-side data fetching.
 */
export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set — client queries disabled')
    return null
  }
  return createSupabase(supabaseAnonKey)
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
  return createSupabase(supabaseServiceKey)
}

export type ClinicPlan = 'free' | 'basic' | 'pro'
/** Directory reads need no write credentials; public column grants and RLS apply. */
export function getSupabaseReadClient() {
  return getSupabaseClient() ?? getSupabaseAdmin()
}

export interface ClinicSubscription {
  plan: ClinicPlan
  stripe_customer_id: string
  subscription_id: string
  claimed_at: string
}
