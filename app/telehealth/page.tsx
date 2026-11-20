import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/config'
import TelehealthIndex from './TelehealthIndex'

const url = `${SITE_URL}/telehealth`

export const metadata: Metadata = {
  title: 'GLP-1 & Weight Loss, Delivered Online — GlowRoute',
  description: 'FDA-cleared treatments from licensed providers, without the waiting room.',
  alternates: { canonical: url },
}

export default function TelehealthPage() {
  return <TelehealthIndex />
}
