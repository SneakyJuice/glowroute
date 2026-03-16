import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, clinicName, message } = body

  if (!name || !email || !clinicName) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY

  if (apiKey) {
    try {
      // Internal notification to team
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'GlowRoute <noreply@glowroute.io>',
          to: ['leads@glowroute.io'],
          subject: `New Lead: ${clinicName}`,
          html: `
            <h2>New Lead from GlowRoute</h2>
            <p><strong>Clinic:</strong> ${clinicName}</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
          `,
        }),
      })

      // Auto-response to visitor
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'GlowRoute <noreply@glowroute.io>',
          to: [email],
          subject: `We got your message — a GlowRoute partner will be in touch`,
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
              <h2 style="color: #b45e8f;">Hi ${name},</h2>
              <p>Thanks for reaching out about <strong>${clinicName}</strong> on GlowRoute.</p>
              <p>Your inquiry has been sent directly to the clinic. You can typically expect a response within 1–2 business days.</p>
              <p>In the meantime, feel free to explore more wellness options near you at <a href="https://glowroute.sealey.ai" style="color: #b45e8f;">GlowRoute</a>.</p>
              <br/>
              <p style="color: #666;">— The GlowRoute Team</p>
            </div>
          `,
        }),
      })
    } catch (err) {
      console.error('[lead] Failed to send email:', err)
    }
  } else {
    console.log('[lead]', { name, email, clinicName, message })
  }

  return NextResponse.json({ success: true })
}
