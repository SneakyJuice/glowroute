import { NextRequest, NextResponse } from 'next/server';
import { appendLead } from '@/lib/claims';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, bloodwork_partner, referral_source } = body;

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const lead = appendLead({
      name: name || 'Anonymous',
      email,
      treatment: bloodwork_partner ? `Bloodwork: ${bloodwork_partner}` : 'Bloodwork page',
      clinic_slug: undefined,
      clinic_name: 'GlowRoute Bloodwork',
      quiz_outcome: `bloodwork_${bloodwork_partner || 'unknown'}`,
      notes: referral_source ? `Source: ${referral_source}` : undefined,
    });

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (error) {
    console.error('Failed to save bloodwork lead:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
