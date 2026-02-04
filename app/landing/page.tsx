'use client';

import Link from 'next/link';
import { Zap, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-pink-500 shadow-[0_4px_0_#be185d] flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-gray-900">Circuit</span>
        </div>
      </header>

      {/* Hero */}
      <main className="px-6 pt-12 pb-24">
        <div className="max-w-3xl mx-auto">
          
          {/* Main headline - This is the #1 thing they read */}
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
            Know if your game will succeed
            <span className="text-pink-500"> before you build it</span>
          </h1>

          {/* Subhead - Quick clarification */}
          <p className="mt-6 text-xl text-gray-500 max-w-xl">
            Circuit predicts whether your Roblox game will go viral based on your concept, mechanics, and market timing.
          </p>

          {/* Primary CTA - Big, obvious, one action */}
          <div className="mt-10">
            <Link 
              href="/"
              className="inline-flex items-center gap-3 px-8 py-5 rounded-2xl bg-pink-500 shadow-[0_6px_0_#be185d] 
                text-white font-bold text-xl hover:bg-pink-400 active:translate-y-1.5 active:shadow-none transition-all"
            >
              Validate my game idea
              <ArrowRight className="w-6 h-6" />
            </Link>
            <p className="mt-3 text-sm text-gray-400 ml-1">Free • Takes 2 minutes</p>
          </div>

          {/* What you get - Scannable list */}
          <section className="mt-24">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-6">
              What you'll learn
            </h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-pink-500 mt-2.5 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Viral potential score</h3>
                  <p className="text-gray-500 mt-1">Does your concept have the hooks that make Roblox games spread?</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-pink-500 mt-2.5 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Retention red flags</h3>
                  <p className="text-gray-500 mt-1">Design choices that kill engagement—caught before you code them.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-pink-500 mt-2.5 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">What to fix</h3>
                  <p className="text-gray-500 mt-1">Specific changes to improve your odds, based on what's working now.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Secondary CTA */}
          <section className="mt-20 p-8 rounded-2xl bg-white shadow-[0_4px_0_#e5e7eb]">
            <h2 className="text-2xl font-bold text-gray-900">
              Stop building games that won't work
            </h2>
            <p className="mt-2 text-gray-500">
              Most Roblox games fail. Find out if yours will before investing months of development.
            </p>
            <Link 
              href="/"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-pink-500 shadow-[0_4px_0_#be185d] 
                text-white font-bold hover:bg-pink-400 active:translate-y-1 active:shadow-none transition-all"
            >
              Get started
              <ArrowRight className="w-5 h-5" />
            </Link>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 px-6">
        <div className="max-w-3xl mx-auto text-sm text-gray-400">
          Built for Roblox developers
        </div>
      </footer>
    </div>
  );
}
