import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/config'
import { QUIZ_METADATA } from '@/lib/seo-page-overrides'

const quizUrl = `${SITE_URL}${QUIZ_METADATA.canonicalPath}`

export const metadata: Metadata = {
  title: QUIZ_METADATA.title,
  description: QUIZ_METADATA.description,
  keywords: [],
  alternates: { canonical: quizUrl },
  openGraph: {
    title: QUIZ_METADATA.title,
    description: QUIZ_METADATA.description,
    url: quizUrl,
    type: 'website',
    siteName: 'GlowRoute',
  },
  twitter: {
    card: 'summary_large_image',
    title: QUIZ_METADATA.title,
    description: QUIZ_METADATA.description,
  },
}

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return children
}
