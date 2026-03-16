export const CATEGORIES = [
  { slug: 'botox-fillers', label: 'Botox & Fillers', icon: '💉', keywords: ['botox', 'filler', 'dysport', 'xeomin', 'juvederm', 'restylane', 'sculptra', 'radiesse', 'lip filler', 'cheek filler'] },
  { slug: 'laser-treatments', label: 'Laser Treatments', icon: '🔆', keywords: ['laser', 'ipl', 'photofacial', 'resurfacing', 'fraxel', 'co2', 'bbl', 'clear + brilliant'] },
  { slug: 'body-contouring', label: 'Body Contouring', icon: '✨', keywords: ['coolsculpting', 'emsculpt', 'body contouring', 'fat reduction', 'kybella', 'sculpsure', 'truSculpt'] },
  { slug: 'skin-rejuvenation', label: 'Skin Rejuvenation', icon: '🌿', keywords: ['microneedling', 'prp', 'vampire facial', 'chemical peel', 'hydrafacial', 'dermaplaning', 'exosome'] },
  { slug: 'iv-wellness', label: 'IV & Wellness', icon: '💧', keywords: ['iv therapy', 'iv drip', 'vitamin', 'nad+', 'myers cocktail', 'glutathione', 'peptide', 'hormone'] },
  { slug: 'hair-restoration', label: 'Hair Restoration', icon: '💆', keywords: ['hair loss', 'hair restoration', 'prp hair', 'hair transplant', 'follicle'] },
  { slug: 'skin-tightening', label: 'Skin Tightening', icon: '🎯', keywords: ['ultherapy', 'thermage', 'radiofrequency', 'rf', 'skin tightening', 'morpheus', 'forma'] },
  { slug: 'acne-scarring', label: 'Acne & Scarring', icon: '🌸', keywords: ['acne', 'scar', 'scarring', 'pore', 'pigmentation', 'melasma'] },
  { slug: 'vaginal-rejuvenation', label: 'Intimate Wellness', icon: '🌺', keywords: ['vaginal', 'intimate', 'o-shot', 'votiva', 'tempsure vitalia', 'feminine'] },
  { slug: 'mens-aesthetics', label: "Men's Aesthetics", icon: '💪', keywords: ['men', "men's", 'male', 'testosterone', 'brotox'] },
  { slug: 'weight-loss', label: 'Weight Loss', icon: '⚖️', keywords: ['weight loss', 'semaglutide', 'tirzepatide', 'ozempic', 'wegovy', 'mounjaro', 'medical weight'] },
  { slug: 'facial-treatments', label: 'Facial Treatments', icon: '✦', keywords: ['facial', 'face', 'hydrafacial', 'oxygen facial', 'brightening'] },
  { slug: 'thread-lifts', label: 'Thread Lifts', icon: '🧵', keywords: ['thread lift', 'pdo thread', 'silhouette', 'thread'] },
  { slug: 'permanent-makeup', label: 'Permanent Makeup', icon: '💋', keywords: ['microblading', 'permanent makeup', 'pmu', 'eyebrow', 'lips blush', 'tattoo removal'] },
  { slug: 'tattoo-removal', label: 'Tattoo Removal', icon: '🔵', keywords: ['tattoo removal', 'laser removal', 'picosure', 'picoway'] },
  { slug: 'massage-spa', label: 'Massage & Spa', icon: '🛁', keywords: ['massage', 'spa', 'lymphatic', 'drainage', 'body wrap'] },
  { slug: 'anti-aging', label: 'Anti-Aging', icon: '⏳', keywords: ['anti-aging', 'aging', 'collagen', 'elastin', 'longevity'] },
  { slug: 'vein-treatment', label: 'Vein Treatment', icon: '🔴', keywords: ['vein', 'spider vein', 'varicose', 'sclerotherapy'] },
  { slug: 'consultations', label: 'Consultations', icon: '📋', keywords: ['consultation', 'assessment', 'evaluation', 'skincare analysis'] },
  { slug: 'packages-memberships', label: 'Packages & Memberships', icon: '⭐', keywords: ['package', 'membership', 'monthly plan', 'bundle', 'subscription'] },
] as const;

export type CategorySlug = typeof CATEGORIES[number]['slug'];

export function matchCategories(treatments: string[]): CategorySlug[] {
  const text = treatments.join(' ').toLowerCase();
  return CATEGORIES
    .filter(cat => cat.keywords.some(kw => text.includes(kw)))
    .map(cat => cat.slug);
}
