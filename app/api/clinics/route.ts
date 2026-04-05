import { NextRequest, NextResponse } from 'next/server'
import { fetchAllClinicsFromSupabase, fetchFeaturedClinic } from '@/data/supabase-clinics'

/**
 * Trim clinic to only essential fields for homepage listing.
 * Reduces ~1,960 bytes per record to ~400 bytes.
 */
function trimClinic(clinic: any) {
  return {
    id: clinic.id,
    slug: clinic.slug,
    name: clinic.name,
    city: clinic.city,
    state: clinic.state,
    googleRating: clinic.googleRating,
    googleReviewCount: clinic.googleReviewCount,
    imageUrl: clinic.imageUrl,
    verified: clinic.verified,
    distance: clinic.distance,
  }
}

/**
 * GET /api/clinics?page=1&limit=25
 * Returns paginated, field-trimmed clinic data for homepage "Load More" functionality.
 * 
 * Reduces payload from 7.8 MB to ~80-100 KB per request.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 100) // Cap at 100
    
    if (page < 1) {
      return NextResponse.json(
        { error: 'page must be >= 1' },
        { status: 400 }
      )
    }

    const allClinics = await fetchAllClinicsFromSupabase()
    const featured = await fetchFeaturedClinic()
    
    // Exclude featured clinic from standard results
    const standardClinics = featured
      ? allClinics.filter(c => c.id !== featured.id)
      : allClinics

    // Paginate
    const startIdx = (page - 1) * limit
    const endIdx = startIdx + limit
    const paginated = standardClinics.slice(startIdx, endIdx)

    // Trim fields
    const trimmed = paginated.map(trimClinic)

    return NextResponse.json({
      page,
      limit,
      total: standardClinics.length,
      count: trimmed.length,
      data: trimmed,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (err) {
    console.error('[/api/clinics] Error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch clinics' },
      { status: 500 }
    )
  }
}
