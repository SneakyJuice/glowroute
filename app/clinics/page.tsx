import { Metadata } from 'next'
import ClinicsClient from './ClinicsClient'

export const metadata: Metadata = {
  title: 'Find Top-Rated Clinics in Florida | GlowRoute',
  description: 'Discover and compare the best clinics in Florida for your needs. Filter by specialty, location, ratings, and more.',
}

export default function ClinicsPage() {
  return <ClinicsClient />
}