"use client";

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const TelehealthPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-ivory text-onyx">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-onyx text-white py-20 px-4 text-center">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            GLP-1 & Weight Loss, Delivered Online
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-champagne">
            FDA-cleared treatments. Licensed providers. No waiting rooms.
          </p>
          <a
            href="/quiz"
            className="bg-champagne text-onyx px-8 py-3 rounded text-lg font-semibold hover:opacity-90 transition"
          >
            Take the Free Quiz →
          </a>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center">
              <span className="text-5xl mb-4">🩺</span>
              <h3 className="text-xl font-semibold mb-2">Complete your health profile</h3>
              <p className="text-gray-700">(5 min)</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-5xl mb-4">💊</span>
              <h3 className="text-xl font-semibold mb-2">Get matched to a licensed provider</h3>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-5xl mb-4">📦</span>
              <h3 className="text-xl font-semibold mb-2">Medication delivered to your door</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Provider Cards */}
      <section className="py-16 px-4 bg-ivory">
        <div className="container mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-12">Our Trusted Telehealth Providers</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Hone Health',
                description: 'Testosterone + GLP-1 programs for men',
                tags: ['semaglutide', 'GLP-1'],
                href: '#hone-affiliate',
              },
              {
                name: 'Henry Meds',
                description: 'Semaglutide & tirzepatide, online prescriptions',
                tags: ['semaglutide', 'tirzepatide', 'GLP-1'],
                href: '#henry-meds-affiliate',
              },
              {
                name: 'Maximus',
                description: 'Men\'s performance & metabolic health',
                tags: ['semaglutide', 'tirzepatide', 'GLP-1'],
                href: '#maximus-affiliate',
              },
            ].map((provider, index) => (
              <div key={index} className="bg-white border border-onyx/10 rounded-2xl shadow-md p-6">
                <h3 className="text-2xl font-serif font-semibold mb-2">{provider.name}</h3>
                <p className="text-gray-700 mb-4">{provider.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {provider.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-onyx/10 text-onyx px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <a
                  href={provider.href}
                  className="inline-block bg-champagne text-white py-2 px-4 rounded hover:opacity-90"
                >
                  Learn More →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-semibold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Is this covered by insurance?',
                a: 'Most GLP-1 programs are not covered but many providers offer payment plans starting at $99/month.',
              },
              {
                q: 'How quickly can I start?',
                a: 'Most patients get a prescription within 48 hours of completing their health intake.',
              },
              {
                q: 'Is it safe?',
                a: 'All providers on GlowRoute are licensed in your state and follow FDA guidelines.',
              },
              {
                q: 'What\'s the difference between semaglutide and tirzepatide?',
                a: 'Both are GLP-1 medications. Tirzepatide (Mounjaro/Zepbound) also targets GIP receptors and may produce greater weight loss.',
              },
            ].map((item, index) => (
              <div key={index} className="border border-onyx/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left px-6 py-4 bg-white hover:bg-ivory transition"
                >
                  <h3 className="text-lg font-semibold flex justify-between items-center">
                    {item.q}
                    <span className="text-xl">{openFaq === index ? '−' : '+'}</span>
                  </h3>
                </button>
                {openFaq === index && (
                  <div className="px-6 py-4 bg-ivory border-t border-onyx/10">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-4 bg-onyx text-white text-center">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl mb-6">Ready to find your match?</h2>
          <a
            href="/quiz"
            className="bg-champagne text-onyx px-8 py-3 rounded text-lg font-semibold hover:opacity-90 transition"
          >
            Take the Quiz →
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TelehealthPage;