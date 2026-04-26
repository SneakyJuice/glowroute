"use client";

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const PARTNERS = [
  {
    id: 'rythm',
    name: 'Rythm Health',
    tagline: 'Monthly at-home blood testing',
    description:
      'Track 20+ key biomarkers monthly from home. Painless finger-prick collection, results in days. The fastest-growing lab testing service in the US.',
    price: '$79/mo',
    badge: 'Most Popular',
    badgeColor: 'bg-sage',
    highlights: ['At-home collection (no lab visit)', '20+ biomarkers tracked', 'Monthly subscription', 'Personalized insights'],
    href: 'https://rythmhealth.com', // TODO: replace with affiliate link
    affiliateParam: 'rythm',
  },
  {
    id: 'function',
    name: 'Function Health',
    tagline: 'Comprehensive annual bloodwork',
    description:
      '100+ biomarkers in a single draw. Physician-reviewed results with personalized action plans. The gold standard for longevity-focused health tracking.',
    price: '$499/yr',
    badge: 'Most Comprehensive',
    badgeColor: 'bg-champagne',
    highlights: ['100+ biomarkers', 'Physician review included', 'HSA/FSA eligible', 'Trending over time'],
    href: 'https://functionhealth.com', // TODO: replace with affiliate link via Impact
    affiliateParam: 'function',
  },
  {
    id: 'ulta',
    name: 'Ulta Lab Tests',
    tagline: 'Order any test, no prescription needed',
    description:
      'Choose from 2,000+ individual tests or panels. No doctor's order required. Walk into any LabCorp or Quest location near you.',
    price: 'From $19',
    badge: 'Most Flexible',
    badgeColor: 'bg-onyx',
    highlights: ['2,000+ tests available', 'No Rx required', 'Walk-in at LabCorp/Quest', '10% affiliate savings'],
    href: 'https://ultalabtests.com', // TODO: replace with affiliate link
    affiliateParam: 'ulta',
  },
];

export default function BloodworkPage() {
  const [showGate, setShowGate] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<typeof PARTNERS[0] | null>(null);
  const [gateForm, setGateForm] = useState({ name: '', email: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSelectPartner = (partner: typeof PARTNERS[0]) => {
    setSelectedPartner(partner);
    setShowGate(true);
  };

  const handleGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner) return;

    await fetch('/api/bloodwork-leads', {
      method: 'POST',
      body: JSON.stringify({
        name: gateForm.name,
        email: gateForm.email,
        bloodwork_partner: selectedPartner.id,
        referral_source: 'bloodwork_page',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    setSubmitted(true);

    // Redirect after brief delay
    setTimeout(() => {
      window.open(
        `${selectedPartner.href}?ref=glowroute&partner=${selectedPartner.affiliateParam}`,
        '_blank'
      );
      setShowGate(false);
      setSubmitted(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-ivory text-onyx">
      <Navbar />

      {/* Hero */}
      <section className="py-20 text-center bg-white border-b border-onyx/10">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-5xl mb-6">🧬</div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-6">
            Know Your Numbers First
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Every effective treatment starts with a baseline. Whether you're exploring
            GLP-1s, peptides, or hormones — your bloodwork tells the full story.
          </p>
          <p className="text-gray-400 text-sm">
            GlowRoute has vetted these labs for accuracy, accessibility, and value.
          </p>
        </div>
      </section>

      {/* Why Bloodwork Section */}
      <section className="py-14 bg-ivory">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-semibold text-center mb-10">Why get tested before starting a program?</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            {[
              { icon: '🎯', title: 'Personalized dosing', desc: 'Your provider needs your baseline to prescribe correctly. Not everyone needs the same dose.' },
              { icon: '📈', title: 'Track real progress', desc: 'Before/after panels show what actually changed — not just weight, but hormones, inflammation, and metabolic markers.' },
              { icon: '🔒', title: 'Rule out contraindications', desc: 'Some conditions require bloodwork before starting GLP-1s or hormone therapy. Know before you start.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-onyx/10 shadow-sm">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Cards */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl font-serif font-semibold text-center mb-4">Choose your lab partner</h2>
          <p className="text-center text-gray-500 mb-12">All vetted by GlowRoute. All available without a referral.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {PARTNERS.map((partner) => (
              <div
                key={partner.id}
                className="bg-ivory border border-onyx/10 rounded-2xl shadow-md overflow-hidden flex flex-col relative"
              >
                <div className={`${partner.badgeColor} text-white text-xs font-bold px-3 py-1 text-center`}>
                  {partner.badge}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-serif font-semibold mb-1">{partner.name}</h3>
                  <p className="text-gray-400 text-sm mb-3">{partner.tagline}</p>
                  <p className="text-gray-600 text-sm mb-4">{partner.description}</p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {partner.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-sage">✓</span> {h}
                      </li>
                    ))}
                  </ul>
                  <div className="text-2xl font-semibold text-onyx mb-4">{partner.price}</div>
                  <button
                    onClick={() => handleSelectPartner(partner)}
                    className="w-full bg-sage text-white rounded-lg py-3 hover:opacity-90 font-medium"
                  >
                    Get Started →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Gate Modal */}
      {showGate && selectedPartner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            {!submitted ? (
              <>
                <h3 className="text-2xl font-semibold mb-2">One quick step</h3>
                <p className="text-gray-500 mb-6 text-sm">
                  We'll send your personalized results guide + exclusive discount code for {selectedPartner.name}.
                </p>
                <form onSubmit={handleGateSubmit} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={gateForm.name}
                    onChange={(e) => setGateForm({ ...gateForm, name: e.target.value })}
                    required
                    className="w-full border border-onyx/20 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sage"
                  />
                  <input
                    type="email"
                    placeholder="Your email"
                    value={gateForm.email}
                    onChange={(e) => setGateForm({ ...gateForm, email: e.target.value })}
                    required
                    className="w-full border border-onyx/20 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sage"
                  />
                  <button type="submit" className="w-full bg-sage text-white rounded-lg py-3 hover:opacity-90 font-medium">
                    Continue to {selectedPartner.name} →
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGate(false)}
                    className="w-full text-gray-400 text-sm underline mt-2"
                  >
                    Skip this step
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✓</div>
                <h3 className="text-xl font-semibold mb-2">Got it!</h3>
                <p className="text-gray-500 text-sm">Redirecting you to {selectedPartner.name}...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quiz CTA */}
      <section className="py-14 bg-ivory text-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-2xl font-semibold mb-4">Not sure which test you need?</h2>
          <p className="text-gray-500 mb-6">Take our 2-minute quiz and we'll match you to the right panel for your goal.</p>
          <a href="/quiz" className="inline-block bg-champagne text-white py-3 px-8 rounded-lg hover:opacity-90 font-medium">
            Take the Quiz →
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
