import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(req: Request) {
  try {
    const { to, cc, message, reportTitle, reportUrl } = await req.json()

    if (!to || !reportTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!resend) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 503 })
    }

    const ccList = cc ? [cc] : []

    await resend.emails.send({
      from: 'GlowRoute Intelligence <intelligence@glowroute.io>',
      to: [to],
      cc: ccList,
      subject: `GlowRoute Intelligence: ${reportTitle}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #2C2C2C;">
          <div style="background: #0D0D0D; padding: 24px 32px; border-radius: 8px 8px 0 0;">
            <span style="color: #C9A96E; font-size: 22px; font-weight: 700; letter-spacing: 1px;">GLOW<span style="color: white;">ROUTE</span></span>
            <div style="color: rgba(255,255,255,0.5); font-size: 11px; letter-spacing: 2px; margin-top: 4px; text-transform: uppercase;">Intelligence</div>
          </div>
          <div style="background: white; padding: 32px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="font-size: 20px; color: #0D0D0D; margin: 0 0 16px;">${reportTitle}</h2>
            <div style="white-space: pre-wrap; font-size: 15px; line-height: 1.7; color: #444; margin-bottom: 24px;">${message}</div>
            <a href="${reportUrl}" style="display: inline-block; background: #4A6741; color: white; text-decoration: none; padding: 12px 24px; border-radius: 100px; font-size: 14px; font-weight: 600;">Read Full Report →</a>
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 11px; color: #999; line-height: 1.6;">
              This report is for informational purposes only and does not constitute medical, legal, or financial advice.
              © 2026 GlowRoute / <a href="https://sovereign-hq.com" style="color: #999;">Sovereign-HQ.com</a>. All rights reserved.
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[share-insight]', err)
    return NextResponse.json({ error: 'Send failed' }, { status: 500 })
  }
}
