import { appendLead } from '@/lib/claims';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, answers } = body;

  const lead = {
    name,
    email,
    answers,
    timestamp: new Date().toISOString(),
  };

  try {
    await appendLead(lead, '/data/quiz-leads.json');
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Failed to save lead:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal Server Error' }), { status: 500 });
  }
}