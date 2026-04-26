"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Routing logic: map quiz goal → destination
function getOutcomeRoute(goal: string): { route: string; outcome: string } {
  if (
    goal === 'Lose weight & keep it off' ||
    goal === 'Manage a chronic condition'
  ) {
    return { route: '/telehealth', outcome: 'telehealth_glp1' };
  }
  if (goal === 'Improve body composition' || goal === 'Boost energy & metabolism') {
    return { route: '/bloodwork', outcome: 'bloodwork_performance' };
  }
  if (goal === 'General wellness') {
    return { route: '/bloodwork', outcome: 'bloodwork_wellness' };
  }
  return { route: '/telehealth', outcome: 'telehealth_general' };
}

const QuizPage = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    goal: '',
    triedPrograms: '',
    conditions: [] as string[],
    carePreference: '',
    name: '',
    email: '',
  });

  const handleNext = () => setStep((prev) => prev + 1);
  const handlePrev = () => setStep((prev) => prev - 1);

  const handleMultiSelect = (value: string) => {
    setAnswers((prev) => {
      const conditions = prev.conditions.includes(value)
        ? prev.conditions.filter((v) => v !== value)
        : [...prev.conditions, value];
      return { ...prev, conditions };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { route, outcome } = getOutcomeRoute(answers.goal);

    await fetch('/api/quiz-leads', {
      method: 'POST',
      body: JSON.stringify({
        name: answers.name,
        email: answers.email,
        answers: Object.values(answers).filter((v) => v !== '' && !Array.isArray(v)),
        quiz_outcome: outcome,
        goal: answers.goal,
        conditions: answers.conditions,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    // Store outcome for results page
    sessionStorage.setItem('quiz_outcome', outcome);
    sessionStorage.setItem('quiz_route', route);
    handleNext();
  };

  return (
    <div className="min-h-screen bg-ivory text-onyx">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        {/* Progress Bar */}
        <div className="w-full bg-onyx/20 rounded-full h-2 mb-12">
          <div
            className="bg-sage h-2 rounded-full transition-all duration-300"
            style={{ width: `${(Math.min(step, 5) / 5) * 100}%` }}
          ></div>
        </div>

        {step <= 5 && (
          <h2 className="text-lg text-center mb-8">Step {step} of 5</h2>
        )}

        {step === 1 && (
          <div className="max-w-2xl mx-auto bg-white border border-onyx/10 rounded-2xl shadow-md p-8">
            <h3 className="text-2xl font-semibold mb-6">What's your primary goal?</h3>
            {['Lose weight & keep it off', 'Improve body composition', 'Manage a chronic condition', 'Boost energy & metabolism', 'General wellness'].map((option) => (
              <label key={option} className="flex items-center space-x-3 mb-4 cursor-pointer">
                <input
                  type="radio"
                  name="goal"
                  value={option}
                  checked={answers.goal === option}
                  onChange={() => setAnswers({ ...answers, goal: option })}
                  className="w-4 h-4 text-sage focus:ring-sage"
                />
                <span className="text-lg">{option}</span>
              </label>
            ))}
            <div className="flex justify-end mt-8">
              <button
                onClick={handleNext}
                disabled={!answers.goal}
                className="bg-sage text-white rounded px-6 py-2 hover:opacity-90 disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-2xl mx-auto bg-white border border-onyx/10 rounded-2xl shadow-md p-8">
            <h3 className="text-2xl font-semibold mb-6">
              Have you tried weight loss programs before?
            </h3>
            {[
              'Yes, multiple times without lasting results',
              'Yes, with some success',
              'No, this is my first time',
              "I'm currently on a program",
            ].map((option) => (
              <label key={option} className="flex items-center space-x-3 mb-4 cursor-pointer">
                <input
                  type="radio"
                  name="triedPrograms"
                  value={option}
                  checked={answers.triedPrograms === option}
                  onChange={() => setAnswers({ ...answers, triedPrograms: option })}
                  className="w-4 h-4 text-sage focus:ring-sage"
                />
                <span className="text-lg">{option}</span>
              </label>
            ))}
            <div className="flex justify-between mt-8">
              <button onClick={handlePrev} className="text-onyx underline">← Back</button>
              <button
                onClick={handleNext}
                disabled={!answers.triedPrograms}
                className="bg-sage text-white rounded px-6 py-2 hover:opacity-90 disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-2xl mx-auto bg-white border border-onyx/10 rounded-2xl shadow-md p-8">
            <h3 className="text-2xl font-semibold mb-6">Any existing health conditions?</h3>
            <p className="text-gray-500 mb-4 text-sm">Select all that apply</p>
            {['Type 2 Diabetes', 'High Blood Pressure', 'High Cholesterol', 'Sleep Apnea', 'PCOS', 'Thyroid issues', 'None of the above'].map((option) => (
              <label key={option} className="flex items-center space-x-3 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={answers.conditions.includes(option)}
                  onChange={() => handleMultiSelect(option)}
                  className="w-4 h-4 text-sage focus:ring-sage"
                />
                <span className="text-lg">{option}</span>
              </label>
            ))}
            <div className="flex justify-between mt-8">
              <button onClick={handlePrev} className="text-onyx underline">← Back</button>
              <button
                onClick={handleNext}
                disabled={answers.conditions.length === 0}
                className="bg-sage text-white rounded px-6 py-2 hover:opacity-90 disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="max-w-2xl mx-auto bg-white border border-onyx/10 rounded-2xl shadow-md p-8">
            <h3 className="text-2xl font-semibold mb-6">How do you prefer to receive care?</h3>
            {['Online / telehealth (most convenient)', 'In-person at a clinic', 'Either — I just want results'].map((option) => (
              <label key={option} className="flex items-center space-x-3 mb-4 cursor-pointer">
                <input
                  type="radio"
                  name="carePreference"
                  value={option}
                  checked={answers.carePreference === option}
                  onChange={() => setAnswers({ ...answers, carePreference: option })}
                  className="w-4 h-4 text-sage focus:ring-sage"
                />
                <span className="text-lg">{option}</span>
              </label>
            ))}
            <div className="flex justify-between mt-8">
              <button onClick={handlePrev} className="text-onyx underline">← Back</button>
              <button
                onClick={handleNext}
                disabled={!answers.carePreference}
                className="bg-sage text-white rounded px-6 py-2 hover:opacity-90 disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="max-w-2xl mx-auto bg-white border border-onyx/10 rounded-2xl shadow-md p-8">
            <h3 className="text-2xl font-semibold mb-2">Almost there!</h3>
            <p className="text-gray-500 mb-6">Where should we send your personalized plan?</p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-lg mb-2">Name</label>
                <input
                  id="name"
                  type="text"
                  value={answers.name}
                  onChange={(e) => setAnswers({ ...answers, name: e.target.value })}
                  required
                  className="w-full border border-onyx/20 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sage"
                  placeholder="Your first name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-lg mb-2">Email</label>
                <input
                  id="email"
                  type="email"
                  value={answers.email}
                  onChange={(e) => setAnswers({ ...answers, email: e.target.value })}
                  required
                  className="w-full border border-onyx/20 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sage"
                  placeholder="you@example.com"
                />
              </div>
              <p className="text-xs text-gray-400">No spam. We'll send your personalized match results + relevant offers.</p>
              <div className="flex justify-between mt-8">
                <button type="button" onClick={handlePrev} className="text-onyx underline">← Back</button>
                <button
                  type="submit"
                  className="bg-sage text-white rounded px-6 py-2 hover:opacity-90"
                >
                  See my matches →
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 6 && (
          <QuizResults goal={answers.goal} carePreference={answers.carePreference} />
        )}
      </div>
      <Footer />
    </div>
  );
};

// Results component — routes based on goal
function QuizResults({ goal, carePreference }: { goal: string; carePreference: string }) {
  const { route } = getOutcomeRoute(goal);
  const isBloodwork = route === '/bloodwork';

  return (
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-3xl font-semibold mb-4">Your personalized plan is ready ✓</h2>
      <p className="text-gray-500 mb-10">Based on your answers, we've matched you with the best next step.</p>

      {isBloodwork ? (
        <div className="bg-white border border-onyx/10 rounded-2xl shadow-md p-8 mb-8">
          <div className="text-4xl mb-4">🧬</div>
          <h3 className="text-2xl font-semibold mb-3">Start with your baseline bloodwork</h3>
          <p className="text-gray-600 mb-6">
            The most effective health programs start with knowing your numbers.
            Get a full biomarker panel before starting any treatment protocol.
          </p>
          <a
            href="/bloodwork"
            className="inline-block bg-sage text-white py-3 px-8 rounded-lg hover:opacity-90 text-lg font-medium"
          >
            View Lab Options →
          </a>
        </div>
      ) : (
        <div className="bg-white border border-onyx/10 rounded-2xl shadow-md p-8 mb-8">
          <div className="text-4xl mb-4">💊</div>
          <h3 className="text-2xl font-semibold mb-3">Telehealth is your fastest path</h3>
          <p className="text-gray-600 mb-6">
            Based on your goal, a GLP-1 or hormone program through a licensed provider
            is your best starting point. No office visit required.
          </p>
          <a
            href="/telehealth"
            className="inline-block bg-sage text-white py-3 px-8 rounded-lg hover:opacity-90 text-lg font-medium"
          >
            View Telehealth Options →
          </a>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/clinics" className="text-sage hover:underline">Find a local clinic near you →</a>
        <span className="hidden sm:inline text-gray-300">|</span>
        <a href="/bloodwork" className="text-sage hover:underline">Order bloodwork first →</a>
      </div>
    </div>
  );
}

export default QuizPage;
