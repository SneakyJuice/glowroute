import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_API_KEY
    if (!key) throw new Error('STRIPE_API_KEY environment variable is not set')
    _stripe = new Stripe(key, { apiVersion: '2026-02-25.clover' })
  }
  return _stripe
}

export const PLANS = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? 'price_1TCFo067ZLaHqf10O8eXUc6l',
    amount: 9900,
    monthlyLabel: '$99/mo',
    tagline: 'Get your listing working for you',
    features: [
      'Claim & verify your listing',
      'Update photos, services & hours',
      'Manage contact info & website link',
      'Remove competitor ads from your page',
      'Receive patient leads via email',
    ],
  },
  growth: {
    name: 'Growth',
    priceId: process.env.STRIPE_GROWTH_PRICE_ID ?? 'price_1TCFo067ZLaHqf10IR8jp6CQ',
    amount: 24900,
    monthlyLabel: '$249/mo',
    tagline: 'Get discovered by more patients',
    highlight: true,
    features: [
      'Everything in Starter',
      'Featured placement in search results',
      'Priority ranking above free listings',
      'Analytics dashboard (views, leads, clicks)',
      'Promotional banner on clinic profile',
      'iCal availability sync',
    ],
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? 'price_1TCFo167ZLaHqf10dDmij3sG',
    amount: 49900,
    monthlyLabel: '$499/mo',
    tagline: 'Dominate your market',
    features: [
      'Everything in Growth',
      'GlowRoute Verified badge',
      'Homepage featured spotlight (rotating)',
      'Competitor conquest (show on rival pages)',
      'Dedicated account manager',
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS
