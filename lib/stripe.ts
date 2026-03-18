import Stripe from 'stripe'

// Lazy singleton — initialized on first request, not at build time
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_API_KEY
    if (!key) throw new Error('STRIPE_API_KEY environment variable is not set')
    _stripe = new Stripe(key, { apiVersion: '2026-02-25.clover' })
  }
  return _stripe
}

// Named export for convenience in API routes
export const stripe = {
  get checkout() { return getStripe().checkout },
  get webhooks() { return getStripe().webhooks },
  get products() { return getStripe().products },
  get prices() { return getStripe().prices },
  get customers() { return getStripe().customers },
  get subscriptions() { return getStripe().subscriptions },
} as unknown as Stripe

export const PLANS = {
  basic: {
    name: 'GlowRoute Basic',
    priceId: process.env.STRIPE_BASIC_PRICE_ID ?? 'price_1TCFhd67ZLaHqf10hwQGrcY7',
    amount: 9900,
    features: [
      'Claim your listing',
      'Add photos & update info',
      'Manage contact details',
      'Respond to leads',
    ],
  },
  pro: {
    name: 'GlowRoute Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? 'price_1TCFhe67ZLaHqf10OkOBnXSa',
    amount: 24900,
    features: [
      'Everything in Basic',
      'Featured placement in search',
      'Priority ranking',
      'Analytics dashboard',
      'Verified badge',
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS
