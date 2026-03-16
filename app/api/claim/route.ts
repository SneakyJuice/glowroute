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
      // Team notification
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'GlowRoute <noreply@glowroute.io>',
          to: ['leads@glowroute.io'],
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

      // Claimant confirmation
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'GlowRoute <noreply@glowroute.io>',
          to: [email],
          subject: `Your claim for ${clinicName} is being reviewed`,
          html: `
            <h2>Thanks, ${yourName}!</h2>
            <p>We received your request to claim <strong>${clinicName}</strong> on GlowRoute.</p>
            <p>Our team will verify your ownership and reach out within 1–2 business days.</p>
            <p>If you have any questions, reply to this email.</p>
            <br/>
            <p>— The GlowRoute Team</p>
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
