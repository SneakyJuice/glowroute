import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import fs from 'fs'
import path from 'path'
import Link from 'next/link'

interface Props {
  params: { city: string; treatment: string }
}

function parseFrontmatter(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { meta: {} as Record<string, string>, body: content }
  const meta: Record<string, string> = {}
  match[1].split('\n').forEach(line => {
    const m = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/)
    if (m) meta[m[1]] = m[2]
  })
  return { meta, body: match[2] }
}

function mdToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2 text-white">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3 text-white">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mb-4 text-white">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-amber-400 hover:text-amber-300 underline">$1</a>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 mb-1">$2</li>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1 list-disc">$1</li>')
    .replace(/^---$/gm, '<hr class="border-zinc-700 my-8" />')
    .replace(/\n\n/g, '</p><p class="mb-4 text-zinc-300 leading-relaxed">')
    .replace(/^(?!<)(.+)$/gm, '<p class="mb-4 text-zinc-300 leading-relaxed">$1</p>')
    .replace(/<p class="mb-4 text-zinc-300 leading-relaxed"><\/p>/g, '')
}

function getPageContent(city: string, treatment: string) {
  const filePath = path.join(process.cwd(), 'public', 'seo-content', 'treatments', city, treatment, 'page.md')
  if (!fs.existsSync(filePath)) return null
  return fs.readFileSync(filePath, 'utf8')
}

export async function generateStaticParams() {
  const manifestPath = path.join(process.cwd(), 'output', 'seo-pages-manifest.json')
  if (!fs.existsSync(manifestPath)) return []
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  return manifest.map((p: { citySlug: string; treatment: string }) => ({
    city: p.citySlug,
    treatment: p.treatment,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const content = getPageContent(params.city, params.treatment)
  if (!content) return { title: 'GlowRoute' }
  const { meta } = parseFrontmatter(content)
  return {
    title: meta.title || 'GlowRoute',
    description: meta.description || '',
    alternates: {
      canonical: `https://glowroute.sealey.ai/locations/${params.city}/${params.treatment}`,
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://glowroute.sealey.ai/locations/${params.city}/${params.treatment}`,
    },
  }
}

export default function TreatmentCityPage({ params }: Props) {
  const content = getPageContent(params.city, params.treatment)
  if (!content) notFound()

  const { meta, body } = parseFrontmatter(content!)
  const html = mdToHtml(body)

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Minimal nav */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white tracking-tight">
            Glow<span className="text-amber-400">Route</span>
          </Link>
          <Link
            href={`https://glowroute.sealey.ai/?search=${encodeURIComponent(meta.city || '')}`}
            className="text-sm text-amber-400 hover:text-amber-300"
          >
            Find clinics near you →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber-400/10 text-amber-400 text-xs font-medium px-3 py-1 rounded-full mb-4">
            <span>•</span>
            <span>{meta.clinicCount}+ Verified Clinics in {meta.city}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {meta.title?.replace(' | Top Providers 2026', '')}
          </h1>
          <p className="text-zinc-400">{meta.description}</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <article
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>

      {/* CTA */}
      <div className="bg-zinc-900 border-t border-zinc-800 px-6 py-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">
          Ready to Find Your Provider in {meta.city}?
        </h2>
        <p className="text-zinc-400 mb-6">
          Browse {meta.clinicCount}+ verified clinics with real patient reviews.
        </p>
        <Link
          href={`https://glowroute.sealey.ai/?search=${encodeURIComponent(meta.city || '')}`}
          className="inline-flex items-center gap-2 bg-amber-400 text-zinc-950 font-semibold px-6 py-3 rounded-lg hover:bg-amber-300 transition-colors"
        >
          Search {meta.city} Clinics →
        </Link>
      </div>

      <footer className="border-t border-zinc-800 px-6 py-6 text-center text-zinc-500 text-sm">
        © 2026 GlowRoute · <Link href="/" className="hover:text-zinc-300">glowroute.sealey.ai</Link>
      </footer>
    </div>
  )
}
