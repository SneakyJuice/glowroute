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
  {
    slug: 'peptide-therapy-cost',
    treatment: 'Peptide Therapy',
    avgLow: '$150–250/month (basic protocols)',
    avgMid: '$300–500/month (comprehensive stacks)',
    avgHigh: '$600–900/month (supervised + labs)',
    avgPremium: '$1,200+/month (full optimization program)',
    intro: 'Peptide therapy pricing depends on the complexity of your protocol, the specific peptides used, and whether you\'re receiving ongoing physician oversight. Basic entry-level protocols are surprisingly accessible, while elite optimization programs can rival the cost of TRT or GLP-1 therapy.',
    whyVary: [
      'Peptide type matters enormously — BPC-157 is inexpensive while CJC-1295/Ipamorelin stacks or PT-141 carry significantly higher ingredient costs',
      'Physician oversight and quarterly labs add $200–400/quarter but are essential for safety and dose optimization',
      'Compounded peptides from 503B pharmacies cost 40–60% less than research-grade sources — always use the former',
    ],
    whatToLookFor: [
      'Verify the prescribing provider is an MD, DO, NP, or PA licensed in your state — peptides are prescription medications',
      'Ask which FDA-registered 503B pharmacy compounds your peptides — never accept grey-market sources',
      'Comprehensive protocols should include baseline labs (IGF-1, CBC, metabolic panel) before starting',
    ],
    relatedTreatmentSlug: 'peptide-therapy',
    faq: [
      { q: 'Are peptides FDA-approved?', a: 'Most therapeutic peptides are compounded by licensed pharmacies under physician supervision. They are legal when prescribed but not individually FDA-approved as drugs.' },
      { q: 'How long until I feel results from peptide therapy?', a: 'BPC-157 for recovery: 2–4 weeks. GH-releasing peptides (Sermorelin, Ipamorelin): 4–8 weeks for body composition changes. Patience and consistency are essential.' },
      { q: 'Can I combine peptides with TRT or GLP-1?', a: 'Yes — many optimization programs stack peptides with TRT, semaglutide, or both. Always disclose all current medications to your prescribing provider.' },
    ],
  },
  {
    slug: 'nad-therapy-cost',
    treatment: 'NAD+ Therapy',
    avgLow: '$150–200/session (50mg IV)',
    avgMid: '$300–500/session (250mg IV)',
    avgHigh: '$700–1,000/session (500mg+ full protocol)',
    avgPremium: '$2,500+/protocol (multi-day NAD+ loading)',
    intro: 'NAD+ (Nicotinamide Adenine Dinucleotide) IV therapy is one of the more expensive wellness treatments due to ingredient cost and the longer infusion times required at higher doses. Multi-day loading protocols are increasingly popular for anti-aging, cognitive performance, and addiction recovery.',
    whyVary: [
      'NAD+ ingredient cost scales linearly with dose — 500mg infusions cost the clinic 4–5x more to source than 100mg',
      'Infusion speed is critical: higher doses require slower drip rates, meaning 2–4+ hour sessions that increase chair time and labor cost',
      'Add-on nutrients (glutathione push, vitamin C, B-complex) and IV placement fees add $50–150 per visit',
    ],
    whatToLookFor: [
      'A registered nurse or physician must be on-site for all NAD+ infusions — not just available by phone',
      'Ask the exact milligram dosage and infusion duration — vague "NAD+ drip" descriptions often mean low-dose options',
      'Confirm the source pharmacy is an FDA-registered 503B compounder for pharmaceutical-grade purity',
    ],
    relatedTreatmentSlug: 'iv-therapy',
    faq: [
      { q: 'How many NAD+ sessions do I need?', a: 'A standard loading protocol is 4–10 consecutive days for peak results, followed by monthly maintenance. Single sessions offer short-term energy and focus boosts.' },
      { q: 'What does NAD+ feel like during the infusion?', a: 'Higher doses often cause chest tightness, nausea, and flushing if administered too quickly. An experienced clinic will titrate the drip rate to minimize discomfort.' },
      { q: 'Is NAD+ IV better than oral supplements?', a: 'IV delivery achieves near-100% bioavailability vs. 30–50% for oral NMN/NR precursors. For therapeutic dosing, IV is significantly more effective.' },
    ],
  },
  {
    slug: 'body-contouring-cost',
    treatment: 'Body Contouring / CoolSculpting Alternatives',
    avgLow: '$600–900/session (single area)',
    avgMid: '$1,200–2,500/area (full treatment course)',
    avgHigh: '$3,000–5,000 (multi-area packages)',
    avgPremium: '$8,000+/full body transformation program',
    intro: 'Non-surgical body contouring has expanded well beyond CoolSculpting. Emsculpt NEO, truSculpt iD, EmSella, and CoolTone each target different goals — from fat reduction to muscle building to pelvic floor therapy. Pricing varies significantly by technology and clinic.',
    whyVary: [
      'Technology type is the primary driver — muscle-building devices (Emsculpt NEO) typically cost more per session than fat-reduction-only devices (truSculpt)',
      'Number of sessions per treatment area: Emsculpt NEO recommends 4 sessions; truSculpt iD often achieves results in 1–2',
      'Equipment depreciation and licensing fees for premium devices (Emsculpt, CoolSculpting Elite) are passed on to patients',
    ],
    whatToLookFor: [
      'Identify your primary goal first: fat reduction, muscle building, or skin tightening — different devices excel at different things',
      'Ask how many sessions are included in quoted pricing and what the expected reduction percentage is per treatment course',
      'Combination protocols (e.g., CoolSculpting + Emsculpt NEO on the same area) can deliver superior results but significantly increase total cost',
    ],
    relatedTreatmentSlug: 'coolsculpting',
    faq: [
      { q: 'What\'s the difference between Emsculpt NEO and CoolSculpting?', a: 'CoolSculpting destroys fat cells via freezing. Emsculpt NEO simultaneously burns fat (via RF) and builds muscle (via HIFEM). They complement each other but are not interchangeable.' },
      { q: 'How long do body contouring results last?', a: 'Fat reduction results are permanent for destroyed cells, but weight gain can expand remaining fat cells. Muscle gains from Emsculpt NEO typically require maintenance sessions every 3–6 months.' },
      { q: 'Is EmSella worth it for pelvic floor?', a: 'For stress urinary incontinence and pelvic floor weakness, EmSella (6 sessions) has strong clinical evidence. Most patients report significant improvement. Cost is $200–400/session.' },
    ],
  },
  {
    slug: 'chemical-peel-cost',
    treatment: 'Chemical Peels',
    avgLow: '$75–150 (superficial/light peel)',
    avgMid: '$200–400 (medium-depth TCA peel)',
    avgHigh: '$500–900 (deep phenol peel)',
    avgPremium: '$1,000–1,500+ (medical-grade + PRP combo)',
    intro: 'Chemical peels range from light lunch-break treatments to deep medical procedures requiring sedation. The right depth depends on your skin concern — fine lines, pigmentation, acne scarring, or texture — and how much downtime you can tolerate.',
    whyVary: [
      'Peel depth is the primary cost driver: superficial (glycolic, lactic) vs. medium (TCA 20–35%) vs. deep (phenol) require different expertise and carry different risk profiles',
      'Medical-grade peels must be performed by licensed providers — VI Peel, Jessner, and TCA peels should never be DIY or administered by an unlicensed aesthetician',
      'Add-ons like PRP, LED therapy, or hydrating masks post-peel add value and cost',
    ],
    whatToLookFor: [
      'Match depth to concern: superficial peels for maintenance and mild glow; TCA peels for pigmentation, wrinkles, and acne scars; phenol for severe sun damage',
      'Downtime is proportional to depth — superficial (0–2 days), TCA (5–10 days peeling), phenol (2–4 weeks); plan accordingly',
      'Ask what pre-treatment prep is required — Retin-A and hydroquinone priming significantly improves results for medium and deep peels',
    ],
    relatedTreatmentSlug: 'chemical-peels',
    faq: [
      { q: 'How often can I get a chemical peel?', a: 'Light peels: monthly. TCA medium peels: every 3–6 months. Deep phenol peels: once in a lifetime for most patients.' },
      { q: 'What\'s the best peel for acne scars?', a: 'TCA CROSS (focal application) for ice-pick scars; full TCA 20–35% for rolling and boxcar scars. Combine with microneedling series for optimal results.' },
      { q: 'Can I get a chemical peel if I have darker skin?', a: 'Yes, but provider expertise matters enormously. Superficial lactic and mandelic acid peels are safest for darker skin tones. TCA requires experienced hands and lower concentrations to avoid hyperpigmentation.' },
    ],
  },
]

export function getGuideBySlug(slug: string): CostGuide | undefined {
  return COST_GUIDES.find(g => g.slug === slug)
}
