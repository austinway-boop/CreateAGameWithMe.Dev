'use client';

import { useState } from 'react';
import { 
  Calculator, 
  DollarSign, 
  Sparkles,
  Lightbulb,
  TrendingUp,
  Clock,
  Send
} from 'lucide-react';

// Duolingo-style colors
const PINK = '#ec4899';
const ORANGE = '#FF9600';
const GREEN = '#22c55e';

interface PricingResult {
  hourlyRateLow: number;
  hourlyRateHigh: number;
  recommendedHourlyRate: number;
  estimatedHoursLow: number;
  estimatedHoursHigh: number;
  totalEstimateLow: number;
  totalEstimateHigh: number;
  recommendedTotal: number;
  skillType: string;
  rationale: string;
  marketInsights: string;
  tips: string[];
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
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PricingResult | null>(null);
  const [error, setError] = useState('');

  const handleCalculate = async () => {
    if (!description.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/calculateCommission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
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

  const resetCalculator = () => {
    setDescription('');
    setResult(null);
    setError('');
  };

  // Results View
  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="px-6 py-4 border-b bg-white">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: GREEN, boxShadow: `0 3px 0 ${darken(GREEN, 40)}` }}
            >
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Commission Calculator</h1>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
          {/* Result Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-3">
              <Sparkles className="w-4 h-4" />
              {result.skillType}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Fair Rate</h2>
            <p className="text-gray-500 text-sm">Based on AI market analysis</p>
          </div>

          {/* Main Pricing Card */}
          <div 
            className="bg-white rounded-2xl p-6 mb-4"
            style={{ boxShadow: '0 4px 0 #e5e7eb' }}
          >
            <div className="text-center mb-5">
              <p className="text-sm text-gray-500 mb-1">Recommended Hourly Rate</p>
              <p className="text-5xl font-bold text-gray-900">
                ${result.recommendedHourlyRate}
                <span className="text-lg font-normal text-gray-400">/hr</span>
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Range: ${result.hourlyRateLow} - ${result.hourlyRateHigh}/hr
              </p>
            </div>

            <div className="border-t pt-5">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-500">
                  Est. {result.estimatedHoursLow}-{result.estimatedHoursHigh} hours
                </p>
              </div>
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
            className="bg-white rounded-2xl p-4 mb-3"
            style={{ boxShadow: '0 3px 0 #e5e7eb' }}
          >
            <div className="flex items-start gap-3">
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: ORANGE, boxShadow: `0 2px 0 ${darken(ORANGE, 40)}` }}
              >
                <Lightbulb className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Why This Price?</h3>
                <p className="text-gray-600 text-sm">{result.rationale}</p>
              </div>
            </div>
          </div>

          {/* Market Insights Card */}
          <div 
            className="bg-white rounded-2xl p-4 mb-3"
            style={{ boxShadow: '0 3px 0 #e5e7eb' }}
          >
            <div className="flex items-start gap-3">
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: PINK, boxShadow: `0 2px 0 ${darken(PINK, 40)}` }}
              >
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Market Insights</h3>
                <p className="text-gray-600 text-sm">{result.marketInsights}</p>
              </div>
            </div>
          </div>

          {/* Tips Card */}
          <div 
            className="bg-white rounded-2xl p-4 mb-6"
            style={{ boxShadow: '0 3px 0 #e5e7eb' }}
          >
            <h3 className="font-bold text-gray-900 text-sm mb-2">Tips</h3>
            <ul className="space-y-2">
              {result.tips.map((tip, index) => (
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div 
              className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4"
              style={{ backgroundColor: ORANGE, boxShadow: `0 4px 0 ${darken(ORANGE, 40)}` }}
            >
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Describe Your Commission</h2>
            <p className="text-gray-500">Tell us about the work and we&apos;ll suggest a fair price</p>
          </div>

          <div 
            className="bg-white rounded-2xl p-6"
            style={{ boxShadow: '0 4px 0 #e5e7eb' }}
          >
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: I need a Roblox programmer to create a combat system with 5 different weapons, combos, and special abilities. Should take about 2 weeks for someone experienced..."
              className="w-full p-4 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 min-h-[180px]"
              rows={6}
            />

            <p className="text-xs text-gray-400 mt-3 mb-4">
              Include details like: type of work, platform, complexity, timeline, experience level needed
            </p>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handleCalculate}
              disabled={!description.trim() || loading}
              className={`w-full py-4 rounded-2xl text-white font-bold text-sm uppercase tracking-wide
                active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2
                ${!description.trim() || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ 
                backgroundColor: ORANGE,
                boxShadow: `0 4px 0 ${darken(ORANGE, 40)}`
              }}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Get Fair Price
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
