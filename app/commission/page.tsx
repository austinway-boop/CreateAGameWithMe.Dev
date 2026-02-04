'use client';

import { useState } from 'react';
import { 
  Calculator, 
  DollarSign, 
  Briefcase, 
  Star, 
  Layers, 
  Clock,
  Monitor,
  Sparkles,
  ChevronRight,
  Lightbulb,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

// Duolingo-style colors
const PINK = '#ec4899';
const ORANGE = '#FF9600';
const GREEN = '#22c55e';
const GRAY = '#e5e7eb';

const SKILL_TYPES = [
  { id: 'programming', label: 'Programming', icon: '💻' },
  { id: '3d-modeling', label: '3D Modeling', icon: '🎨' },
  { id: '2d-art', label: '2D Art/UI', icon: '🖼️' },
  { id: 'animation', label: 'Animation', icon: '🎬' },
  { id: 'sound-design', label: 'Sound Design', icon: '🎵' },
  { id: 'game-design', label: 'Game Design', icon: '🎮' },
  { id: 'level-design', label: 'Level Design', icon: '🗺️' },
  { id: 'vfx', label: 'VFX/Particles', icon: '✨' },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Beginner', description: '0-1 years', color: GREEN },
  { id: 'intermediate', label: 'Intermediate', description: '1-3 years', color: ORANGE },
  { id: 'advanced', label: 'Advanced', description: '3-5 years', color: PINK },
  { id: 'expert', label: 'Expert', description: '5+ years', color: '#8b5cf6' },
];

const COMPLEXITY_LEVELS = [
  { id: 'simple', label: 'Simple', description: 'Basic implementation' },
  { id: 'moderate', label: 'Moderate', description: 'Some custom work' },
  { id: 'complex', label: 'Complex', description: 'Significant custom work' },
  { id: 'advanced', label: 'Advanced', description: 'Highly specialized' },
];

const PLATFORMS = [
  { id: 'roblox', label: 'Roblox' },
  { id: 'unity', label: 'Unity' },
  { id: 'unreal', label: 'Unreal Engine' },
  { id: 'godot', label: 'Godot' },
  { id: 'web', label: 'Web/HTML5' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'other', label: 'Other' },
];

interface PricingResult {
  hourlyRateLow: number;
  hourlyRateHigh: number;
  recommendedHourlyRate: number;
  totalEstimateLow: number;
  totalEstimateHigh: number;
  recommendedTotal: number;
  rationale: string;
  marketInsights: string;
  negotiationTips: string[];
}

function darken(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
  const b = Math.max(0, (num & 0xFF) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default function CommissionCalculatorPage() {
  const [step, setStep] = useState(1);
  const [skillType, setSkillType] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [complexity, setComplexity] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(10);
  const [platform, setPlatform] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PricingResult | null>(null);
  const [error, setError] = useState('');

  const totalSteps = 5;

  const canProceed = () => {
    switch (step) {
      case 1: return skillType !== '';
      case 2: return experienceLevel !== '';
      case 3: return complexity !== '';
      case 4: return platform !== '';
      case 5: return estimatedHours > 0;
      default: return false;
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/calculateCommission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillType: SKILL_TYPES.find(s => s.id === skillType)?.label || skillType,
          experienceLevel: EXPERIENCE_LEVELS.find(e => e.id === experienceLevel)?.label || experienceLevel,
          projectComplexity: COMPLEXITY_LEVELS.find(c => c.id === complexity)?.label || complexity,
          estimatedHours,
          platform: PLATFORMS.find(p => p.id === platform)?.label || platform,
          additionalContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate pricing');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to calculate pricing. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleCalculate();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const resetCalculator = () => {
    setStep(1);
    setSkillType('');
    setExperienceLevel('');
    setComplexity('');
    setEstimatedHours(10);
    setPlatform('');
    setAdditionalContext('');
    setResult(null);
    setError('');
  };

  // Results View
  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="px-6 py-4 border-b bg-white">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: GREEN, boxShadow: `0 3px 0 ${darken(GREEN, 40)}` }}
            >
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Commission Calculator</h1>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">
          {/* Result Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Pricing Analysis Complete
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Fair Rate</h2>
            <p className="text-gray-500">Based on AI market analysis</p>
          </div>

          {/* Main Pricing Card */}
          <div 
            className="bg-white rounded-2xl p-6 mb-6"
            style={{ boxShadow: '0 4px 0 #e5e7eb' }}
          >
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-1">Recommended Hourly Rate</p>
              <p className="text-5xl font-bold text-gray-900">
                ${result.recommendedHourlyRate}
                <span className="text-lg font-normal text-gray-400">/hr</span>
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Range: ${result.hourlyRateLow} - ${result.hourlyRateHigh}/hr
              </p>
            </div>

            <div className="border-t pt-6">
              <p className="text-sm text-gray-500 mb-1 text-center">Total Project Estimate</p>
              <p className="text-3xl font-bold text-center" style={{ color: PINK }}>
                ${result.recommendedTotal.toLocaleString()}
              </p>
              <p className="text-sm text-gray-400 text-center mt-1">
                Range: ${result.totalEstimateLow.toLocaleString()} - ${result.totalEstimateHigh.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Rationale Card */}
          <div 
            className="bg-white rounded-2xl p-5 mb-4"
            style={{ boxShadow: '0 3px 0 #e5e7eb' }}
          >
            <div className="flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: ORANGE, boxShadow: `0 2px 0 ${darken(ORANGE, 40)}` }}
              >
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Pricing Rationale</h3>
                <p className="text-gray-600 text-sm">{result.rationale}</p>
              </div>
            </div>
          </div>

          {/* Market Insights Card */}
          <div 
            className="bg-white rounded-2xl p-5 mb-4"
            style={{ boxShadow: '0 3px 0 #e5e7eb' }}
          >
            <div className="flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: PINK, boxShadow: `0 2px 0 ${darken(PINK, 40)}` }}
              >
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Market Insights</h3>
                <p className="text-gray-600 text-sm">{result.marketInsights}</p>
              </div>
            </div>
          </div>

          {/* Negotiation Tips Card */}
          <div 
            className="bg-white rounded-2xl p-5 mb-8"
            style={{ boxShadow: '0 3px 0 #e5e7eb' }}
          >
            <div className="flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#8b5cf6', boxShadow: `0 2px 0 ${darken('#8b5cf6', 40)}` }}
              >
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2">Negotiation Tips</h3>
                <ul className="space-y-2">
                  {result.negotiationTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <span 
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: GREEN }}
                      >
                        {index + 1}
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetCalculator}
            className="w-full py-4 rounded-2xl text-white font-bold text-sm uppercase tracking-wide
              active:translate-y-0.5 active:shadow-none transition-all"
            style={{ 
              backgroundColor: ORANGE,
              boxShadow: `0 4px 0 ${darken(ORANGE, 40)}`
            }}
          >
            Calculate Another
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b bg-white">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: ORANGE, boxShadow: `0 3px 0 ${darken(ORANGE, 40)}` }}
          >
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Commission Calculator</h1>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="px-6 py-4 bg-white border-b">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className="flex-1 h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: index < step ? PINK : GRAY,
                }}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">Step {step} of {totalSteps}</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Step 1: Skill Type */}
          {step === 1 && (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <div 
                  className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4"
                  style={{ backgroundColor: ORANGE, boxShadow: `0 4px 0 ${darken(ORANGE, 40)}` }}
                >
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">What type of work?</h2>
                <p className="text-gray-500">Select the skill category for the commission</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {SKILL_TYPES.map((skill) => (
                  <button
                    key={skill.id}
                    onClick={() => setSkillType(skill.id)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      skillType === skill.id 
                        ? 'ring-2 ring-offset-2 ring-pink-500' 
                        : 'hover:scale-[1.02]'
                    }`}
                    style={{
                      backgroundColor: 'white',
                      boxShadow: skillType === skill.id 
                        ? `0 4px 0 ${darken(PINK, 40)}` 
                        : '0 3px 0 #e5e7eb',
                    }}
                  >
                    <span className="text-2xl mb-2 block">{skill.icon}</span>
                    <span className="font-semibold text-gray-900">{skill.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Experience Level */}
          {step === 2 && (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <div 
                  className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4"
                  style={{ backgroundColor: PINK, boxShadow: `0 4px 0 ${darken(PINK, 40)}` }}
                >
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Experience level?</h2>
                <p className="text-gray-500">How experienced is the creator?</p>
              </div>

              <div className="space-y-3">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setExperienceLevel(level.id)}
                    className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 ${
                      experienceLevel === level.id 
                        ? 'ring-2 ring-offset-2' 
                        : 'hover:scale-[1.01]'
                    }`}
                    style={{
                      backgroundColor: 'white',
                      boxShadow: experienceLevel === level.id 
                        ? `0 4px 0 ${darken(level.color, 40)}` 
                        : '0 3px 0 #e5e7eb',
                      // @ts-expect-error CSS custom property for ring color
                      '--tw-ring-color': level.color,
                    }}
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: level.color, boxShadow: `0 2px 0 ${darken(level.color, 40)}` }}
                    >
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{level.label}</p>
                      <p className="text-sm text-gray-500">{level.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Complexity */}
          {step === 3 && (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <div 
                  className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4"
                  style={{ backgroundColor: '#8b5cf6', boxShadow: `0 4px 0 ${darken('#8b5cf6', 40)}` }}
                >
                  <Layers className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Project complexity?</h2>
                <p className="text-gray-500">How complex is the work required?</p>
              </div>

              <div className="space-y-3">
                {COMPLEXITY_LEVELS.map((level, index) => (
                  <button
                    key={level.id}
                    onClick={() => setComplexity(level.id)}
                    className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 ${
                      complexity === level.id 
                        ? 'ring-2 ring-offset-2 ring-orange-500' 
                        : 'hover:scale-[1.01]'
                    }`}
                    style={{
                      backgroundColor: 'white',
                      boxShadow: '0 3px 0 #e5e7eb',
                    }}
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white"
                      style={{ 
                        backgroundColor: [GREEN, ORANGE, PINK, '#8b5cf6'][index],
                        boxShadow: `0 2px 0 ${darken([GREEN, ORANGE, PINK, '#8b5cf6'][index], 40)}`
                      }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{level.label}</p>
                      <p className="text-sm text-gray-500">{level.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Platform */}
          {step === 4 && (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <div 
                  className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4"
                  style={{ backgroundColor: GREEN, boxShadow: `0 4px 0 ${darken(GREEN, 40)}` }}
                >
                  <Monitor className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Which platform?</h2>
                <p className="text-gray-500">Select the target platform</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`p-4 rounded-xl text-center transition-all ${
                      platform === p.id 
                        ? 'ring-2 ring-offset-2 ring-green-500' 
                        : 'hover:scale-[1.02]'
                    }`}
                    style={{
                      backgroundColor: 'white',
                      boxShadow: platform === p.id 
                        ? `0 4px 0 ${darken(GREEN, 40)}` 
                        : '0 3px 0 #e5e7eb',
                    }}
                  >
                    <span className="font-semibold text-gray-900">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Hours */}
          {step === 5 && (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <div 
                  className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4"
                  style={{ backgroundColor: PINK, boxShadow: `0 4px 0 ${darken(PINK, 40)}` }}
                >
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Estimated hours?</h2>
                <p className="text-gray-500">How many hours will this take?</p>
              </div>

              <div 
                className="bg-white rounded-2xl p-6"
                style={{ boxShadow: '0 4px 0 #e5e7eb' }}
              >
                <div className="text-center mb-6">
                  <span className="text-5xl font-bold text-gray-900">{estimatedHours}</span>
                  <span className="text-xl text-gray-400 ml-2">hours</span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="200"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Number(e.target.value))}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${PINK} 0%, ${PINK} ${(estimatedHours / 200) * 100}%, ${GRAY} ${(estimatedHours / 200) * 100}%, ${GRAY} 100%)`,
                  }}
                />

                <div className="flex justify-between text-sm text-gray-400 mt-2">
                  <span>1 hour</span>
                  <span>200 hours</span>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional context (optional)
                  </label>
                  <textarea
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Any specific requirements or details..."
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 py-4 rounded-2xl font-bold text-sm uppercase tracking-wide
                  border-2 border-gray-200 text-gray-600 hover:bg-gray-100 transition-all"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className={`flex-1 py-4 rounded-2xl text-white font-bold text-sm uppercase tracking-wide
                active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2
                ${!canProceed() || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ 
                backgroundColor: ORANGE,
                boxShadow: `0 4px 0 ${darken(ORANGE, 40)}`
              }}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Calculating...
                </>
              ) : step === totalSteps ? (
                <>
                  <DollarSign className="w-5 h-5" />
                  Calculate Price
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: white;
          border: 4px solid ${PINK};
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: white;
          border: 4px solid ${PINK};
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
