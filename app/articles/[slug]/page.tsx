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
  // Track footnotes for numbered citations
  let fnCounter = 0
  const footnotes: { num: number; url: string; label: string }[] = []

  // Pre-process: collapse lines that are continuations of the same paragraph
  // Split into blocks by blank lines first
  const blocks = md.split(/\n\n+/)

  const renderedBlocks = blocks.map(block => {
    const trimmed = block.trim()
    if (!trimmed) return ''

    // Headings
    if (trimmed.startsWith('# ')) return `<h1 class="article-h1">${inlineRender(trimmed.slice(2), footnotes, () => ++fnCounter)}</h1>`
    if (trimmed.startsWith('## ')) return `<h2 class="article-h2">${inlineRender(trimmed.slice(3), footnotes, () => ++fnCounter)}</h2>`
    if (trimmed.startsWith('### ')) return `<h3 class="article-h3">${inlineRender(trimmed.slice(4), footnotes, () => ++fnCounter)}</h3>`

    // Horizontal rule
    if (/^---+$/.test(trimmed)) return '<hr class="article-rule"/>'

    // Blockquote
    if (trimmed.startsWith('> ')) {
      const content = trimmed.split('\n').map(l => l.replace(/^> ?/, '')).join(' ')
      return `<blockquote class="article-quote">${inlineRender(content, footnotes, () => ++fnCounter)}</blockquote>`
    }

    // Unordered list
    if (trimmed.split('\n').every(l => /^- /.test(l.trim()) || !l.trim())) {
      const items = trimmed.split('\n').filter(l => /^- /.test(l.trim()))
        .map(l => `<li>${inlineRender(l.replace(/^- /, ''), footnotes, () => ++fnCounter)}</li>`)
        .join('')
      return `<ul class="article-list">${items}</ul>`
    }

    // Ordered list
    if (trimmed.split('\n').every(l => /^\d+\. /.test(l.trim()) || !l.trim())) {
      const items = trimmed.split('\n').filter(l => /^\d+\. /.test(l.trim()))
        .map(l => `<li>${inlineRender(l.replace(/^\d+\. /, ''), footnotes, () => ++fnCounter)}</li>`)
        .join('')
      return `<ol class="article-list article-list--ordered">${items}</ol>`
    }

    // Already HTML (pass-through)
    if (trimmed.startsWith('<')) return trimmed

    // Paragraph (join lines)
    const text = trimmed.split('\n').join(' ')
    return `<p class="article-p">${inlineRender(text, footnotes, () => ++fnCounter)}</p>`
  })

  let html = renderedBlocks.filter(Boolean).join('\n')

  // Append footnotes / references section if any were captured
  if (footnotes.length > 0) {
    html += `<div class="article-footnotes"><h4 class="article-footnotes__title">References</h4><ol class="article-footnotes__list">`
    footnotes.forEach(f => {
      html += `<li id="fn${f.num}"><a href="${f.url}" target="_blank" rel="noopener" class="article-footnotes__link">${f.url}</a> — ${f.label}</li>`
    })
    html += `</ol></div>`
  }

  return html
}

function inlineRender(
  text: string,
  footnotes: { num: number; url: string; label: string }[],
  nextFn: () => number
): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // External links → numbered footnotes
    .replace(/\[(.+?)\]\((https?:\/\/[^)]+)\)/g, (_, label, url) => {
      const num = nextFn()
      footnotes.push({ num, url, label })
      return `<a href="${url}" target="_blank" rel="noopener" class="article-link">${label}<sup class="article-footnote-ref">[${num}]</sup></a>`
    })
    // Internal links
    .replace(/\[(.+?)\]\(([^)]+)\)/g, '<a href="$2" class="article-link">$1</a>')
    .replace(/`(.+?)`/g, '<code class="article-code">$1</code>')
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
