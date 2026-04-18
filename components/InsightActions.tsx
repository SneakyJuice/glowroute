'use client'

import { useState } from 'react'

interface InsightActionsProps {
  title: string
  url: string
  excerpt: string
}

export default function InsightActions({ title, url, excerpt }: InsightActionsProps) {
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailForm, setEmailForm] = useState({ to: '', cc: '', message: '' })
  const [emailSent, setEmailSent] = useState(false)
  const [sending, setSending] = useState(false)

  const defaultMessage = `I thought you'd find this GlowRoute market intelligence report valuable:\n\n"${title}"\n\n${excerpt}\n\nRead the full report here: ${url}`

  const handlePdfDownload = () => {
    // Open print dialog with the insight page — browser handles PDF
    window.print()
  }

  const handleEmailShare = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch('/api/share-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailForm.to,
          cc: emailForm.cc,
          message: emailForm.message || defaultMessage,
          reportTitle: title,
          reportUrl: url,
        }),
      })
      if (res.ok) {
        setEmailSent(true)
        setTimeout(() => {
          setShowEmailModal(false)
          setEmailSent(false)
          setEmailForm({ to: '', cc: '', message: '' })
        }, 2500)
      }
    } catch {
      // fallback: open mailto
      const subject = encodeURIComponent(`GlowRoute Intelligence: ${title}`)
      const body = encodeURIComponent(emailForm.message || defaultMessage)
      const cc = emailForm.cc ? `&cc=${encodeURIComponent(emailForm.cc)}` : ''
      window.location.href = `mailto:${emailForm.to}?subject=${subject}${cc}&body=${body}`
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3 py-4 border-y border-stone/15 my-8">
        <span className="text-xs font-semibold uppercase tracking-widest text-stone/60 mr-2">Share this report</span>

        {/* PDF Download */}
        <button
          onClick={handlePdfDownload}
          className="inline-flex items-center gap-2 text-sm font-semibold text-onyx bg-white border border-stone/25 px-4 py-2 rounded-full hover:bg-onyx hover:text-white hover:border-onyx transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </button>

        {/* Email Share */}
        <button
          onClick={() => setShowEmailModal(true)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-sage px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Share via Email
        </button>

        {/* Copy Link */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(url)
          }}
          className="inline-flex items-center gap-2 text-sm font-medium text-stone hover:text-onyx transition-colors px-2 py-2"
          title="Copy link"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Copy Link
        </button>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowEmailModal(false)}
              className="absolute top-4 right-4 text-stone/50 hover:text-onyx transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="font-serif text-xl text-onyx mb-1">Share Report</h3>
            <p className="text-stone text-sm mb-5">Send this intelligence report to your team or a clinic contact.</p>

            {emailSent ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✉️</div>
                <p className="font-semibold text-onyx">Report shared!</p>
                <p className="text-stone text-sm mt-1">Your email is on its way.</p>
              </div>
            ) : (
              <form onSubmit={handleEmailShare} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone mb-1.5">To *</label>
                  <input
                    type="email"
                    required
                    placeholder="recipient@example.com"
                    value={emailForm.to}
                    onChange={e => setEmailForm(p => ({ ...p, to: e.target.value }))}
                    className="w-full border border-stone/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone mb-1.5">CC (optional)</label>
                  <input
                    type="email"
                    placeholder="cc@example.com"
                    value={emailForm.cc}
                    onChange={e => setEmailForm(p => ({ ...p, cc: e.target.value }))}
                    className="w-full border border-stone/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone mb-1.5">Message</label>
                  <textarea
                    rows={4}
                    value={emailForm.message || defaultMessage}
                    onChange={e => setEmailForm(p => ({ ...p, message: e.target.value }))}
                    className="w-full border border-stone/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-sage text-white font-semibold py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {sending ? 'Sending…' : 'Send Report'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          nav, footer, .insight-actions-bar { display: none !important; }
          .insight-content { font-size: 12pt; }
        }
      `}</style>
    </>
  )
}
