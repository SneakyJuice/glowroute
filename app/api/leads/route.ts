import { NextRequest, NextResponse } from 'next/server'
import { appendLead } from '@/lib/claims'
import { sendLeadEmail } from '@/lib/resend'
import { allClinics } from '@/data/all-clinics'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name?: string
      email?: string
      phone?: string
      treatment?: string
      clinicSlug?: string
      message?: string
    }

    const { name, email, phone, treatment, clinicSlug, message } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400 })
    }

    // Look up clinic name for the notification
    const clinic = clinicSlug ? allClinics.find(c => c.slug === clinicSlug) : undefined
    const clinicName = clinic?.name ?? clinicSlug ?? 'GlowRoute Directory'

    // Save lead to JSON store
    const lead = appendLead({ name, email, phone, treatment, clinic_slug: clinicSlug, clinic_name: clinicName })

    // Send email notification (fire-and-forget)
    sendLeadEmail({
      clinicName,
      patientName: name,
      patientEmail: email,
      patientPhone: phone,
      treatment: treatment ?? message,
    }).catch(e => console.error('[leads] Email error:', e))

    return NextResponse.json({ success: true, leadId: lead.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[leads]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
