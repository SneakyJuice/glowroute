// Maps informal/neighborhood names → canonical city name stored in Supabase
export const METRO_ALIASES: Record<string, string> = {
  // Tampa metro
  'south tampa': 'Tampa', 'north tampa': 'Tampa', 'downtown tampa': 'Tampa',
  'westshore': 'Tampa', 'ybor': 'Tampa', 'ybor city': 'Tampa',
  'carrollwood': 'Tampa', 'seminole heights': 'Tampa', 'hyde park': 'Tampa',
  'st pete': 'Saint Petersburg', 'saint pete': 'Saint Petersburg',
  'clearwater beach': 'Clearwater',
  // Miami metro
  'south beach': 'Miami Beach', 'sobe': 'Miami Beach', 'south miami': 'Miami',
  'little havana': 'Miami', 'little haiti': 'Miami', 'wynwood': 'Miami',
  'brickell': 'Miami', 'coral gables': 'Miami', 'coconut grove': 'Miami',
  'kendall': 'Miami', 'doral': 'Doral', 'hialeah': 'Miami',
  'north miami beach': 'North Miami Beach', 'aventura': 'Aventura',
  'sunny isles': 'Sunny Isles Beach', 'bal harbour': 'Bal Harbour',
  // Broward/Fort Lauderdale
  'fort laud': 'Fort Lauderdale', 'ft lauderdale': 'Fort Lauderdale',
  'ft. lauderdale': 'Fort Lauderdale', 'downtown fort lauderdale': 'Fort Lauderdale',
  'las olas': 'Fort Lauderdale', 'wilton manors': 'Fort Lauderdale',
  'pompano': 'Pompano Beach', 'deerfield': 'Deerfield Beach',
  'hallandale': 'Hallandale Beach', 'hollywood fl': 'Hollywood',
  // Palm Beach
  'boca': 'Boca Raton', 'west boca': 'Boca Raton',
  'west palm': 'West Palm Beach', 'wpb': 'West Palm Beach',
  'palm beach gardens': 'Palm Beach Gardens', 'pbg': 'Palm Beach Gardens',
  'delray': 'Delray Beach', 'boynton': 'Boynton Beach',
  // Orlando
  'downtown orlando': 'Orlando', 'dr phillips': 'Orlando', 'lake nona': 'Orlando',
  'winter park': 'Winter Park', 'altamonte': 'Altamonte Springs',
  'kissimmee': 'Kissimmee', 'oviedo': 'Oviedo',
  // Las Vegas
  'the strip': 'Las Vegas', 'summerlin': 'Summerlin', 'henderson nv': 'Henderson',
  'north las vegas': 'North Las Vegas', 'paradise': 'Las Vegas',
  // Dallas/DFW
  'dfw': 'Dallas', 'fort worth': 'Fort Worth', 'ft worth': 'Fort Worth',
  'uptown dallas': 'Dallas', 'frisco': 'Frisco', 'plano': 'Plano',
  'addison': 'Dallas', 'highland park': 'Dallas',
  // Houston
  'the woodlands': 'The Woodlands', 'sugar land': 'Sugar Land',
  'katy': 'Katy', 'river oaks': 'Houston', 'montrose': 'Houston',
  // San Antonio
  'sa': 'San Antonio', 'satx': 'San Antonio',
  // Austin
  'atx': 'Austin', 'south austin': 'Austin', 'north austin': 'Austin',
  'round rock': 'Round Rock', 'cedar park': 'Cedar Park',
  // Charlotte
  'clt': 'Charlotte', 'uptown charlotte': 'Charlotte', 'southpark': 'Charlotte',
  'ballantyne': 'Charlotte', 'myers park': 'Charlotte',
  // Atlanta
  'atl': 'Atlanta', 'buckhead': 'Buckhead', 'midtown atlanta': 'Atlanta',
  'sandy springs': 'Sandy Springs', 'alpharetta': 'Alpharetta',
  'marietta': 'Marietta', 'decatur': 'Decatur',
  // Chicago
  'chi': 'Chicago', 'chi-town': 'Chicago', 'river north': 'Chicago',
  'lincoln park': 'Chicago', 'wicker park': 'Chicago', 'gold coast': 'Chicago',
  // NYC
  'nyc': 'New York City', 'new york': 'New York City', 'manhattan': 'New York City',
  'brooklyn': 'New York City', 'upper east side': 'New York City',
  // LA/SoCal
  'la': 'Los Angeles', 'socal': 'Los Angeles', 'west hollywood': 'West Hollywood',
  'weho': 'West Hollywood', 'santa monica': 'Santa Monica',
  'beverly hills': 'Beverly Hills', 'bh': 'Beverly Hills',
  'century city': 'Los Angeles', 'brentwood ca': 'Los Angeles',
  // San Diego
  'sd': 'San Diego', 'sdca': 'San Diego', 'la jolla': 'La Jolla',
  'pacific beach': 'San Diego', 'pb': 'San Diego', 'mission valley': 'San Diego',
  // San Francisco
  'sf': 'San Francisco', 'bay area': 'San Francisco', 'soma': 'San Francisco',
  'palo alto': 'Palo Alto', 'silicon valley': 'San Jose',
  // Phoenix/Scottsdale
  'phx': 'Phoenix', 'scottsdale az': 'Scottsdale', 'tempe az': 'Tempe',
  'chandler az': 'Chandler', 'gilbert': 'Gilbert', 'mesa': 'Mesa',
  // Denver
  'den': 'Denver', 'lodo': 'Denver', 'cherry creek': 'Denver',
  'highlands': 'Denver', 'boulder': 'Boulder',
  // Nashville
  'nash': 'Nashville', 'nashvegas': 'Nashville',
  // Seattle
  'sea': 'Seattle', 'belltown': 'Seattle', 'capitol hill': 'Seattle',
  // Boston
  'bos': 'Boston', 'back bay': 'Boston', 'south boston': 'Boston',
  'southie': 'Boston',
  // Philadelphia
  'philly': 'Philadelphia', 'center city': 'Philadelphia',
  // Minneapolis
  'mpls': 'Minneapolis', 'twin cities': 'Minneapolis',
  // Naples FL
  'naples fl': 'Naples', 'marco island': 'Naples',
  // DC area
  'dc': 'Washington', 'arlington va': 'Arlington', 'bethesda md': 'Bethesda',
}

export function resolveCity(input: string): string {
  const normalized = input.toLowerCase().trim()
  // Direct alias match
  if (METRO_ALIASES[normalized]) return METRO_ALIASES[normalized]
  // Partial alias match (input contains alias key)
  for (const [alias, city] of Object.entries(METRO_ALIASES)) {
    if (normalized.includes(alias) || alias.includes(normalized)) return city
  }
  // Return original with title case
  return input.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}