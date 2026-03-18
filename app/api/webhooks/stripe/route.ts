import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { upsertClaim } from '@/lib/claims'
import { sendClaimWelcomeEmail } from '@/lib/resend'
import type { PlanKey } from '@/lib/stripe'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = secret && sig
      ? stripe.webhooks.constructEvent(rawBody, sig, secret)
      : (JSON.parse(rawBody) as Stripe.Event)

    if (!secret) console.warn('[webhook] No STRIPE_WEBHOOK_SECRET — skipping signature check')
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Webhook error'
    console.error('[webhook] Signature error:', msg)
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Future: handle plan changes / cancellations
        console.log(`[webhook] ${event.type} received — no handler yet`)
        break
      default:
        console.log(`[webhook] Unhandled: ${event.type}`)
    }
    return NextResponse.json({ received: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Handler error'
    console.error(`[webhook] Error in ${event.type}:`, msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {}
  const clinicSlug  = meta.clinic_slug
  const tier        = meta.tier as PlanKey | undefined
  const ownerEmail  = meta.owner_email ?? session.customer_details?.email ?? ''
  const ownerName   = meta.owner_name  ?? session.customer_details?.name  ?? 'Clinic Owner'
  const clinicName  = meta.clinic_name ?? clinicSlug ?? 'Your Clinic'

  console.log(`[webhook] checkout.completed tier=${tier} clinic=${clinicSlug} email=${ownerEmail}`)

  if (!clinicSlug || !tier) {
    console.warn('[webhook] Missing clinic_slug or tier — skipping claim write')
    return
  }

  const customerId     = typeof session.customer     === 'string' ? session.customer     : session.customer?.id     ?? ''
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? ''

  // 1. Write claim to JSON store
  upsertClaim({
    slug:               clinicSlug,
    tier,
    stripe_customer_id: customerId,
    subscription_id:    subscriptionId,
    email:              ownerEmail,
    owner_name:         ownerName,
    clinic_name:        clinicName,
    claimed_at:         new Date().toISOString(),
  })
  console.log(`[webhook] ✅ Claim written for ${clinicSlug} → ${tier}`)

  // 2. Send welcome email to clinic owner
  if (ownerEmail) {
    await sendClaimWelcomeEmail({ ownerName, ownerEmail, clinicName, plan: tier })
  }
}
