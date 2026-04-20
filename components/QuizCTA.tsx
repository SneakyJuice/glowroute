'use client'

interface QuizCTAProps {
  variant?: 'banner' | 'inline' | 'sidebar'
}

export default function QuizCTA({ variant = 'banner' }: QuizCTAProps) {
  if (variant === 'banner') {
    return (
      <section className="bg-onyx py-10 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-champagne text-xs font-semibold uppercase tracking-widest mb-3">Free · 2 minutes</p>
          <h2 className="font-serif text-3xl font-light text-white mb-3 leading-tight">
            Not sure which treatment is <span className="text-champagne">right for you?</span>
          </h2>
          <p className="text-white/60 text-sm mb-6">
            Answer 5 quick questions and get matched to the right provider.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a
              href="/quiz?utm_source=banner&utm_medium=cta"
              className="bg-champagne text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              Take the Free Quiz →
            </a>
            <a
              href="/clinics"
              className="text-white/60 text-sm underline hover:text-white transition-colors"
            >
              Browse Clinics
            </a>
          </div>
        </div>
      </section>
    )
  }

  if (variant === 'inline') {
    return (
      <div className="border-l-4 border-sage bg-white rounded-2xl shadow-sm px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="font-serif text-lg text-onyx font-semibold mb-1">Find your treatment match</h3>
          <p className="text-stone text-sm">Answer 5 quick questions and get personalized provider recommendations.</p>
        </div>
        <a
          href="/quiz?utm_source=inline&utm_medium=cta"
          className="flex-shrink-0 bg-sage text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          Take the Quiz →
        </a>
      </div>
    )
  }

  // sidebar
  return (
    <div className="bg-white border border-champagne/30 rounded-2xl p-5">
      <h3 className="font-serif text-lg text-onyx font-semibold mb-1">Find Your Match</h3>
      <p className="text-stone text-xs leading-relaxed mb-4">
        Not sure what's right for you? Take our 2-minute quiz for personalized recommendations.
      </p>
      <a
        href="/quiz?utm_source=sidebar&utm_medium=cta"
        className="block w-full bg-sage text-white text-sm font-semibold text-center py-2.5 rounded-xl hover:opacity-90 transition-opacity"
      >
        Take the Free Quiz →
      </a>
    </div>
  )
}
