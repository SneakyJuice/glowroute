'use client'
import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ARTICLES } from '@/data/articles'
import QuizCTA from '@/components/QuizCTA'

type AudienceFilter = 'all' | 'consumer' | 'clinic'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ArticlesPage() {
  const [filter, setFilter] = useState<AudienceFilter>('all')

  const filtered = ARTICLES.filter(a => {
    if (filter === 'all') return true
    if (filter === 'consumer') return a.audience === 'consumer' || !a.audience
    if (filter === 'clinic') return a.audience === 'clinic'
    return true
  })

  const featured = filtered.filter(a => a.featured)
  const rest = filtered.filter(a => !a.featured)

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

        {/* Audience Filter Tabs */}
        <div className="flex items-center gap-2 mb-10">
          {(['all', 'consumer', 'clinic'] as AudienceFilter[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`text-sm font-semibold px-5 py-2 rounded-full transition-all ${
                filter === tab
                  ? 'bg-onyx text-ivory'
                  : 'bg-white text-stone border border-stone/20 hover:border-onyx/30 hover:text-onyx'
              }`}
            >
              {tab === 'all' ? 'All Articles' : tab === 'consumer' ? 'For Patients' : 'For Clinics'}
            </button>
          ))}
        </div>

        {/* Quiz CTA */}
        <div className="mb-8">
          <QuizCTA variant="inline" />
        </div>

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
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-block bg-champagne/20 text-champagne text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
                        {article.category}
                      </span>
                      {article.audience && (
                        <span className={`inline-block text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          article.audience === 'clinic'
                            ? 'bg-sage/15 text-sage'
                            : 'bg-blush/20 text-blush'
                        }`}>
                          {article.audience === 'clinic' ? 'Clinics' : 'Patients'}
                        </span>
                      )}
                    </div>
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
            <h2 className="font-serif text-2xl text-onyx mb-8 tracking-tight">
              {featured.length > 0 ? 'More from the Edit' : 'All Articles'}
            </h2>
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
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="inline-block bg-champagne/20 text-champagne text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                        {article.category}
                      </span>
                      {article.audience && (
                        <span className={`inline-block text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          article.audience === 'clinic'
                            ? 'bg-sage/15 text-sage'
                            : 'bg-blush/20 text-blush'
                        }`}>
                          {article.audience === 'clinic' ? 'Clinic' : 'Patient'}
                        </span>
                      )}
                    </div>
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

        {filtered.length === 0 && (
          <div className="text-center py-20 text-stone">
            <p className="font-serif text-2xl text-onyx/40 mb-2">No articles found</p>
            <p className="text-sm">Try a different filter</p>
          </div>
        )}

      </main>

      <Footer />
    </div>
  )
}
