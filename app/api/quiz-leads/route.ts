import { NextRequest, NextResponse } from 'next/server';
import { appendLead } from '@/lib/claims';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, answers, quiz_outcome, goal, conditions } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
    }

    const lead = appendLead({
      name,
      email,
      treatment: goal || (answers ? JSON.stringify(answers) : 'Quiz lead'),
      clinic_slug: undefined,
      clinic_name: 'GlowRoute Quiz',
      // quiz_outcome stored in treatment field
      notes: conditions?.length ? `Conditions: ${conditions.join(', ')}` : undefined,
    });

    return NextResponse.json({ success: true, leadId: lead.id, route: quiz_outcome });
  } catch (error) {
    console.error('Failed to save quiz lead:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
