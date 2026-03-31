/**
 * Health goal definitions — sourced from taxonomy.json goals layer.
 * Peptide-research-driven: 14 Cat-1 reclassified compounds define the goal buckets.
 * Used by: filter UI, /clinics?goal=[slug], clinic profile pages, sitemap.
 */

export interface GoalDef {
  slug: string
  label: string
  emoji: string
  description: string
  searchTerms: string[]
  peptides: string[]
  modalities: string[]
}

export const GOALS: GoalDef[] = [
  {
    slug: 'skin-rejuvenation',
    label: 'Skin Rejuvenation',
    emoji: '✨',
    description: 'Aesthetic skin treatments — injectables, lasers, facials, resurfacing',
    searchTerms: ['skin rejuvenation', 'anti-aging skin', 'wrinkles', 'glow'],
    peptides: ['GHK-Cu'],
    modalities: ['botox-fillers', 'microneedling', 'laser-skin', 'hydrafacial', 'chemical-peels', 'prp-treatments', 'anti-aging'],
  },
  {
    slug: 'anti-aging-longevity',
    label: 'Anti-Aging & Longevity',
    emoji: '⏳',
    description: 'Growth hormone optimization, cellular regeneration, longevity protocols',
    searchTerms: ['anti-aging', 'longevity', 'biohacking', 'biological age'],
    peptides: ['Sermorelin', 'Ipamorelin', 'CJC-1295', 'GHK-Cu', 'NAD+'],
    modalities: ['peptide-therapy', 'prp-treatments', 'anti-aging', 'iv-therapy'],
  },
  {
    slug: 'weight-metabolic',
    label: 'Weight & Metabolic',
    emoji: '⚖️',
    description: 'Medical weight loss, GLP-1 therapies, semaglutide, metabolic optimization',
    searchTerms: ['weight loss', 'ozempic', 'semaglutide', 'glp-1', 'fat loss'],
    peptides: ['AOD-9604', 'Semaglutide', 'Tirzepatide'],
    modalities: ['weight-loss-ozempic', 'peptide-therapy', 'coolsculpting'],
  },
  {
    slug: 'body-sculpting',
    label: 'Body Sculpting',
    emoji: '🏋️',
    description: 'Non-surgical body contouring, fat reduction, CoolSculpting, Emsculpt',
    searchTerms: ['body contouring', 'fat reduction', 'coolsculpting', 'emsculpt'],
    peptides: ['AOD-9604'],
    modalities: ['coolsculpting', 'weight-loss-ozempic'],
  },
  {
    slug: 'recovery-repair',
    label: 'Recovery & Repair',
    emoji: '🔧',
    description: 'Tissue repair, injury recovery, post-surgery healing — BPC-157, TB-500',
    searchTerms: ['injury recovery', 'tissue repair', 'muscle recovery', 'healing'],
    peptides: ['BPC-157', 'TB-500', 'Thymosin Beta-4'],
    modalities: ['peptide-therapy', 'prp-treatments', 'iv-therapy'],
  },
  {
    slug: 'immune-wellness',
    label: 'Immune & Wellness',
    emoji: '🛡️',
    description: 'Immune support, inflammation reduction, cellular health, NAD+ therapy',
    searchTerms: ['immune support', 'inflammation', 'wellness', 'cellular health'],
    peptides: ['Thymosin Alpha-1', 'GHK-Cu', 'NAD+'],
    modalities: ['peptide-therapy', 'iv-therapy', 'prp-treatments'],
  },
  {
    slug: 'muscle-performance',
    label: 'Muscle & Performance',
    emoji: '💪',
    description: 'Lean muscle, body recomp, athletic performance — sermorelin, TRT',
    searchTerms: ['muscle building', 'body recomposition', 'performance', 'lean muscle'],
    peptides: ['Sermorelin', 'Ipamorelin', 'CJC-1295', 'BPC-157'],
    modalities: ['peptide-therapy', 'trt-testosterone'],
  },
  {
    slug: 'hormone-balance',
    label: 'Hormone Balance',
    emoji: '⚗️',
    description: 'TRT, HRT, bioidentical hormones, comprehensive hormone optimization',
    searchTerms: ['hormone therapy', 'trt', 'testosterone', 'hrt', 'low t'],
    peptides: ['Sermorelin', 'Ipamorelin', 'CJC-1295', 'PT-141'],
    modalities: ['trt-testosterone', 'peptide-therapy'],
  },
  {
    slug: 'cognitive-mood',
    label: 'Cognitive & Mood',
    emoji: '🧠',
    description: 'Mental clarity, focus, anxiety, libido — Selank, Semax, PT-141, NAD+',
    searchTerms: ['cognitive enhancement', 'focus', 'anxiety', 'libido', 'brain health'],
    peptides: ['Selank', 'Semax', 'PT-141', 'NAD+'],
    modalities: ['peptide-therapy', 'iv-therapy', 'trt-testosterone'],
  },
  {
    slug: 'hair-scalp',
    label: 'Hair & Scalp',
    emoji: '💆',
    description: 'Hair restoration, PRP for hair loss, transplants, scalp health',
    searchTerms: ['hair loss', 'hair restoration', 'prp hair', 'alopecia'],
    peptides: ['GHK-Cu', 'BPC-157'],
    modalities: ['hair-restoration', 'prp-treatments'],
  },
]

export const GOALS_MAP = new Map(GOALS.map(g => [g.slug, g]))

export function getGoalBySlug(slug: string): GoalDef | undefined {
  return GOALS_MAP.get(slug)
}

export function getGoalsForClinic(goalSlugs: string[]): GoalDef[] {
  return (goalSlugs || []).map(s => GOALS_MAP.get(s)).filter(Boolean) as GoalDef[]
}
