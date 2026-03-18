import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { PlanKey } from '@/lib/stripe'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
    } else {
      event = JSON.parse(rawBody) as Stripe.Event
      console.warn('[webhook] Signature verification skipped — set STRIPE_WEBHOOK_SECRET for production')
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook error'
    console.error('[webhook] Signature error:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      default:
        console.log(`[webhook] Unhandled: ${event.type}`)
    }
    return NextResponse.json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Handler error'
    console.error(`[webhook] Error in ${event.type}:`, message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { metadata, customer, subscription } = session
  const clinicSlug = metadata?.clinic_slug
  const plan = metadata?.plan as PlanKey | undefined

  console.log(`[webhook] checkout.completed | plan=${plan} clinic=${clinicSlug}`)

  if (!clinicSlug || !plan) {
    console.warn('[webhook] Missing clinic_slug or plan — skipping DB update')
    return
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return

  const { error } = await supabase
    .from('clinics')
    .update({
      plan,
      stripe_customer_id: typeof customer === 'string' ? customer : (customer as Stripe.Customer)?.id,
      subscription_id: typeof subscription === 'string' ? subscription : (subscription as Stripe.Subscription)?.id,
      claimed_at: new Date().toISOString(),
      status: 'claimed',
    })
    .eq('slug', clinicSlug)

  if (error) throw new Error(`Supabase update failed: ${error.message}`)
  console.log(`[webhook] ✅ ${clinicSlug} → plan=${plan}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const clinicSlug = subscription.metadata?.clinic_slug
  const plan = subscription.metadata?.plan as PlanKey | undefined
  if (!clinicSlug) return

  const supabase = getSupabaseAdmin()
  if (!supabase) return

  const isActive = ['active', 'trialing'].includes(subscription.status)
  const { error } = await supabase
    .from('clinics')
    .update({ plan: isActive ? (plan ?? 'basic') : 'free', subscription_id: subscription.id })
    .eq('slug', clinicSlug)

  if (error) console.error('[webhook] Supabase update error:', error.message)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const clinicSlug = subscription.metadata?.clinic_slug
  if (!clinicSlug) return

  const supabase = getSupabaseAdmin()
  if (!supabase) return

  const { error } = await supabase
    .from('clinics')
    .update({ plan: 'free', subscription_id: null })
    .eq('slug', clinicSlug)

  if (error) console.error('[webhook] Supabase delete error:', error.message)
}
