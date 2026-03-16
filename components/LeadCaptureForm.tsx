'use client'

import { useState } from 'react'

interface LeadCaptureFormProps {
  clinicName: string
}

type FormState = 'idle' | 'loading' | 'success' | 'error'

export default function LeadCaptureForm({ clinicName }: LeadCaptureFormProps) {
  const [state, setState] = useState<FormState>('idle')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, clinicName, message }),
      })

      if (!res.ok) throw new Error('Request failed')

      setState('success')
    } catch {
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="bg-ivory border border-sage/20 rounded-2xl p-5 text-center">
        <div className="text-2xl mb-2">✉️</div>
        <p className="font-serif text-lg text-onyx font-semibold">We&apos;ll be in touch.</p>
        <p className="text-sm text-stone mt-1">Someone from the GlowRoute team will reach out shortly.</p>
      </div>
    )
  }

  return (
    <div className="bg-ivory border border-sage/20 rounded-2xl p-5">
      <h3 className="font-serif text-lg font-semibold text-onyx mb-1">Contact This Clinic</h3>
      <p className="text-xs text-stone mb-4">Have questions? We&apos;ll connect you with the right team.</p>

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
            className="w-full text-sm border border-onyx/15 rounded-lg px-3 py-2 bg-white text-onyx placeholder-stone/60 focus:outline-none focus:border-sage/60 focus:ring-1 focus:ring-sage/30 transition"
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
            placeholder="jane@example.com"
            className="w-full text-sm border border-onyx/15 rounded-lg px-3 py-2 bg-white text-onyx placeholder-stone/60 focus:outline-none focus:border-sage/60 focus:ring-1 focus:ring-sage/30 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-onyx/80 mb-1" htmlFor="lead-message">
            Message <span className="text-stone/50">(optional)</span>
          </label>
          <textarea
            id="lead-message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="I&apos;m interested in..."
            rows={3}
            className="w-full text-sm border border-onyx/15 rounded-lg px-3 py-2 bg-white text-onyx placeholder-stone/60 focus:outline-none focus:border-sage/60 focus:ring-1 focus:ring-sage/30 transition resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={state === 'loading'}
          className="w-full bg-sage text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-sage/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {state === 'loading' ? 'Sending…' : 'Send Message'}
        </button>
      </form>
    </div>
  )
}
