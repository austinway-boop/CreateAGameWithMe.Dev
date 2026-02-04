'use client';

import Link from 'next/link';
import { 
  Target, 
  BarChart3, 
  ArrowRight,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">RobloxPredict</span>
          </div>
          <Link 
            href="/"
            className="px-5 py-2.5 rounded-lg bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight tracking-tight">
            Validate your Roblox game idea
            <br />
            <span className="text-gray-400">with real market data</span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Enter your game concept and get genre analysis, competition levels, 
            retention benchmarks, and comparable games from the Roblox ecosystem.
          </p>

          <Link 
            href="/"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gray-900 text-white font-semibold text-lg hover:bg-gray-800 transition-all"
          >
            Analyze Your Idea
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-20 bg-white border-y border-gray-200">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-12">What you'll get</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-gray-50">
              <BarChart3 className="w-7 h-7 text-gray-700 mb-4" />
              <h3 className="font-semibold mb-2">Genre Detection</h3>
              <p className="text-sm text-gray-500">
                We identify which Roblox genre(s) your concept falls into and show you the competition level for each.
              </p>
            </div>
            
            <div className="p-6 rounded-2xl bg-gray-50">
              <TrendingUp className="w-7 h-7 text-gray-700 mb-4" />
              <h3 className="font-semibold mb-2">Market Trends</h3>
              <p className="text-sm text-gray-500">
                See if your genre is rising, stable, or declining. Some genres are oversaturated, others have room to grow.
              </p>
            </div>
            
            <div className="p-6 rounded-2xl bg-gray-50">
              <Users className="w-7 h-7 text-gray-700 mb-4" />
              <h3 className="font-semibold mb-2">Top Competitors</h3>
              <p className="text-sm text-gray-500">
                See the top games in your genre with visit counts and estimated monthly revenue so you know who you're up against.
              </p>
            </div>
            
            <div className="p-6 rounded-2xl bg-gray-50">
              <Target className="w-7 h-7 text-gray-700 mb-4" />
              <h3 className="font-semibold mb-2">Retention Benchmarks</h3>
              <p className="text-sm text-gray-500">
                Genre-specific D1, D7, and D30 retention targets. Know what numbers you need to hit for your game to be viable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>

          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Describe your game idea</h3>
                <p className="text-gray-500">Tell us what kind of game you want to build. The more detail, the better the analysis.</p>
              </div>
            </div>
            
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">We match it to Roblox genres</h3>
                <p className="text-gray-500">Your concept is analyzed against 13 major Roblox genres with real market data.</p>
              </div>
            </div>
            
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Get actionable insights</h3>
                <p className="text-gray-500">See competition levels, trending data, comparable games, and what it takes to succeed in your genre.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Sources */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-4">Data sourced from</h2>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-gray-500">
              <span>Roblox Official Charts</span>
              <span>GameAnalytics 2025 Report</span>
              <span>GGAID Statistics</span>
              <span>BloxPrices</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to validate your idea?</h2>
          <p className="text-gray-500 mb-8">
            See how your game concept stacks up against the Roblox market.
          </p>
          
          <Link 
            href="/"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gray-900 text-white font-semibold text-lg hover:bg-gray-800 transition-all"
          >
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <div className="mt-4 text-sm text-gray-400">
            Free to use
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gray-900 flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-gray-700">RobloxPredict</span>
            </div>
            <div>
              Market data updated February 2026
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
