'use client';

import Link from 'next/link';
import { Zap, ArrowRight, TrendingUp, Target, AlertTriangle, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-pink-500 shadow-[0_4px_0_#be185d] flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-gray-900">Circuit</span>
        </div>
        <Link 
          href="/"
          className="px-5 py-2.5 rounded-xl bg-pink-500 shadow-[0_4px_0_#be185d] text-white font-bold text-sm 
            hover:bg-pink-400 active:translate-y-1 active:shadow-none transition-all"
        >
          Get Started
        </Link>
      </header>

      {/* Hero */}
      <main className="px-6 pt-16 pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Will your Roblox game
            <br />
            <span className="text-pink-500">go viral?</span>
          </h1>

          <p className="text-xl text-gray-500 mb-10 leading-relaxed">
            Circuit analyzes your entire game concept—mechanics, monetization, 
            audience fit, timing—and tells you if it has what it takes to break out.
          </p>

          <Link 
            href="/"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-pink-500 shadow-[0_6px_0_#be185d] 
              text-white font-bold text-lg hover:bg-pink-400 active:translate-y-1.5 active:shadow-none transition-all"
          >
            Validate My Game
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* What We Actually Do */}
        <section className="max-w-3xl mx-auto mt-32">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Not just market research
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            We don't just tell you your genre is "competitive." We analyze whether 
            <em> your specific game</em> has the signals that predict viral success on Roblox.
          </p>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white shadow-[0_4px_0_#e5e7eb]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-400 shadow-[0_4px_0_#059669] flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Viral potential scoring</h3>
                  <p className="text-gray-500">
                    We evaluate your core loop, social hooks, and streamability—the factors that 
                    actually determine if a Roblox game spreads organically.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white shadow-[0_4px_0_#e5e7eb]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-400 shadow-[0_4px_0_#b45309] flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Retention prediction</h3>
                  <p className="text-gray-500">
                    Based on your mechanics, we predict your D1/D7/D30 retention and flag 
                    design choices that kill player engagement before you build them.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white shadow-[0_4px_0_#e5e7eb]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-400 shadow-[0_4px_0_#b91c1c] flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Red flag detection</h3>
                  <p className="text-gray-500">
                    We catch the mistakes that doom Roblox games—wrong monetization strategy, 
                    scope creep, missing social features, broken first-time experience.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white shadow-[0_4px_0_#e5e7eb]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500 shadow-[0_4px_0_#7c3aed] flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Actionable fixes</h3>
                  <p className="text-gray-500">
                    Not just problems—solutions. We tell you exactly what to change to 
                    improve your odds, based on what's working for top games right now.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-2xl mx-auto mt-32">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            How it works
          </h2>

          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-pink-500 shadow-[0_4px_0_#be185d] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Describe your game</h3>
                <p className="text-gray-500">Tell us what you're building—the concept, mechanics, target audience.</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-pink-500 shadow-[0_4px_0_#be185d] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">We analyze everything</h3>
                <p className="text-gray-500">Your concept is evaluated against viral patterns, retention drivers, and failure modes.</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-pink-500 shadow-[0_4px_0_#be185d] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Get your verdict</h3>
                <p className="text-gray-500">A clear assessment of viral potential, plus specific changes to improve your odds.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-2xl mx-auto mt-32 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Find out before you build
          </h2>
          <p className="text-gray-500 mb-8">
            Stop guessing. Get a real assessment of your game's viral potential.
          </p>
          
          <Link 
            href="/"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-pink-500 shadow-[0_6px_0_#be185d] 
              text-white font-bold text-lg hover:bg-pink-400 active:translate-y-1.5 active:shadow-none transition-all"
          >
            Validate My Game
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          <p className="mt-4 text-sm text-gray-400">Free to use</p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-pink-500 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-gray-600">Circuit</span>
          </div>
          <span>Built for Roblox developers</span>
        </div>
      </footer>
    </div>
  );
}
