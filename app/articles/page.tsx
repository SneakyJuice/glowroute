import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ARTICLES } from '@/data/articles'

export const metadata: Metadata = {
  title: 'The GlowRoute Edit | Expert Wellness Insights',
  description: 'Expert insights on modern aesthetics & wellness — curated articles from GlowRoute.',
  openGraph: {
    title: 'The GlowRoute Edit | Expert Wellness Insights',
    description: 'Expert insights on modern aesthetics & wellness — curated articles from GlowRoute.',
    type: 'website',
    siteName: 'GlowRoute',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The GlowRoute Edit | Expert Wellness Insights',
    description: 'Expert insights on modern aesthetics & wellness — curated articles from GlowRoute.',
  },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ArticlesPage() {
  const featured = ARTICLES.filter(a => a.featured)
  const rest = ARTICLES.filter(a => !a.featured)

  return (
    <div className="min-h-screen bg-ivory font-sans">
      <Navbar />

      {/* Hero */}
      <section className="bg-onyx py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-serif text-5xl font-light text-ivory leading-tight tracking-tight mb-4">
            The GlowRoute Edit
          </h1>
          <p className="text-base text-stone max-w-md mx-auto leading-relaxed">
            Expert insights on modern aesthetics &amp; wellness
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-14">

        {/* Featured Articles */}
        {featured.length > 0 && (
          <section className="mb-14">
            <h2 className="font-serif text-2xl text-onyx mb-8 tracking-tight">Featured</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featured.map(article => (
                <Link
                  key={article.slug}
                  href={`/articles/${article.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-stone/15 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                >
                  {/* Image */}
                  <div className="w-full aspect-[16/9] overflow-hidden bg-stone/10">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <span className="inline-block bg-champagne/20 text-champagne text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-3 self-start">
                      {article.category}
                    </span>
                    <h3 className="font-serif text-2xl text-onyx leading-snug mb-2 group-hover:text-sage transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-stone text-sm leading-relaxed mb-4 flex-1">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-3 text-stone text-xs">
                        <span>{article.readTime}</span>
                        <span>·</span>
                        <span>{formatDate(article.publishedAt)}</span>
                      </div>
                      <span className="text-sage text-sm font-semibold group-hover:translate-x-1 transition-transform">
                        Read Article →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Remaining Articles Grid */}
        {rest.length > 0 && (
          <section>
            <h2 className="font-serif text-2xl text-onyx mb-8 tracking-tight">More from the Edit</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map(article => (
                <Link
                  key={article.slug}
                  href={`/articles/${article.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-stone/15 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                >
                  {/* Image */}
                  <div className="w-full aspect-[16/9] overflow-hidden bg-stone/10">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <span className="inline-block bg-champagne/20 text-champagne text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-2 self-start">
                      {article.category}
                    </span>
                    <h3 className="font-serif text-xl text-onyx leading-snug mb-2 group-hover:text-sage transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-stone text-sm leading-relaxed mb-4 flex-1 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2 text-stone text-xs">
                        <span>{article.readTime}</span>
                        <span>·</span>
                        <span>{formatDate(article.publishedAt)}</span>
                      </div>
                      <span className="text-sage text-xs font-semibold group-hover:translate-x-1 transition-transform">
                        Read →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>

      <Footer />
    </div>
  )
}
