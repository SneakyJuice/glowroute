export interface TreatmentMeta {
  slug: string
  name: string
  title: string           // page <title>
  h1: string
  description: string     // meta description
  intro: string           // 2-3 sentence intro paragraph
  matchKeywords: string[] // keywords to match against clinic.treatments[]
  schemaName: string      // Schema.org name
}

export const TREATMENTS: TreatmentMeta[] = [
  {
    slug: 'botox-fillers',
    name: 'Botox & Dermal Fillers',
    title: 'Best Botox & Dermal Fillers Near You — GlowRoute',
    h1: 'Botox & Dermal Fillers',
    description: 'Find top-rated Botox and dermal filler clinics near you. Compare prices, read real reviews, and book a consultation near you.',
    intro: 'Botox and dermal fillers remain the most popular aesthetic treatments near you, with thousands of procedures performed every month across Tampa, Miami, Orlando, and beyond. GlowRoute\'s verified directory helps you find board-certified injectors with proven results. Compare clinics by rating, price, and availability before you book.',
    matchKeywords: ['botox', 'filler', 'dysport', 'juvederm', 'restylane', 'sculptra', 'kybella', 'injectable', 'injectables'],
    schemaName: 'Botox and Dermal Filler Treatment',
  },
  {
    slug: 'laser-hair-removal',
    name: 'Laser Hair Removal',
    title: 'Best Laser Hair Removal Near You — GlowRoute',
    h1: 'Laser Hair Removal near you',
    description: 'Find the best laser hair removal clinics near you. Compare technologies, pricing, and patient reviews at medspas near you.',
    intro: 'Laser hair removal is one of the most sought-after procedures at medspas, offering long-lasting smoothness across all skin types. Modern clinics use advanced diode and Nd:YAG systems for safe, effective results year-round. Use GlowRoute to compare certified providers near you by price, rating, and available technology.',
    matchKeywords: ['laser hair', 'laser hair removal', 'hair removal', 'laser'],
    schemaName: 'Laser Hair Removal',
  },
  {
    slug: 'hydrafacial',
    name: 'HydraFacial',
    title: 'Best HydraFacial Treatments near you — GlowRoute',
    h1: 'HydraFacial near you',
    description: 'Discover the best HydraFacial providers near you. Find verified clinics offering cleansing, extraction, and hydration treatments near you.',
    intro: 'HydraFacial is a multi-step facial treatment that cleanses, exfoliates, and delivers targeted serums in a single session — with no downtime. It\'s one of the most requested services at medspas for its instant glow and adaptability for all skin types. Find a verified HydraFacial provider in your city with GlowRoute.',
    matchKeywords: ['hydrafacial', 'hydra facial', 'hydradermabrasion', 'facial'],
    schemaName: 'HydraFacial Skin Treatment',
  },
  {
    slug: 'weight-loss-ozempic',
    name: 'Medical Weight Loss & Ozempic',
    title: 'Best Medical Weight Loss & Ozempic Clinics near you — GlowRoute',
    h1: 'Medical Weight Loss & GLP-1 Programs near you',
    description: 'Find medspas offering supervised weight loss programs including GLP-1 medications, semaglutide, and metabolic health services.',
    intro: 'Medical weight loss programs using GLP-1 medications like semaglutide are now widely available at Florida aesthetic clinics and wellness centers. These supervised programs combine prescription medications with lifestyle coaching for measurable, lasting results. GlowRoute helps you find accredited weight loss clinics in your city, sorted by rating and patient reviews.',
    matchKeywords: ['weight loss', 'semaglutide', 'ozempic', 'glp-1', 'glp1', 'tirzepatide', 'mounjaro', 'wegovy', 'medical weight'],
    schemaName: 'Medical Weight Loss Program',
  },
  {
    slug: 'iv-therapy',
    name: 'IV Therapy',
    title: 'Best IV Therapy Clinics near you — GlowRoute',
    h1: 'IV Therapy near you',
    description: 'Discover IV therapy lounges and wellness clinics near you. Find vitamin infusions, NAD+, hydration drips, and immunity boosts near you.',
    intro: 'IV therapy delivers vitamins, minerals, and hydration directly into the bloodstream for fast, effective wellness results — from hangover recovery to athletic performance and immune support. Florida\'s warm climate and active lifestyle make IV drip bars one of the fastest-growing medspa categories. Find a top-rated IV therapy clinic near you on GlowRoute.',
    matchKeywords: ['iv therapy', 'iv drip', 'infusion', 'nad+', 'vitamin drip', 'hydration drip', 'drip bar', 'ketamine'],
    schemaName: 'IV Therapy Treatment',
  },
  {
    slug: 'microneedling',
    name: 'Microneedling',
    title: 'Best Microneedling Clinics near you — GlowRoute',
    h1: 'Microneedling near you',
    description: 'Find top microneedling providers near you. Compare clinics offering RF microneedling, PRP treatments, and skin rejuvenation.',
    intro: 'Microneedling uses fine needles to stimulate collagen production, improving skin texture, tone, and firmness with minimal downtime. Many Florida clinics now offer RF microneedling (radiofrequency) and PRP combinations for enhanced results. Compare verified microneedling providers across the Southeast by price, technology, and patient reviews.',
    matchKeywords: ['microneedling', 'micro needling', 'rf microneedling', 'prp', 'collagen induction', 'skin rejuvenation'],
    schemaName: 'Microneedling Skin Treatment',
  },
  {
    slug: 'chemical-peels',
    name: 'Chemical Peels',
    title: 'Best Chemical Peel Clinics near you — GlowRoute',
    h1: 'Chemical Peels near you',
    description: 'Find the best chemical peel providers near you. Compare superficial, medium, and deep peel treatments at verified medspas near you.',
    intro: 'Chemical peels exfoliate the skin using medical-grade acids to improve texture, reduce hyperpigmentation, and stimulate cell renewal. From light glycolic peels to deeper trichloroacetic acid treatments, medspas offer a full spectrum of options for every skin concern. GlowRoute makes it easy to compare providers, prices, and patient reviews before booking.',
    matchKeywords: ['chemical peel', 'peel', 'glycolic', 'tca peel', 'vi peel', 'exfoliation', 'skin peel'],
    schemaName: 'Chemical Peel Treatment',
  },
  {
    slug: 'trt-testosterone',
    name: 'TRT & Testosterone Therapy',
    title: 'Best TRT & Testosterone Therapy Clinics near you — GlowRoute',
    h1: 'TRT & Testosterone Therapy near you',
    description: 'Find Florida clinics specializing in testosterone replacement therapy (TRT) and men\'s hormonal health. Compare providers, pricing, and reviews.',
    intro: 'Testosterone replacement therapy helps men address low T levels associated with fatigue, reduced libido, mood changes, and muscle loss. Florida has a growing network of specialized men\'s health clinics offering customized TRT programs with ongoing monitoring. Find board-certified TRT providers near you on GlowRoute.',
    matchKeywords: ['testosterone', 'trt', "men's health", 'hormone replacement', 'low t', 'male hormone', 'andropause'],
    schemaName: 'Testosterone Replacement Therapy',
  },
  {
    slug: 'peptide-therapy',
    name: 'Peptide Therapy',
    title: 'Best Peptide Therapy Clinics near you — GlowRoute',
    h1: 'Peptide Therapy near you',
    description: 'Find Florida clinics offering peptide therapy including BPC-157, Sermorelin, CJC-1295, and growth hormone peptides.',
    intro: 'Peptide therapy uses short amino acid chains to signal the body to heal, optimize hormones, and support performance and longevity. Florida has a growing number of specialized wellness clinics offering protocols like BPC-157, Sermorelin, and ipamorelin for recovery, anti-aging, and body composition. Compare verified peptide therapy providers on GlowRoute.',
    matchKeywords: ['peptide', 'peptide therapy', 'bpc-157', 'sermorelin', 'ipamorelin', 'cjc-1295', 'growth hormone', 'pt-141'],
    schemaName: 'Peptide Therapy',
  },
  {
    slug: 'coolsculpting',
    name: 'CoolSculpting & Body Contouring',
    title: 'Best CoolSculpting & Body Contouring near you — GlowRoute',
    h1: 'CoolSculpting & Body Contouring near you',
    description: 'Find CoolSculpting and non-surgical body contouring clinics near you. Compare fat reduction treatments, pricing, and patient reviews.',
    intro: 'CoolSculpting and non-invasive body contouring treatments use cryolipolysis, radiofrequency, and ultrasound energy to reduce stubborn fat without surgery or downtime. Florida\'s active culture and warm weather make body contouring one of the most popular medspa services year-round. Find certified CoolSculpting and Emsculpt providers near you on GlowRoute.',
    matchKeywords: ['coolsculpting', 'cool sculpting', 'body contouring', 'cryolipolysis', 'emsculpt', 'fat reduction', 'sculpsure', 'kybella'],
    schemaName: 'Body Contouring Treatment',
  },
]

export const TREATMENT_SLUGS = TREATMENTS.map(t => t.slug)

export function getTreatmentBySlug(slug: string): TreatmentMeta | undefined {
  return TREATMENTS.find(t => t.slug === slug)
}
