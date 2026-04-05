import type { Clinic } from '@/types/clinic'

const PEPTIDE_KEYWORDS = [
  'peptide', 'bpc-157', 'bpc157', 'sermorelin', 'ipamorelin', 'cjc-1295',
  'growth hormone', 'ghk-cu', 'pt-141', 'tb-500', 'thymosin',
]

const TRT_KEYWORDS = [
  'testosterone', 'trt', "men's health", "men's clinic", 'male hormone',
  'andropause', 'low t', 'low testosterone', 'hormone replacement',
  'hormone optimization', 'hormone therapy',
]

const GLP1_KEYWORDS = [
  'semaglutide', 'glp-1', 'glp1', 'ozempic', 'wegovy', 'tirzepatide',
  'mounjaro', 'zepbound', 'weight loss injection', 'medical weight loss',
]

const BPC_KEYWORDS = [
  'bpc-157', 'bpc157', 'recovery peptide', 'tb-500', 'tb500',
  'thymosin beta', 'tissue repair', 'healing peptide',
]

const HGH_KEYWORDS = [
  'hgh', 'human growth hormone', 'sermorelin', 'ipamorelin', 'cjc-1295',
  'growth hormone releasing', 'igf-1', 'igf1', 'ghk-cu',
]

function haystack(clinic: Clinic): string {
  return [
    clinic.name,
    ...(clinic.treatments ?? []),
    ...(clinic.specialtyTreatments ?? []),
    clinic.description ?? '',
    ...(clinic.brandValues ?? []),
  ].join(' ').toLowerCase()
}

function matchesAny(hay: string, keywords: string[]): boolean {
  return keywords.some(k => hay.includes(k.toLowerCase()))
}

export function isPeptideClinic(clinic: Clinic): boolean {
  const hay = haystack(clinic)
  return (
    matchesAny(hay, PEPTIDE_KEYWORDS) ||
    matchesAny(hay, TRT_KEYWORDS) ||
    matchesAny(hay, GLP1_KEYWORDS) ||
    matchesAny(hay, HGH_KEYWORDS)
  )
}

export type PeptideCategory = 'TRT' | 'GLP-1' | 'BPC-157' | 'HGH/IGF-1' | 'General'

export function getPeptideCategory(clinic: Clinic): PeptideCategory | null {
  if (!isPeptideClinic(clinic)) return null
  const hay = haystack(clinic)
  if (matchesAny(hay, BPC_KEYWORDS)) return 'BPC-157'
  if (matchesAny(hay, HGH_KEYWORDS)) return 'HGH/IGF-1'
  if (matchesAny(hay, GLP1_KEYWORDS)) return 'GLP-1'
  if (matchesAny(hay, TRT_KEYWORDS)) return 'TRT'
  return 'General'
}

export const ALL_PEPTIDE_KEYWORDS = [
  ...PEPTIDE_KEYWORDS, ...TRT_KEYWORDS, ...GLP1_KEYWORDS, ...HGH_KEYWORDS,
]
