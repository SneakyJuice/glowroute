import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type BrandKey = string;
const BRAND_MAP: Record<BrandKey, string> = {
  'Hormone Optimization + Male':   '/telehealth/hone-health',
  'Hormone Optimization + Female': '/telehealth/winona',
  'Weight Loss':                   '/telehealth/henry-meds',
  'Peptide Therapy':               '/telehealth/defy-medical',
  'Sexual Health + Male':          '/telehealth/hims',
  'Sexual Health + Female':        '/telehealth/ro-health',
  'Longevity & Anti-Aging':        '/telehealth/nuvation-health',
  "Women's Health":                '/telehealth/winona',
  'default':                       '/telehealth',
};

function getMatchedSlug(goal: string, sex: string | null): string {
  if (sex && sex !== 'Prefer not to say') {
    const key = `${goal} + ${sex}`;
    if (BRAND_MAP[key]) return BRAND_MAP[key];
  }
  if (BRAND_MAP[goal]) return BRAND_MAP[goal];
  return BRAND_MAP['default'];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { goal, sex, age, budget, zip } = body;

    if (!goal || !age || !budget || !zip) {
      return NextResponse.json({ redirect_url: '/telehealth' }, { status: 200 });
    }

    const matchedSlug = getMatchedSlug(goal, sex);
    const affiliateSlug = matchedSlug.split('/').pop() || '';

    // Map quiz fields to patient_leads table schema
    // The table has comprehensive schema from migration SQL
    const leadData = {
      // Basic info (required fields from table)
      email: `quiz_${Date.now()}@placeholder.glowroute.io`, // Placeholder since quiz doesn't collect email
      source: 'quiz',
      
      // Map quiz answers to table columns
      primary_concern: goal,
      zip: zip,
      
      // Map budget values to budget_range enum
      budget_range: mapBudgetToRange(budget),
      
      // Store other quiz data in quiz_payload JSON for future use
      quiz_payload: {
        goal,
        sex: sex === 'Prefer not to say' ? null : sex,
        age,
        budget,
        affiliate_slug: affiliateSlug,
        matched_telehealth_slug: matchedSlug
      },
      
      // Routing info
      routing_notes: `Quiz match: ${affiliateSlug}`,
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert lead — non-blocking, never fails the redirect
    try {
      await supabase.from('patient_leads').insert([leadData]);
    } catch (err) {
      console.error('[quiz] Supabase insert failed:', err);
    }

    return NextResponse.json({ redirect_url: matchedSlug }, { status: 200 });

  } catch (error) {
    console.error('[quiz] API error:', error);
    return NextResponse.json({ redirect_url: '/telehealth' }, { status: 200 });
  }
}

// Helper to map quiz budget values to budget_range enum
// Quiz has monthly telehealth budget, table has aesthetic treatment budget ranges
// Store raw in quiz_payload, use 'not_sure' for budget_range
function mapBudgetToRange(budget: string): string {
  // Try to map if there's a clear correspondence
  const mapping: Record<string, string> = {
    'Under $100': 'under_500',  // Rough mapping
    '$100-$200': 'under_500',
    '$200-$400': '500_1500',
    '$400+': '1500_3000',
    'under_500': 'under_500',
    '500_1500': '500_1500', 
    '1500_3000': '1500_3000',
    '3000_plus': '3000_plus',
    'not_sure': 'not_sure'
  };
  return mapping[budget] || 'not_sure';
}
