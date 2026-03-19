export interface CostGuide {
  slug: string
  treatment: string
  avgLow: string
  avgMid: string
  avgHigh: string
  avgPremium: string
  intro: string
  whyVary: string[]
  whatToLookFor: string[]
  relatedTreatmentSlug: string
  faq: { q: string; a: string }[]
}

export const COST_GUIDES: CostGuide[] = [
  {
    slug: 'botox-cost',
    treatment: 'Botox',
    avgLow: '$9–12/unit (10–20 units)',
    avgMid: '$12–16/unit (20–40 units)',
    avgHigh: '$16–22/unit',
    avgPremium: '$25+/unit (celebrity injectors)',
    intro: 'Botox is the most popular cosmetic treatment in the U.S. Pricing varies widely by region, provider experience, and units used. Here\'s what to expect.',
    whyVary: [
      'Unit count depends on treatment area — forehead vs. crow\'s feet vs. full face',
      'Board-certified injectors typically charge more but deliver safer, more natural results',
      'Medspa promotions and membership programs can significantly reduce per-unit pricing',
    ],
    whatToLookFor: [
      'Verify the injector is a licensed NP, PA, or physician — not a trained aesthetician',
      'Ask to see before/after photos specifically for your target area',
      'Avoid providers pricing by "area" rather than by unit — it obscures true cost',
    ],
    relatedTreatmentSlug: 'botox-fillers',
    faq: [
      { q: 'How many units do I need for forehead lines?', a: 'Typically 10–30 units for forehead + glabellar lines. A skilled injector will assess in person.' },
      { q: 'How long does Botox last?', a: '3–4 months on average. First-time patients may see shorter duration.' },
      { q: 'Is cheaper Botox the same quality?', a: 'The medication itself is FDA-regulated. The difference is injector skill — that\'s what you\'re really paying for.' },
    ],
  },
  {
    slug: 'semaglutide-ozempic-cost',
    treatment: 'Semaglutide / GLP-1 Weight Loss',
    avgLow: '$199–299/mo (compounded)',
    avgMid: '$399–599/mo (branded compounded)',
    avgHigh: '$800–1,200/mo (Ozempic/Wegovy brand name)',
    avgPremium: '$1,500+/mo (premium telehealth programs)',
    intro: 'Semaglutide pricing depends heavily on whether you\'re getting compounded or brand-name medication. Compounded options have made GLP-1 therapy significantly more accessible.',
    whyVary: [
      'Compounded semaglutide is legally available from licensed pharmacies and costs 60–80% less than brand name',
      'Program pricing often includes labs, physician consults, and follow-up — not just the medication',
      'Insurance rarely covers weight loss medication; most patients pay out-of-pocket',
    ],
    whatToLookFor: [
      'Confirm the provider uses FDA-registered compounding pharmacies',
      'Look for programs that include labs and ongoing physician oversight — not just a prescription',
      'Ask about titration schedules — programs that rush to high doses can increase side effects',
    ],
    relatedTreatmentSlug: 'weight-loss-ozempic',
    faq: [
      { q: 'Is compounded semaglutide safe?', a: 'When sourced from an FDA-registered 503B compounding pharmacy and prescribed by a licensed provider, yes. Always verify the source.' },
      { q: 'Do I need a prescription?', a: 'Yes. Semaglutide is a prescription medication. Any provider offering it without a physician consultation is operating illegally.' },
      { q: 'How long do I need to take it?', a: 'Most programs recommend 6–12 months minimum. Long-term maintenance is common.' },
    ],
  },
  {
    slug: 'hydrafacial-cost',
    treatment: 'HydraFacial',
    avgLow: '$149–199 (signature)',
    avgMid: '$199–299 (with boosters)',
    avgHigh: '$300–450 (deluxe + lymphatic)',
    avgPremium: '$500+ (platinum series)',
    intro: 'HydraFacial is one of the most popular med spa treatments because it requires no downtime and delivers immediate results. Pricing scales with add-ons.',
    whyVary: [
      'Base HydraFacial takes 30 min — premium versions add LED therapy, lymphatic drainage, growth factors',
      'Membership programs at med spas can reduce per-treatment cost by 20–40%',
      'Provider experience matters less than with injectables — focus on equipment quality and add-on value',
    ],
    whatToLookFor: [
      'Confirm they\'re using the actual HydraFacial device, not a knockoff hydradermabrasion machine',
      'Ask what boosters are included — growth factor, vitamin C, and peptide boosters add real value',
      'Membership pricing makes monthly HydraFacials financially accessible for most patients',
    ],
    relatedTreatmentSlug: 'hydrafacial',
    faq: [
      { q: 'How often should I get a HydraFacial?', a: 'Monthly for maintenance, quarterly for occasional skin refresh.' },
      { q: 'Is there downtime?', a: 'None. You can return to normal activities immediately and wear makeup the same day.' },
      { q: 'What\'s the difference between HydraFacial and a regular facial?', a: 'HydraFacial uses patented vortex technology to cleanse, exfoliate, extract, and infuse serums simultaneously. Results are more consistent than manual facials.' },
    ],
  },
  {
    slug: 'laser-hair-removal-cost',
    treatment: 'Laser Hair Removal',
    avgLow: '$99–199/session (small area)',
    avgMid: '$200–400/session (medium area)',
    avgHigh: '$400–800/session (full legs or back)',
    avgPremium: '$2,500–5,000+ (full body packages)',
    intro: 'Laser hair removal requires multiple sessions for permanent results. Per-session pricing looks high but packages spread the cost and typically offer significant discounts.',
    whyVary: [
      'Treatment area size is the primary cost driver — upper lip vs. full legs is a 5–8x price difference',
      'Diode vs. Nd:YAG vs. Alexandrite lasers have different efficacy profiles for different skin tones',
      'Package deals (6–8 sessions) are almost always better value than per-session pricing',
    ],
    whatToLookFor: [
      'Confirm the laser is FDA-cleared and appropriate for your skin tone (Fitzpatrick scale matters)',
      'Ask if touch-up sessions are included after the initial package',
      'Be wary of "unlimited packages" — clarify what that means for how many sessions per year',
    ],
    relatedTreatmentSlug: 'laser-hair-removal',
    faq: [
      { q: 'How many sessions do I need?', a: 'Most patients need 6–8 sessions spaced 4–6 weeks apart for 80–90% permanent reduction.' },
      { q: 'Does it work on all skin tones?', a: 'Modern lasers like Nd:YAG are safe and effective on darker skin tones. Avoid providers using only Alexandrite lasers if you have deeper skin.' },
      { q: 'Is laser hair removal permanent?', a: 'Permanent reduction, not complete elimination. Most patients see 80–95% reduction that is long-lasting.' },
    ],
  },
  {
    slug: 'microneedling-cost',
    treatment: 'Microneedling',
    avgLow: '$200–300/session',
    avgMid: '$300–500/session',
    avgHigh: '$500–800/session (with PRP)',
    avgPremium: '$900–1,500 (RF microneedling / Morpheus8)',
    intro: 'Microneedling stimulates collagen production and improves texture, scarring, and fine lines. RF microneedling (like Morpheus8) adds radiofrequency for deeper tightening.',
    whyVary: [
      'Standard microneedling vs. RF microneedling is a significant price jump — RF adds skin tightening',
      'PRP (platelet-rich plasma) add-on adds $150–300 but can enhance results for acne scarring',
      'Series pricing (3–6 sessions) typically offers 15–30% savings vs. per-session',
    ],
    whatToLookFor: [
      'Verify the provider uses a medical-grade device (SkinPen, Vivace, Morpheus8) not a consumer-grade roller',
      'RF microneedling requires more training — ask about the provider\'s specific experience with the device',
      'Downtime is 2–5 days of redness; plan accordingly',
    ],
    relatedTreatmentSlug: 'microneedling',
    faq: [
      { q: 'How many sessions do I need?', a: '3–6 sessions spaced 4–6 weeks apart for significant improvement in texture and scarring.' },
      { q: 'Is RF microneedling worth the extra cost?', a: 'For skin laxity and deeper tightening, yes. For texture and scarring alone, standard microneedling often delivers comparable results.' },
      { q: 'Can I do microneedling in summer?', a: 'Yes, but strict sun protection post-treatment is essential. Avoid direct sun for 2 weeks after each session.' },
    ],
  },
  {
    slug: 'trt-testosterone-therapy-cost',
    treatment: 'TRT / Testosterone Therapy',
    avgLow: '$99–199/mo (compounded injectable)',
    avgMid: '$200–399/mo (full-service clinic)',
    avgHigh: '$400–600/mo (premium men\'s health program)',
    avgPremium: '$700–1,200+/mo (comprehensive hormone optimization)',
    intro: 'Testosterone Replacement Therapy pricing includes labs, physician oversight, and medication. Compounded testosterone has made TRT significantly more affordable than a decade ago.',
    whyVary: [
      'Delivery method affects cost — injections are cheapest, pellets are most expensive but require fewer visits',
      'Comprehensive programs include quarterly labs, physician check-ins, and ancillary medications (HCG, anastrozole)',
      'Telehealth TRT clinics are 40–60% cheaper than brick-and-mortar men\'s health clinics',
    ],
    whatToLookFor: [
      'Labs should be included or low-cost — avoid programs that charge $200+ for quarterly bloodwork',
      'Physician (not just NP) oversight is preferable for complex hormone cases',
      'Confirm anastrozole and HCG are available if needed — not all programs offer them',
    ],
    relatedTreatmentSlug: 'trt-testosterone',
    faq: [
      { q: 'Do I need a prescription for TRT?', a: 'Yes — always. Any source offering testosterone without a physician prescription is illegal and potentially dangerous.' },
      { q: 'Will TRT affect my fertility?', a: 'Exogenous testosterone suppresses sperm production. Discuss HCG or clomiphene if fertility preservation matters to you.' },
      { q: 'How long until I feel results?', a: 'Energy and mood improvements typically appear in 2–4 weeks. Body composition changes take 3–6 months.' },
    ],
  },
  {
    slug: 'coolsculpting-cost',
    treatment: 'CoolSculpting / Cryolipolysis',
    avgLow: '$600–800/area (single cycle)',
    avgMid: '$1,200–2,000 (dual applicators, 2 areas)',
    avgHigh: '$2,500–4,000 (full abdomen + flanks)',
    avgPremium: '$5,000–8,000 (full body treatment plan)',
    intro: 'CoolSculpting permanently destroys fat cells via controlled cooling. Results appear gradually over 2–3 months. Most patients need 1–2 sessions per area.',
    whyVary: [
      'Number of applicators per session is the key cost driver — dual applicators cut treatment time in half but cost more',
      'Generic cryolipolysis machines are significantly cheaper but may have different efficacy profiles',
      'Package deals for multiple areas offer meaningful discounts vs. per-cycle pricing',
    ],
    whatToLookFor: [
      'Confirm they\'re using a CoolSculpting Elite (FDA-cleared) machine, not a generic alternative',
      'Ask about PAH (paradoxical adipose hyperplasia) risk and their protocol if it occurs — rare but real',
      'Results take 2–3 months to be fully visible; be skeptical of providers promising faster results',
    ],
    relatedTreatmentSlug: 'coolsculpting',
    faq: [
      { q: 'How many treatments do I need?', a: 'Most patients see satisfying results in 1–2 sessions per area. Revision sessions are sometimes needed for full correction.' },
      { q: 'Is CoolSculpting permanent?', a: 'The destroyed fat cells are gone permanently. However, remaining fat cells can still expand with weight gain.' },
      { q: 'What\'s the downtime?', a: 'Minimal. Temporary numbness, bruising, and tenderness for 1–2 weeks. Most return to work immediately.' },
    ],
  },
  {
    slug: 'iv-therapy-cost',
    treatment: 'IV Therapy / Vitamin Infusions',
    avgLow: '$99–149 (basic hydration)',
    avgMid: '$150–250 (vitamin cocktail)',
    avgHigh: '$250–400 (NAD+, high-dose vitamin C)',
    avgPremium: '$500–1,500 (NAD+ full protocol)',
    intro: 'IV therapy delivers nutrients, hydration, and vitamins directly into the bloodstream. Pricing varies dramatically based on what\'s in the drip.',
    whyVary: [
      'NAD+ is significantly more expensive than standard vitamin cocktails due to ingredient cost',
      'Mobile IV services charge a convenience premium but can be 20–30% more than clinic visits',
      'Membership programs at IV bars reduce per-drip cost by 25–40%',
    ],
    whatToLookFor: [
      'A nurse or physician should be administering or supervising all IV placements',
      'Ask exactly what\'s in the drip — exact ingredients and dosages, not just marketing names',
      'Verify the compounding pharmacy source for NAD+ and specialty ingredients',
    ],
    relatedTreatmentSlug: 'iv-therapy',
    faq: [
      { q: 'Is IV therapy safe?', a: 'When administered by licensed medical professionals in a clinical setting, yes. Risks include infection and vein irritation if done improperly.' },
      { q: 'What does NAD+ actually do?', a: 'NAD+ supports cellular energy production and has been studied for anti-aging, cognitive function, and addiction recovery. Evidence is promising but still emerging.' },
      { q: 'How often should I get IV therapy?', a: 'Weekly for acute goals (recovery, illness), monthly for wellness maintenance. Your provider should guide frequency based on your goals.' },
    ],
  },
]

export function getGuideBySlug(slug: string): CostGuide | undefined {
  return COST_GUIDES.find(g => g.slug === slug)
}
