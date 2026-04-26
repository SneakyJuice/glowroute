import fs from 'fs'
import path from 'path'
import type { PlanKey } from './stripe'

const CLAIMS_FILE = path.join(process.cwd(), 'data', 'claims.json')
const LEADS_FILE = path.join(process.cwd(), 'data', 'leads.json')

export interface Claim {
  slug: string
  tier: PlanKey
  stripe_customer_id: string
  subscription_id: string
  email: string
  owner_name?: string
  clinic_name?: string
  claimed_at: string
}

export interface Lead {
  id: string
  clinic_slug?: string
  clinic_name?: string
  name: string
  email: string
  phone?: string
  treatment?: string
  quiz_outcome?: string
  notes?: string
  created_at: string
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T
  } catch {
    return fallback
  }
}

function writeJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8')
}

// ── Claims ────────────────────────────────────────────────────────────────────
export function getClaims(): Claim[] {
  return readJson<Claim[]>(CLAIMS_FILE, [])
}

export function getClaimBySlug(slug: string): Claim | undefined {
  return getClaims().find(c => c.slug === slug)
}

export function upsertClaim(claim: Claim) {
  const claims = getClaims().filter(c => c.slug !== claim.slug)
  claims.unshift(claim)
  writeJson(CLAIMS_FILE, claims)
}

// ── Leads ─────────────────────────────────────────────────────────────────────
export function getLeads(): Lead[] {
  return readJson<Lead[]>(LEADS_FILE, [])
}

export function appendLead(lead: Omit<Lead, 'id' | 'created_at'>): Lead {
  const leads = getLeads()
  const newLead: Lead = {
    ...lead,
    id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
  }
  leads.unshift(newLead)
  writeJson(LEADS_FILE, leads)
  return newLead
}
