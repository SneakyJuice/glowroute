"use client";

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const QuizPage = () => {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    goal: '',
    triedPrograms: '',
    conditions: [],
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
    await fetch('/api/quiz-leads', {
      method: 'POST',
      body: JSON.stringify({
        name: answers.name,
        email: answers.email,
        answers: Object.values(answers).filter((v) => v !== ''),
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    handleNext();
  };

  return (
    <div className="min-h-screen bg-ivory text-onyx">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        {/* Progress Bar */}
        <div className="w-full bg-onyx/20 rounded-full h-2 mb-12">
          <div
            className="bg-sage h-2 rounded-full"
            style={{ width: `${(step / 5) * 100}%` }}
          ></div>
        </div>

        {/* Step Indicator */}
        <h2 className="text-lg text-center mb-8">Step {step} of 5</h2>

        {step === 1 && (
          <div className="max-w-2xl mx-auto bg-white border border-onyx/10 rounded-2xl shadow-md p-8">
            <h3 className="text-2xl font-semibold mb-6">What's your primary goal?</h3>
            {['Lose weight & keep it off', 'Improve body composition', 'Manage a chronic condition', 'Boost energy & metabolism', 'General wellness'].map((option) => (
              <label key={option} className="flex items-center space-x-3 mb-4">
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
              'I\'m currently on a program',
            ].map((option) => (
              <label key={option} className="flex items-center space-x-3 mb-4">
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
              <button onClick={handlePrev} className="text-onyx underline">
                ← Back
              </button>
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
            <h3 className="text-2xl font-semibold mb-6">Any of these apply to you?</h3>
            {['BMI over 27', 'Type 2 diabetes or pre-diabetes', 'High blood pressure', 'Family history of obesity'].map((option) => (
              <label key={option} className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  name="conditions"
                  value={option}
                  checked={answers.conditions.includes(option)}
                  onChange={() => handleMultiSelect(option)}
                  className="w-4 h-4 text-sage focus:ring-sage"
                />
                <span className="text-lg">{option}</span>
              </label>
            ))}
            <label className="flex items-center space-x-3 mb-4">
              <input
                type="checkbox"
                name="conditions"
                value="None of the above"
                checked={answers.conditions.includes('None of the above')}
                onChange={() => {
                  if (answers.conditions.includes('None of the above')) {
                    setAnswers({ ...answers, conditions: [] });
                  } else {
                    setAnswers({ ...answers, conditions: ['None of the above'] });
                  }
                }}
                className="w-4 h-4 text-sage focus:ring-sage"
              />
              <span className="text-lg">None of the above</span>
            </label>
            <div className="flex justify-between mt-8">
              <button onClick={handlePrev} className="text-onyx underline">
                ← Back
              </button>
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
            <h3 className="text-2xl font-semibold mb-6">How do you prefer to get care?</h3>
            {['Online / telehealth (convenient)', 'In-person clinic', 'Either works for me'].map((option) => (
              <label key={option} className="flex items-center space-x-3 mb-4">
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
              <button onClick={handlePrev} className="text-onyx underline">
                ← Back
              </button>
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
            <h3 className="text-2xl font-semibold mb-6">What's your email?</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-lg mb-2">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={answers.name}
                  onChange={(e) => setAnswers({ ...answers, name: e.target.value })}
                  required
                  className="w-full border border-onyx/20 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sage"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-lg mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={answers.email}
                  onChange={(e) => setAnswers({ ...answers, email: e.target.value })}
                  required
                  className="w-full border border-onyx/20 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sage"
                />
              </div>
              <div className="flex justify-between mt-8">
                <button type="button" onClick={handlePrev} className="text-onyx underline">
                  ← Back
                </button>
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
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold mb-8 text-center">Your Top Matches</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Hone Health',
                  tagline: 'Testosterone + GLP-1 programs for men',
                  href: '#hone-affiliate',
                  bestMatch: true,
                },
                {
                  name: 'Henry Meds',
                  tagline: 'Semaglutide & tirzepatide, online prescriptions',
                  href: '#henry-meds-affiliate',
                },
                {
                  name: 'Maximus',
                  tagline: 'Men\'s performance & metabolic health',
                  href: '#maximus-affiliate',
                },
              ].map((provider, index) => (
                <div
                  key={index}
                  className="bg-white border border-onyx/10 rounded-2xl shadow-md p-6 relative"
                >
                  {provider.bestMatch && (
                    <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-champagne text-white text-xs font-bold px-3 py-1 rounded-full">
                      Best Match
                    </span>
                  )}
                  <h3 className="text-2xl font-serif font-semibold mb-2">{provider.name}</h3>
                  <p className="text-gray-700 mb-4">{provider.tagline}</p>
                  <a
                    href={provider.href}
                    className="inline-block bg-champagne text-white py-2 px-4 rounded hover:opacity-90"
                  >
                    Learn More →
                  </a>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <a href="/telehealth" className="text-sage hover:underline">
                View all telehealth providers →
              </a>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default QuizPage;