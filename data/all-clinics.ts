import { Clinic } from '@/types/clinic'
import { fetchAllClinicsFromSupabase, fetchFeaturedClinic, fetchStandardClinics } from './supabase-clinics'

// Functions, not module-level promises, so importing this file does not start a fetch.
export function allClinics(): Promise<Clinic[]> {
  return fetchAllClinicsFromSupabase()
}

export function featuredClinic(): Promise<Clinic | null> {
  return fetchFeaturedClinic()
}

export function standardClinics(): Promise<Clinic[]> {
  return fetchStandardClinics()
}
