'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory px-6 py-16 text-onyx">
      <div className="w-full max-w-md text-center">
        <p className="font-serif text-3xl tracking-tight">GlowRoute</p>
        <div className="mx-auto mt-6 h-px w-16 bg-champagne" />
        <h1 className="mt-6 font-serif text-4xl font-light">Temporarily unavailable</h1>
        <p className="mt-4 text-base leading-relaxed text-stone">
          We could not load this page just now. Please try again in a moment.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-8 bg-onyx px-6 py-3 text-sm tracking-wide text-ivory"
        >
          Try again
        </button>
        <a href="/" className="mt-4 block text-sm text-sage">
          Back to GlowRoute
        </a>
      </div>
    </main>
  )
}
