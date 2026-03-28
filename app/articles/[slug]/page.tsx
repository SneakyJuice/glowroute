import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import fs from 'fs'
import path from 'path'
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
    alternates: {
      canonical: `https://glowroute.io/articles/${article.slug}`,
    },
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

function renderMarkdown(md: string): string {
  return md
    .replace(/^# (.+)$/gm, '<h1 class="font-serif text-4xl text-onyx mb-6 mt-10">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="font-serif text-2xl text-onyx mb-4 mt-8 border-b border-stone/15 pb-2">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="font-serif text-xl text-onyx mb-3 mt-6">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-onyx">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(/^---$/gm, '<hr class="border-stone/20 my-8"/>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-champagne pl-5 italic text-onyx/70 my-6 font-serif text-lg">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li class="text-onyx/80 leading-relaxed mb-1 ml-4 list-disc">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul class="my-4 space-y-1">${match}</ul>`)
    .replace(/\[(.+?)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" class="text-sage underline underline-offset-2 hover:text-champagne transition-colors" target="_blank" rel="noopener">$1</a>')
    .replace(/\[(.+?)\]\(([^)]+)\)/g, '<a href="$2" class="text-sage underline underline-offset-2 hover:text-champagne transition-colors">$1</a>')
    .split('\n')
    .map(line => {
      if (!line.trim()) return ''
      if (/^<[hbuliabqp]/.test(line)) return line
      return `<p class="text-onyx/80 leading-relaxed mb-4">${line}</p>`
    })
    .join('\n')
    .replace(/<p[^>]*>\s*<\/p>/g, '')
}

function getArticleContent(contentFile?: string): string | null {
  if (!contentFile) return null
  try {
    const filePath = path.join(process.cwd(), 'content', 'articles', contentFile)
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

export default function ArticleDetailPage({ params }: PageProps) {
  const article = ARTICLES.find(a => a.slug === params.slug)
  if (!article) notFound()

  const rawContent = getArticleContent(article.contentFile)
  const renderedContent = rawContent ? renderMarkdown(rawContent) : null

  const articleUrl = `https://glowroute.io/articles/${article.slug}`
  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    author: {
      '@type': 'Person',
      name: 'GlowRoute Editorial Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'GlowRoute',
      url: 'https://glowroute.io',
    },
    mainEntityOfPage: articleUrl,
    url: articleUrl,
    image: article.imageUrl,
    articleSection: article.category,
  }

  if (article.tags?.length) {
    jsonLd.keywords = article.tags.join(', ')
  }
  if (rawContent) {
    jsonLd.articleBody = rawContent
  }

  return (
    <div className="min-h-screen bg-ivory font-sans">
      <Navbar />

      <Script
        id={`article-schema-${article.slug}`}
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block bg-champagne/20 text-champagne text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
              {article.category}
            </span>
            {article.audience && (
              <span className={`inline-block text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${
                article.audience === 'clinic'
                  ? 'bg-sage/15 text-sage'
                  : 'bg-blush/20 text-blush'
              }`}>
                {article.audience === 'clinic' ? 'For Clinics' : 'For Patients'}
              </span>
            )}
          </div>
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

        {/* Article Body or Placeholder */}
        {renderedContent ? (
          <div
            className="prose-glowroute"
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />
        ) : (
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
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-stone/15">
            <div className="flex flex-wrap gap-2">
              {article.tags.map(tag => (
                <span key={tag} className="text-xs text-stone/70 bg-stone/10 px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

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
