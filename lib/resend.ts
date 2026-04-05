import { Resend } from 'resend'

let _resend: Resend | null = null

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[resend] RESEND_API_KEY not set — emails skipped')
    return null
  }
  if (!_resend) _resend = new Resend(key)
  return _resend
}

const FROM = 'GlowRoute <noreply@glowroute.io>'
const TEAM_EMAIL = 'hello@glowroute.io'

// ── Lead notification to team / clinic ───────────────────────────────────────
export async function sendLeadEmail(opts: {
  clinicName: string
  clinicEmail?: string
  patientName: string
  patientEmail: string
  patientPhone?: string
  treatment?: string
}) {
  const resend = getResend()
  if (!resend) return

  const to = opts.clinicEmail ?? TEAM_EMAIL
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#1B2A4A;margin-bottom:4px">New Patient Lead — GlowRoute</h2>
      <p style="color:#6B7280;font-size:14px;margin-top:0">Via <strong>${opts.clinicName}</strong> listing</p>
      <hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0"/>
      <table style="width:100%;font-size:14px;color:#374151;border-collapse:collapse">
        <tr><td style="padding:6px 0;font-weight:600;width:120px">Patient</td><td>${opts.patientName}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600">Email</td><td><a href="mailto:${opts.patientEmail}" style="color:#028090">${opts.patientEmail}</a></td></tr>
        ${opts.patientPhone ? `<tr><td style="padding:6px 0;font-weight:600">Phone</td><td>${opts.patientPhone}</td></tr>` : ''}
        ${opts.treatment ? `<tr><td style="padding:6px 0;font-weight:600">Treatment</td><td>${opts.treatment}</td></tr>` : ''}
        <tr><td style="padding:6px 0;font-weight:600">Clinic</td><td>${opts.clinicName}</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0"/>
      <p style="font-size:12px;color:#9CA3AF">Sent by GlowRoute lead routing. <a href="https://glowroute.io" style="color:#028090">glowroute.io</a></p>
    </div>
  `

  try {
    await resend.emails.send({ from: FROM, to, subject: `New Lead: ${opts.patientName} — ${opts.treatment ?? 'Treatment Inquiry'}`, html })
  } catch (e) {
    console.error('[resend] sendLeadEmail failed:', e)
  }
}

// ── Claim welcome email to clinic owner ──────────────────────────────────────
export async function sendClaimWelcomeEmail(opts: {
  ownerName: string
  ownerEmail: string
  clinicName: string
  plan: string
}) {
  const resend = getResend()
  if (!resend) return

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#1B2A4A">Welcome to GlowRoute, ${opts.ownerName}!</h2>
      <p style="color:#374151;font-size:15px;line-height:1.6">
        Your listing for <strong>${opts.clinicName}</strong> has been claimed on the <strong>${opts.plan}</strong> plan.
        Our team will verify your ownership and activate your profile within 1 business day.
      </p>
      <a href="https://glowroute.io/clinics" style="display:inline-block;margin-top:16px;background:#028090;color:#fff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;font-size:14px">
        View Your Listing →
      </a>
      <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0"/>
      <p style="font-size:12px;color:#9CA3AF">Questions? Reply to this email or contact <a href="mailto:hello@glowroute.io" style="color:#028090">hello@glowroute.io</a></p>
    </div>
  `

  try {
    await resend.emails.send({ from: FROM, to: opts.ownerEmail, subject: `You've claimed ${opts.clinicName} on GlowRoute`, html })
    // Also BCC team
    await resend.emails.send({ from: FROM, to: TEAM_EMAIL, subject: `[Claim] ${opts.clinicName} → ${opts.plan}`, html: `<p>New claim: <strong>${opts.clinicName}</strong> by ${opts.ownerName} (${opts.ownerEmail}) on <strong>${opts.plan}</strong> plan.</p>` })
  } catch (e) {
    console.error('[resend] sendClaimWelcomeEmail failed:', e)
  }
}
