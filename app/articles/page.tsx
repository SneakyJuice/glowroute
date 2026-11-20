import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/config'
import ArticlesIndex from './ArticlesIndex'

const url = `${SITE_URL}/articles`

export const metadata: Metadata = {
  title: 'The GlowRoute Edit — Aesthetic Wellness Articles',
  description: 'Expert insights on modern aesthetics and wellness.',
  alternates: { canonical: url },
}

export default function ArticlesPage() {
  return <ArticlesIndex />
}
