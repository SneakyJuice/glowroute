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

    // Insert lead — non-blocking, never fails the redirect
    try {
      await supabase.from('patient_leads').insert([{
        goal,
        sex: sex === 'Prefer not to say' ? null : sex,
        age_range: age,
        budget,
        zip,
        affiliate_slug: affiliateSlug,
        source: 'quiz',
        created_at: new Date().toISOString()
      }]);
    } catch (err) {
      console.error('[quiz] Supabase insert failed:', err);
    }

    return NextResponse.json({ redirect_url: matchedSlug }, { status: 200 });

  } catch (error) {
    console.error('[quiz] API error:', error);
    return NextResponse.json({ redirect_url: '/telehealth' }, { status: 200 });
  }
}
