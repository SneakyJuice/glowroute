'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    goal: '',
    sex: '',
    age: '',
    budget: '',
    zip: ''
  });

  const totalSteps = 5;
  const progress = (step - 1) / totalSteps;

  const handleOptionSelect = (field: string, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setStep(6);
    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      setTimeout(() => { router.push(result.redirect_url); }, 1500);
    } catch (error) {
      console.error('Quiz submission failed:', error);
      setTimeout(() => { router.push('/telehealth'); }, 1500);
    }
  };

  const OptionButton = ({ label, field, value }: { label: string; field: string; value: string }) => (
    <button
      onClick={() => handleOptionSelect(field, value)}
      className={`p-6 text-left rounded-xl shadow-sm border-2 transition-all duration-200 ${
        formData[field as keyof typeof formData] === value
          ? 'border-sage bg-sage text-white'
          : 'border-stone-200 bg-white text-onyx hover:border-sage hover:shadow-md'
      }`}
    >
      <span className="font-sans text-lg font-medium">{label}</span>
    </button>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-display font-light text-white mb-2">What is your primary health goal?</h2>
            <p className="text-white/60 mb-8">Select one to continue</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Hormone Optimization', 'Weight Loss', 'Peptide Therapy', 'Sexual Health', 'Longevity & Anti-Aging', "Women's Health"].map(opt => (
                <OptionButton key={opt} label={opt} field="goal" value={opt} />
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-display font-light text-white mb-2">Which best describes you?</h2>
            <p className="text-white/60 mb-8">Helps us match the right provider</p>
            <div className="grid grid-cols-1 gap-4 max-w-md">
              {['Male', 'Female', 'Prefer not to say'].map(opt => (
                <OptionButton key={opt} label={opt} field="sex" value={opt} />
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-display font-light text-white mb-2">What is your age range?</h2>
            <p className="text-white/60 mb-8">Treatment protocols vary by age</p>
            <div className="grid grid-cols-1 gap-4 max-w-md">
              {['25-34', '35-44', '45-54', '55-64', '65+'].map(opt => (
                <OptionButton key={opt} label={opt} field="age" value={opt} />
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-display font-light text-white mb-2">What is your monthly budget?</h2>
            <p className="text-white/60 mb-8">We will match you to the best value option</p>
            <div className="grid grid-cols-1 gap-4 max-w-md">
              {['Under $100', '$100-$200', '$200-$400', '$400+'].map(opt => (
                <OptionButton key={opt} label={opt} field="budget" value={opt} />
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4 max-w-md">
            <h2 className="text-3xl md:text-4xl font-display font-light text-white mb-2">What is your ZIP code?</h2>
            <p className="text-white/60 mb-8">For provider availability in your area</p>
            <input
              type="text"
              name="zip"
              value={formData.zip}
              onChange={handleInputChange}
              placeholder="e.g. 33601"
              className="w-full p-4 text-lg border-2 border-sage/30 rounded-xl focus:border-sage focus:outline-none bg-white text-onyx"
              maxLength={5}
              pattern="[0-9]{5}"
            />
            <button
              onClick={handleSubmit}
              disabled={formData.zip.length < 5}
              className="w-full mt-4 p-4 bg-sage text-white text-lg rounded-xl font-semibold font-sans transition-all duration-200 hover:bg-sage/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Find My Match &rarr;
            </button>
          </div>
        );
      case 6:
        return (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-sage/30 border-t-sage rounded-full animate-spin mx-auto mb-8"></div>
            <h2 className="text-3xl font-display font-light text-white mb-3">Finding your match...</h2>
            <p className="text-white/60">Matching your goals with the best telehealth provider</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-onyx">
        {/* Progress bar */}
        {step <= totalSteps && (
          <div className="w-full bg-white/10">
            <div
              className="h-1 bg-sage transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}

        <div className="container mx-auto px-4 py-12">
          {step <= totalSteps && (
            <p className="text-white/40 text-sm text-center mb-8 uppercase tracking-widest font-sans">
              Step {step} of {totalSteps}
            </p>
          )}
          <div className="max-w-2xl mx-auto">
            {renderStep()}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
