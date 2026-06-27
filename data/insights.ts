export interface Insight {
  slug: string
  title: string
  subtitle: string
  type: 'market-report' | 'case-study' | 'research-brief' | 'industry-analysis'
  publishedAt: string
  readTime: string
  featured: boolean
  excerpt: string
  contentFile?: string
  imageUrl: string
  tags: string[]
}

export const INSIGHTS: Insight[] = [
  {
    slug: "glowing-q2-2026-market-report",
    title: "The Glowing Q2 2026 Medspa Market Report",
    subtitle: "AI search, FDA enforcement, GLP-1 evolution, and the startups reshaping aesthetics",
    type: "market-report",
    publishedAt: "2026-06-30",
    readTime: "14 min read",
    featured: true,
    excerpt: "GlowRoute Q2 2026 intelligence: what consumers ask AI, AI-SEO/GEO for clinics, the compounding crackdown and July peptide ruling, oral GLP-1s, PE valuations, and the unicorns (Function Health, Moxie, Hims) redrawing the medspa map.",
    contentFile: "glowing-q2-2026-market-report.html",
    imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",
    tags: ["market report", "Q2 2026", "medspa industry", "AI SEO", "GLP-1", "valuations"],
  },
  {
    slug: 'glowing-q1-2026-market-report',
    title: 'The Glowing Q1 2026 Medspa Market Report',
    subtitle: 'A data-driven analysis of the aesthetics and wellness industry entering Q2 2026',
    type: 'market-report',
    publishedAt: '2026-03-22',
    readTime: '12 min read',
    featured: false,
    excerpt: "GlowRoute's inaugural quarterly market intelligence report covering clinic growth trends, treatment demand shifts, regulatory developments, and the emerging peptide therapy market across 17 states.",
    contentFile: 'glowing-q1-2026-market-report.html',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    tags: ['market report', 'Q1 2026', 'medspa industry', 'aesthetics trends', 'peptide therapy'],
  },
]
