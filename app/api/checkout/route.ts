import { NextRequest, NextResponse } from 'next/server'
import { getStripe, PLANS, PlanKey } from '@/lib/stripe'
import { SITE_URL } from '@/lib/config'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      clinicSlug?: string
      tier?: PlanKey
      plan?: PlanKey          // backwards-compat alias
      clinicName?: string
      email?: string
      ownerName?: string
    }

    const tier = (body.tier ?? body.plan) as PlanKey | undefined
    const { clinicSlug, clinicName, email, ownerName } = body

    if (!tier || !PLANS[tier]) {
      return NextResponse.json(
        { error: `Invalid tier. Must be: ${Object.keys(PLANS).join(', ')}` },
        { status: 400 }
      )
    }

    const stripe = getStripe()
    const plan = PLANS[tier]

    const metadata: Record<string, string> = {
      tier,
      ...(clinicSlug  && { clinic_slug:  clinicSlug  }),
      ...(clinicName  && { clinic_name:  clinicName  }),
      ...(ownerName   && { owner_name:   ownerName   }),
      ...(email       && { owner_email:  email       }),
    }

    const successUrl = `${SITE_URL}/claim/success?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`
    const cancelUrl  = `${SITE_URL}/claim/cancel?tier=${tier}${clinicSlug ? `&clinic=${clinicSlug}` : ''}`

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.priceId, quantity: 1 }],
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
    console.error('[checkout]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
