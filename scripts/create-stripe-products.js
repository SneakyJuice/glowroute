#!/usr/bin/env node
/**
 * GlowRoute — Create Stripe products + prices for Phase 0
 * Run once: node scripts/create-stripe-products.js
 */

const fs = require('fs')
const path = require('path')

// Load env (handles `export KEY=value` and `export KEY='value'` formats)
const envFile = path.join(__dirname, '../../.keys.env')
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
    const m = line.trim().match(/^export\s+(\w+)=(.+)$/)
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  })
}

const Stripe = require('stripe')
const stripe = new Stripe(process.env.STRIPE_API_KEY, { apiVersion: '2024-06-20' })

async function main() {
  console.log('Creating GlowRoute Stripe products...\n')

  // ── Basic Plan ───────────────────────────────────────────────────────────
  const basicProduct = await stripe.products.create({
    name: 'GlowRoute Basic',
    description: 'Claim your listing, add photos, manage contact info, and respond to reviews.',
    metadata: { plan: 'basic', tier: '1' },
  })
  console.log(`✅ Basic product: ${basicProduct.id}`)

  const basicPrice = await stripe.prices.create({
    product: basicProduct.id,
    unit_amount: 9900, // $99.00
    currency: 'usd',
    recurring: { interval: 'month' },
    nickname: 'Basic Monthly',
    metadata: { plan: 'basic' },
  })
  console.log(`✅ Basic price:   ${basicPrice.id}  ($99/mo)\n`)

  // ── Pro Plan ─────────────────────────────────────────────────────────────
  const proProduct = await stripe.products.create({
    name: 'GlowRoute Pro',
    description: 'Everything in Basic + featured placement, priority ranking, analytics dashboard, and verified badge.',
    metadata: { plan: 'pro', tier: '2' },
  })
  console.log(`✅ Pro product: ${proProduct.id}`)

  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 24900, // $249.00
    currency: 'usd',
    recurring: { interval: 'month' },
    nickname: 'Pro Monthly',
    metadata: { plan: 'pro' },
  })
  console.log(`✅ Pro price:   ${proPrice.id}  ($249/mo)\n`)

  // ── Output env vars ──────────────────────────────────────────────────────
  const output = [
    `STRIPE_BASIC_PRICE_ID=${basicPrice.id}`,
    `STRIPE_PRO_PRICE_ID=${proPrice.id}`,
    `STRIPE_BASIC_PRODUCT_ID=${basicProduct.id}`,
    `STRIPE_PRO_PRODUCT_ID=${proProduct.id}`,
  ].join('\n')

  console.log('─'.repeat(60))
  console.log('Add to .keys.env + Vercel env vars:\n')
  console.log(output)
  console.log('─'.repeat(60))

  // Append to .keys.env
  const keysEnvPath = path.join(__dirname, '../../.keys.env')
  fs.appendFileSync(keysEnvPath, '\n# GlowRoute Stripe products (auto-generated)\n' + output + '\n')
  console.log(`\n✅ Appended to ${keysEnvPath}`)
}

main().catch(e => {
  console.error('FATAL:', e.message)
  if (e.message.includes('No such price') || e.message.includes('already exists')) {
    console.log('(Products may already exist — check Stripe dashboard)')
  }
  process.exit(1)
})
