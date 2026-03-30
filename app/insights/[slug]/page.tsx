import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import fs from 'fs'
import path from 'path'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import InsightActions from '@/components/InsightActions'
import { INSIGHTS } from '@/data/insights'

interface PageProps {
  params: { slug: string }
}

const TYPE_LABELS: Record<string, string> = {
  'market-report': 'Market Report',
  'case-study': 'Case Study',
  'research-brief': 'Research Brief',
  'industry-analysis': 'Industry Analysis',
}

export async function generateStaticParams() {
  return INSIGHTS.map(insight => ({ slug: insight.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const insight = INSIGHTS.find(i => i.slug === params.slug)
  if (!insight) return { title: 'Report Not Found | GlowRoute' }
  return {
    title: `${insight.title} | GlowRoute Intelligence`,
    description: insight.excerpt,
    alternates: {
      canonical: `https://glowroute.io/insights/${insight.slug}`,
    },
    openGraph: {
      title: insight.title,
      description: insight.excerpt,
      images: [{ url: insight.imageUrl, width: 800, height: 450, alt: insight.title }],
      type: 'article',
    },
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function getInsightContent(contentFile?: string): string | null {
  if (!contentFile) return null
  try {
    const filePath = path.join(process.cwd(), 'content', 'insights', contentFile)
    const raw = fs.readFileSync(filePath, 'utf-8')
    // Extract body content from HTML
    const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    return bodyMatch ? bodyMatch[1] : raw
  } catch {
    return null
  }
}

export default function InsightDetailPage({ params }: PageProps) {
  const insight = INSIGHTS.find(i => i.slug === params.slug)
  if (!insight) notFound()

  // Full HTML reports get their own standalone renderer (preserves Chart.js, CSS, scripts)
  if (insight.contentFile?.endsWith('.html')) {
    const { redirect } = require('next/navigation')
    redirect(`/insights-full/${params.slug}`)
  }

  const htmlContent = getInsightContent(insight.contentFile)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Report',
    name: insight.title,
    description: insight.excerpt,
    datePublished: insight.publishedAt,
    publisher: {
      '@type': 'Organization',
      name: 'GlowRoute',
      url: 'https://glowroute.io',
    },
    mainEntityOfPage: `https://glowroute.io/insights/${insight.slug}`,
  }

  return (
    <div className="min-h-screen bg-ivory font-sans">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Image */}
      <div className="w-full h-[300px] md:h-[420px] overflow-hidden bg-onyx relative">
        <img
          src={insight.imageUrl}
          alt={insight.title}
          className="w-full h-full object-cover opacity-50"
        />
        {/* Overlay content */}
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
          <span className="inline-block bg-champagne/90 text-onyx text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded mb-4 self-start">
            {TYPE_LABELS[insight.type] || insight.type}
          </span>
          <h1 className="font-serif text-3xl md:text-5xl text-white leading-tight tracking-tight max-w-3xl">
            {insight.title}
          </h1>
        </div>
      </div>

      {/* Insight Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">

        {/* Back Link */}
        <Link
          href="/insights"
          className="inline-flex items-center gap-1.5 text-stone text-sm font-medium hover:text-sage transition-colors mb-8"
        >
          ← Back to Intelligence
        </Link>

        {/* Meta bar */}
        <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-stone/15">
          <div className="flex items-center gap-3 text-stone text-sm">
            <span className="font-semibold text-onyx">{insight.readTime}</span>
            <span>·</span>
            <span>{formatDate(insight.publishedAt)}</span>
          </div>
          <div className="flex flex-wrap gap-2 ml-auto">
            {insight.tags.slice(0, 4).map(tag => (
              <span key={tag} className="text-xs text-stone/70 bg-stone/10 px-3 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Subtitle */}
        <p className="font-serif text-xl text-onyx/70 leading-relaxed border-l-2 border-champagne pl-5 mb-10 italic">
          {insight.subtitle}
        </p>

        {/* Action Bar — PDF + Email Share */}
        <InsightActions
          title={insight.title}
          url={`https://glowroute.io/insights/${insight.slug}`}
          excerpt={insight.excerpt}
        />

        {/* Report Body */}
        {htmlContent ? (
          <div
            className="insight-content"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-stone/15 p-8 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="font-serif text-2xl text-onyx mb-3">
              Report coming soon
            </h2>
            <p className="text-stone text-sm leading-relaxed max-w-sm mx-auto">
              This intelligence report is being prepared. Subscribe to get it the moment it&apos;s published.
            </p>
          </div>
        )}

        {/* Back Link bottom */}
        <div className="mt-12 pt-6 border-t border-stone/15">
          <Link
            href="/insights"
            className="inline-flex items-center gap-1.5 text-stone text-sm font-medium hover:text-sage transition-colors"
          >
            ← Back to Intelligence
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  )
}
