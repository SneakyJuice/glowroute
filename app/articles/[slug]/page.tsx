import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ARTICLES } from '@/data/articles'

interface PageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  return ARTICLES.map(article => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = ARTICLES.find(a => a.slug === params.slug)
  if (!article) return { title: 'Article Not Found | GlowRoute' }
  return {
    title: `${article.title} | The GlowRoute Edit`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [{ url: article.imageUrl, width: 800, height: 450, alt: article.title }],
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

export default function ArticleDetailPage({ params }: PageProps) {
  const article = ARTICLES.find(a => a.slug === params.slug)
  if (!article) notFound()

  return (
    <div className="min-h-screen bg-ivory font-sans">
      <Navbar />

      {/* Hero Image */}
      <div className="w-full h-[300px] md:h-[420px] overflow-hidden bg-stone/10">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Article Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">

        {/* Back Link */}
        <Link
          href="/articles"
          className="inline-flex items-center gap-1.5 text-stone text-sm font-medium hover:text-sage transition-colors mb-8"
        >
          ← Back to The Edit
        </Link>

        {/* Meta */}
        <div className="mb-6">
          <span className="inline-block bg-champagne/20 text-champagne text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
            {article.category}
          </span>
          <h1 className="font-serif text-4xl md:text-5xl text-onyx leading-tight tracking-tight mb-4">
            {article.title}
          </h1>
          <div className="flex items-center gap-3 text-stone text-sm">
            <span>{article.readTime}</span>
            <span>·</span>
            <span>{formatDate(article.publishedAt)}</span>
          </div>
        </div>

        {/* Excerpt */}
        <p className="font-serif text-xl text-onyx/80 leading-relaxed border-l-2 border-champagne pl-5 mb-10 italic">
          {article.excerpt}
        </p>

        {/* Placeholder Body */}
        <div className="bg-white rounded-2xl border border-stone/15 p-8 text-center">
          <div className="text-4xl mb-4">✨</div>
          <h2 className="font-serif text-2xl text-onyx mb-3">
            Full article coming soon
          </h2>
          <p className="text-stone text-sm leading-relaxed mb-6 max-w-sm mx-auto">
            Subscribe for early access to expert wellness content — delivered straight to your inbox.
          </p>
          <button className="bg-sage text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
            Subscribe for Early Access
          </button>
        </div>

        {/* Back Link bottom */}
        <div className="mt-10">
          <Link
            href="/articles"
            className="inline-flex items-center gap-1.5 text-stone text-sm font-medium hover:text-sage transition-colors"
          >
            ← Back to The Edit
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  )
}
