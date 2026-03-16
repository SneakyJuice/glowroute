import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { clinicName, yourName, email, phone, role } = body

  if (!clinicName || !yourName || !email) {
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
          to: ['claims@glowroute.io'],
          subject: `Claim Request: ${clinicName}`,
          html: `
            <h2>New Claim Request</h2>
            <p><strong>Clinic:</strong> ${clinicName}</p>
            <p><strong>Name:</strong> ${yourName}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            ${role ? `<p><strong>Role:</strong> ${role}</p>` : ''}
          `,
        }),
      })

      // Auto-response to practice owner
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'GlowRoute <noreply@glowroute.io>',
          to: [email],
          subject: `Your GlowRoute listing claim is under review`,
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
              <h2 style="color: #b45e8f;">Hi ${yourName},</h2>
              <p>We received your request to claim <strong>${clinicName}</strong> on GlowRoute.</p>
              <p>Our team will verify your ownership and follow up within <strong>1–2 business days</strong> to walk you through next steps — including how to update your profile, manage your listing, and unlock premium placement options.</p>
              <p>Questions in the meantime? Just reply to this email.</p>
              <br/>
              <p style="color: #666;">— The GlowRoute Team</p>
            </div>
          `,
        }),
      })
    } catch (err) {
      console.error('[claim] Failed to send emails:', err)
    }
  } else {
    console.log('[claim]', { clinicName, yourName, email, phone, role })
  }

  return NextResponse.json({ success: true })
}
