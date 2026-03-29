import { Clinic } from '@/types/clinic'
import { fetchAllClinicsFromSupabase, fetchFeaturedClinic, fetchStandardClinics } from './supabase-clinics'

// Re-export these for compatibility, but now backed by Supabase
export const allClinics: Promise<Clinic[]> = fetchAllClinicsFromSupabase()
export const featuredClinic: Promise<Clinic | null> = fetchFeaturedClinic()
export const standardClinics: Promise<Clinic[]> = fetchStandardClinics()
