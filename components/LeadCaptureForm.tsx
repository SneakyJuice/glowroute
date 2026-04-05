'use client'

import { useState } from 'react'

interface LeadCaptureFormProps {
  clinicName: string
  clinicSlug?: string
  treatments?: string[]
}

type FormState = 'idle' | 'loading' | 'success' | 'error'

export default function LeadCaptureForm({ clinicName, clinicSlug, treatments = [] }: LeadCaptureFormProps) {
  const [state, setState] = useState<FormState>('idle')
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [phone, setPhone]         = useState('')
  const [treatment, setTreatment] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          treatment: treatment || undefined,
          clinicSlug,
          clinicName,
        }),
      })
      if (!res.ok) throw new Error('Request failed')
      setState('success')
    } catch {
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div id="lead-form" className="bg-ivory border border-sage/20 rounded-2xl p-5 text-center">
        <div className="text-2xl mb-2">✉️</div>
        <p className="font-serif text-lg text-onyx font-semibold">Request sent!</p>
        <p className="text-sm text-stone mt-1">
          We&apos;ve notified {clinicName}. Expect a reply within 1 business day.
        </p>
      </div>
    )
  }

  return (
    <div id="lead-form" className="bg-ivory border border-sage/20 rounded-2xl p-5">
      <h3 className="font-serif text-lg font-semibold text-onyx mb-0.5">Request Appointment</h3>
      <p className="text-xs text-stone mb-4">We&apos;ll connect you with {clinicName}.</p>

      {state === 'error' && (
        <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Something went wrong. Please try again.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-onyx/80 mb-1" htmlFor="lead-name">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            id="lead-name"
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full text-sm border border-onyx/15 rounded-lg px-3 py-2 bg-white text-onyx placeholder-stone/50 focus:outline-none focus:border-sage/60 focus:ring-1 focus:ring-sage/30 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-onyx/80 mb-1" htmlFor="lead-email">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            id="lead-email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="jane@email.com"
            className="w-full text-sm border border-onyx/15 rounded-lg px-3 py-2 bg-white text-onyx placeholder-stone/50 focus:outline-none focus:border-sage/60 focus:ring-1 focus:ring-sage/30 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-onyx/80 mb-1" htmlFor="lead-phone">
            Phone
          </label>
          <input
            id="lead-phone"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+1 (813) 000-0000"
            className="w-full text-sm border border-onyx/15 rounded-lg px-3 py-2 bg-white text-onyx placeholder-stone/50 focus:outline-none focus:border-sage/60 focus:ring-1 focus:ring-sage/30 transition"
          />
        </div>

        {treatments.length > 0 ? (
          <div>
            <label className="block text-xs font-medium text-onyx/80 mb-1" htmlFor="lead-treatment">
              Treatment Interest
            </label>
            <select
              id="lead-treatment"
              value={treatment}
              onChange={e => setTreatment(e.target.value)}
              className="w-full text-sm border border-onyx/15 rounded-lg px-3 py-2 bg-white text-onyx focus:outline-none focus:border-sage/60 focus:ring-1 focus:ring-sage/30 transition"
            >
              <option value="">Select a treatment…</option>
              {treatments.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
              <option value="General Inquiry">General Inquiry</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-onyx/80 mb-1" htmlFor="lead-treatment-text">
              Treatment Interest
            </label>
            <input
              id="lead-treatment-text"
              type="text"
              value={treatment}
              onChange={e => setTreatment(e.target.value)}
              placeholder="e.g. Botox, IV Therapy…"
              className="w-full text-sm border border-onyx/15 rounded-lg px-3 py-2 bg-white text-onyx placeholder-stone/50 focus:outline-none focus:border-sage/60 focus:ring-1 focus:ring-sage/30 transition"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={state === 'loading'}
          className="w-full bg-sage text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-sage/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {state === 'loading' ? 'Sending…' : 'Request Appointment →'}
        </button>

        <p className="text-[10px] text-stone text-center">
          Free to use · No spam · We&apos;ll connect you directly
        </p>
      </form>
    </div>
  )
}
