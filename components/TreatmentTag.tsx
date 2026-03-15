type TagVariant = 'default' | 'teal' | 'gold'
interface TagProps { label: string; variant?: TagVariant }
export default function TreatmentTag({ label, variant = 'default' }: TagProps) {
  const styles = {
    default: 'bg-gray-100 border-gray-200 text-gray-600',
    teal: 'bg-teal/[0.08] border-teal/20 text-teal',
    gold: 'bg-gold/10 border-gold/30 text-[#B07A00]',
  }
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${styles[variant]}`}>
      {label}
    </span>
  )
}

const GOLD_KEYWORDS = [
  'peptide', 'semaglutide', 'glp-1', 'glp1', 'ozempic', 'bpc-157',
  'sermorelin', 'tirzepatide', 'hormone', 'testosterone', 'weight loss',
  "men's health", 'women\'s health',
]
const TEAL_KEYWORDS = [
  'botox', 'dysport', 'filler', 'dermal', 'kybella', 'restylane',
  'juvederm', 'sculptra', 'injectable', 'laser', 'microneedling',
  'iv therapy', 'body contour',
]

export function getTagVariant(treatment: string): TagVariant {
  const lower = treatment.toLowerCase()
  if (GOLD_KEYWORDS.some(k => lower.includes(k))) return 'gold'
  if (TEAL_KEYWORDS.some(k => lower.includes(k))) return 'teal'
  return 'default'
}
