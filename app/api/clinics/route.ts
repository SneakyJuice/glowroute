import { NextRequest, NextResponse } from 'next/server'
import { fetchAllClinicsFromSupabase } from '@/data/supabase-clinics'
import { DirectoryQueryError, parseDirectoryQuery, searchDirectory } from '@/lib/directory-search'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const query = parseDirectoryQuery(request.nextUrl.searchParams)
    const pool = await fetchAllClinicsFromSupabase()
    return NextResponse.json(searchDirectory(pool, query), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof DirectoryQueryError) return NextResponse.json({ error: error.message }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
    console.error('[/api/clinics] Directory unavailable', error)
    return NextResponse.json({ error: 'Clinic directory is temporarily unavailable. Please try again.' }, { status: 503, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } })
  }
}
