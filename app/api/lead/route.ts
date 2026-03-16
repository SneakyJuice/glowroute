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
      const res = await fetch('https://api.resend.com/emails', {
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

      if (!res.ok) {
        const error = await res.text()
        console.error('[lead] Resend error:', error)
      }
    } catch (err) {
      console.error('[lead] Failed to send email:', err)
    }
  } else {
    console.log('[lead]', { name, email, clinicName, message })
  }

  return NextResponse.json({ success: true })
}
