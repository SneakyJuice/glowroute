import { NextRequest, NextResponse } from 'next/server'
import { getStripe, PLANS, PlanKey } from '@/lib/stripe'
import { SITE_URL } from '@/lib/config'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { plan, clinicSlug, clinicName, email, ownerName } = body as {
      plan: PlanKey
      clinicSlug?: string
      clinicName?: string
      email?: string
      ownerName?: string
    }

    if (!plan || !PLANS[plan]) {
      return NextResponse.json(
        { error: `Invalid plan. Must be: ${Object.keys(PLANS).join(', ')}` },
        { status: 400 }
      )
    }

    const stripe = getStripe()
    const selectedPlan = PLANS[plan]

    const metadata: Record<string, string> = {
      plan,
      ...(clinicSlug && { clinic_slug: clinicSlug }),
      ...(clinicName && { clinic_name: clinicName }),
      ...(ownerName && { owner_name: ownerName }),
    }

    const baseUrl = SITE_URL
    const successUrl = `${baseUrl}/claim/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`
    const cancelUrl = `${baseUrl}/claim/cancel?plan=${plan}${clinicSlug ? `&clinic=${clinicSlug}` : ''}`

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
      ...(email && { customer_email: email }),
      metadata,
      subscription_data: { metadata },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[checkout] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
