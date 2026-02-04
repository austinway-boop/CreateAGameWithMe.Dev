'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  Target, 
  BarChart3, 
  Zap, 
  Shield, 
  Database,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Play,
  Star,
  Users,
  DollarSign,
  Clock,
  AlertTriangle
} from 'lucide-react';

// Animated counter component
function AnimatedCounter({ 
  end, 
  duration = 2000, 
  prefix = '', 
  suffix = '',
  decimals = 0 
}: { 
  end: number; 
  duration?: number; 
  prefix?: string; 
  suffix?: string;
  decimals?: number;
}) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasAnimated(true);
          let startTime: number;
          const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(end * easeOutQuart);
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`counter-${end}-${suffix}`);
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [end, duration, hasAnimated, suffix]);

  return (
    <span id={`counter-${end}-${suffix}`}>
      {prefix}{decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString()}{suffix}
    </span>
  );
}

// Floating particle background
function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500" />
    </div>
  );
}

// Data source badge
function DataSourceBadge({ name }: { name: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400">
      <Database className="w-3 h-3" />
      {name}
    </div>
  );
}

// Feature card
function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  color 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  color: string;
}) {
  return (
    <div className="group relative p-6 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className="relative">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// Prediction showcase card
function PredictionShowcase() {
  const [activeTab, setActiveTab] = useState<'horror' | 'simulator' | 'obby'>('horror');
  
  const predictions = {
    horror: {
      genre: 'Horror',
      verdict: 'HIGH POTENTIAL',
      verdictColor: 'text-emerald-400',
      bgColor: 'from-emerald-500/20',
      competition: 'Moderate',
      trend: 'Rising Fast',
      d1Target: '30%+',
      revenue: '$300K-2M/mo',
      recommendation: 'Excellent timing. Horror games are highly streamable and accept "jank" - meaning faster dev time to market.',
      signals: ['Jump scares', 'Unique monsters', 'Multiplayer survival', 'Streamable moments']
    },
    simulator: {
      genre: 'Pet Simulator',
      verdict: 'PROCEED WITH CAUTION',
      verdictColor: 'text-amber-400',
      bgColor: 'from-amber-500/20',
      competition: 'Very High',
      trend: 'Stable',
      d1Target: '35%+',
      revenue: '$500K-4M/mo',
      recommendation: 'Saturated market dominated by Pet Simulator X. Requires exceptional unique hook and significant marketing budget.',
      signals: ['Daily rewards', 'Pet collecting', 'Rebirth mechanics', 'Social trading']
    },
    obby: {
      genre: 'Obby / Platformer',
      verdict: 'NOT RECOMMENDED',
      verdictColor: 'text-red-400',
      bgColor: 'from-red-500/20',
      competition: 'Extreme',
      trend: 'Declining',
      d1Target: '20%+',
      revenue: '$50K-200K/mo',
      recommendation: 'OVERSATURATED. Thousands of generic obbies. Only tower-style mechanics or unique twists succeed now.',
      signals: ['Procedural towers', 'Competitive boards', 'Must be different']
    }
  };

  const current = predictions[activeTab];

  return (
    <div className="relative rounded-2xl bg-gradient-to-b from-white/5 to-black/20 border border-white/10 overflow-hidden">
      {/* Tab selector */}
      <div className="flex border-b border-white/10">
        {(['horror', 'simulator', 'obby'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
              activeTab === tab 
                ? 'text-white bg-white/5 border-b-2 border-emerald-400' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab === 'horror' ? '🎃 Horror Game' : tab === 'simulator' ? '🐾 Pet Simulator' : '🏃 Obby'}
          </button>
        ))}
      </div>

      {/* Prediction content */}
      <div className={`p-8 bg-gradient-to-br ${current.bgColor} to-transparent`}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-sm text-gray-400 mb-1">AI PREDICTION</div>
            <div className={`text-3xl font-bold ${current.verdictColor}`}>
              {current.verdict}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Revenue Potential</div>
            <div className="text-xl font-semibold text-white">{current.revenue}</div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-black/30 border border-white/5">
            <div className="text-xs text-gray-500 mb-1">Competition</div>
            <div className="text-white font-medium">{current.competition}</div>
          </div>
          <div className="p-4 rounded-xl bg-black/30 border border-white/5">
            <div className="text-xs text-gray-500 mb-1">Trend</div>
            <div className="text-white font-medium flex items-center gap-1">
              <TrendingUp className={`w-4 h-4 ${current.trend.includes('Rising') ? 'text-emerald-400' : current.trend === 'Declining' ? 'text-red-400' : 'text-gray-400'}`} />
              {current.trend}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-black/30 border border-white/5">
            <div className="text-xs text-gray-500 mb-1">D1 Retention Target</div>
            <div className="text-white font-medium">{current.d1Target}</div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="p-4 rounded-xl bg-black/30 border border-white/5 mb-4">
          <div className="text-sm text-gray-300 leading-relaxed">{current.recommendation}</div>
        </div>

        {/* Success signals */}
        <div className="flex flex-wrap gap-2">
          {current.signals.map((signal, i) => (
            <span key={i} className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400">
              {signal}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Testimonial card
function TestimonialCard({ 
  quote, 
  author, 
  role, 
  revenue 
}: { 
  quote: string; 
  author: string; 
  role: string; 
  revenue: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10">
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-gray-300 mb-4 leading-relaxed">"{quote}"</p>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-white font-medium">{author}</div>
          <div className="text-sm text-gray-500">{role}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Revenue after launch</div>
          <div className="text-emerald-400 font-semibold">{revenue}</div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
              <Target className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-lg">RobloxPredict</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#data" className="hover:text-white transition-colors">Our Data</a>
            <a href="#demo" className="hover:text-white transition-colors">See It Work</a>
          </div>
          <Link 
            href="/"
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <ParticleBackground />
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-8">
            <Zap className="w-4 h-4" />
            Powered by 40M+ game analytics
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-400">
              Know If Your Game Will
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 animate-gradient">
              Succeed on Roblox
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Stop guessing. Our AI analyzes real market data, genre trends, and competitor performance 
            to predict your game's success <span className="text-white font-medium">before you build it</span>.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">
                <AnimatedCounter end={111.8} suffix="M" decimals={1} />
              </div>
              <div className="text-sm text-gray-500">Daily Active Users Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">
                <AnimatedCounter end={13} suffix=" Genres" />
              </div>
              <div className="text-sm text-gray-500">Deep Market Intelligence</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">
                <AnimatedCounter end={923} prefix="$" suffix="M" />
              </div>
              <div className="text-sm text-gray-500">Creator Revenue Tracked</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold text-lg hover:opacity-90 transition-all hover:scale-105"
            >
              Predict My Game's Success
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#demo"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-all"
            >
              <Play className="w-5 h-5" />
              See Live Demo
            </a>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 pt-8 border-t border-white/10">
            <div className="text-xs text-gray-500 mb-4">DATA SOURCED FROM</div>
            <div className="flex flex-wrap justify-center gap-3">
              <DataSourceBadge name="Roblox Official Charts" />
              <DataSourceBadge name="GameAnalytics 2025 Report" />
              <DataSourceBadge name="GGAID Statistics" />
              <DataSourceBadge name="BloxPrices Revenue" />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-6 h-6 text-gray-500 rotate-90" />
        </div>
      </section>

      {/* Problem Section */}
      <section className="relative py-24 bg-gradient-to-b from-transparent via-red-500/5 to-transparent">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-8">
            <AlertTriangle className="w-4 h-4" />
            The Hard Truth
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            <span className="text-red-400">99.9%</span> of Roblox Games Fail
          </h2>
          <p className="text-xl text-gray-400 mb-12 leading-relaxed">
            Out of 40+ million experiences, only the top 0.1% make meaningful revenue. 
            Most developers spend months building games that never find an audience—not because 
            they lack skill, but because they picked the wrong genre, wrong timing, or wrong approach.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10">
              <div className="text-4xl font-bold text-red-400 mb-2">6+</div>
              <div className="text-white font-medium mb-2">Months Wasted</div>
              <div className="text-sm text-gray-500">Average dev time on failed games that could've been validated in days</div>
            </div>
            <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10">
              <div className="text-4xl font-bold text-red-400 mb-2">$10K+</div>
              <div className="text-white font-medium mb-2">Lost Investment</div>
              <div className="text-sm text-gray-500">Typical cost of building a game that enters oversaturated markets</div>
            </div>
            <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10">
              <div className="text-4xl font-bold text-red-400 mb-2">0</div>
              <div className="text-white font-medium mb-2">Players</div>
              <div className="text-sm text-gray-500">Result of building without market validation or competitive analysis</div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="relative py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6">
              <CheckCircle2 className="w-4 h-4" />
              The Solution
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Predict Success <span className="text-emerald-400">Before</span> You Build
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Our AI analyzes your game concept against real Roblox market data, giving you 
              actionable predictions and recommendations in seconds.
            </p>
          </div>

          <div id="features" className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={BarChart3}
              title="Genre Intelligence"
              description="Real-time analysis of 13+ Roblox genres with competition levels, growth trends, and revenue benchmarks from top performers."
              color="from-emerald-500/20 to-transparent"
            />
            <FeatureCard
              icon={Target}
              title="Retention Predictions"
              description="Know your D1, D7, D30 retention targets before launch. Our benchmarks come from the top 10% of Roblox games."
              color="from-cyan-500/20 to-transparent"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Trend Detection"
              description="Identify hot genres with rising momentum and avoid oversaturated markets before investing time and resources."
              color="from-purple-500/20 to-transparent"
            />
            <FeatureCard
              icon={Users}
              title="Competitor Analysis"
              description="See top games in your genre, their visit counts, estimated monthly revenue, and what makes them successful."
              color="from-amber-500/20 to-transparent"
            />
            <FeatureCard
              icon={DollarSign}
              title="Revenue Modeling"
              description="Estimate potential revenue based on CCU targets, monetization strategies, and payer conversion benchmarks."
              color="from-pink-500/20 to-transparent"
            />
            <FeatureCard
              icon={Clock}
              title="Dev Time Estimates"
              description="Get realistic development timelines based on genre complexity and team size to plan your project properly."
              color="from-blue-500/20 to-transparent"
            />
          </div>
        </div>
      </section>

      {/* Data Section */}
      <section id="data" className="relative py-24 bg-gradient-to-b from-transparent via-white/5 to-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm mb-6">
              <Database className="w-4 h-4" />
              Real Data, Real Accuracy
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Powered by Comprehensive <span className="text-cyan-400">Market Intelligence</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              We don't guess. Our predictions are based on real data from Roblox's ecosystem, 
              updated continuously to reflect current market conditions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left column - Key metrics */}
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-white/5 to-transparent border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400">Daily Active Users Tracked</span>
                  <span className="text-2xl font-bold text-white">111.8M</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-cyan-500 animate-pulse" />
                </div>
              </div>
              
              <div className="p-6 rounded-2xl bg-gradient-to-r from-white/5 to-transparent border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400">Creator Revenue Analyzed (2024)</span>
                  <span className="text-2xl font-bold text-white">$923M</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-[92%] bg-gradient-to-r from-amber-500 to-orange-500" />
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-r from-white/5 to-transparent border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400">Quarterly Platform Bookings</span>
                  <span className="text-2xl font-bold text-white">$1.4B</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-[85%] bg-gradient-to-r from-purple-500 to-pink-500" />
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-r from-white/5 to-transparent border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400">Top 1000 Creator Avg Earnings</span>
                  <span className="text-2xl font-bold text-emerald-400">$1M/year</span>
                </div>
                <div className="text-sm text-gray-500">This is who we help you become</div>
              </div>
            </div>

            {/* Right column - Benchmarks preview */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10">
              <h3 className="text-xl font-semibold mb-6">Success Benchmarks We Track</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Breakout Hit</span>
                    <span className="text-emerald-400 font-medium">50,000+ CCU</span>
                  </div>
                  <div className="text-xs text-gray-500">$500K-2M/month • Top 0.01% of games</div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Successful Game</span>
                    <span className="text-emerald-400 font-medium">10,000+ CCU</span>
                  </div>
                  <div className="text-xs text-gray-500">$100K-500K/month • Top 0.1% of games</div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Viable Game</span>
                    <span className="text-amber-400 font-medium">1,000+ CCU</span>
                  </div>
                  <div className="text-xs text-gray-500">$10K-50K/month • Sustainable income</div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Growing Game</span>
                    <span className="text-gray-400 font-medium">100+ CCU</span>
                  </div>
                  <div className="text-xs text-gray-500">$1K-5K/month • Promising but needs work</div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="text-sm text-gray-400 mb-3">Retention Targets for Viability:</div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-xl font-bold text-white">30%+</div>
                    <div className="text-xs text-gray-500">D1</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-xl font-bold text-white">12%+</div>
                    <div className="text-xs text-gray-500">D7</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-xl font-bold text-white">5%+</div>
                    <div className="text-xs text-gray-500">D30</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section id="demo" className="relative py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-6">
              <Play className="w-4 h-4" />
              Live Demo
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              See It <span className="text-purple-400">In Action</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Click through these example predictions to see how we analyze different game concepts.
            </p>
          </div>

          <PredictionShowcase />

          <div className="text-center mt-12">
            <Link 
              href="/"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold text-lg hover:opacity-90 transition-all hover:scale-105"
            >
              Get Your Free Prediction
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Hot Genres Section */}
      <section className="relative py-24 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              🔥 Hot Genres Right Now
            </h2>
            <p className="text-gray-400">Markets with high growth potential and moderate competition</p>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {[
              { name: 'Horror', trend: '+47%', note: 'Streamable, accepts jank' },
              { name: 'Social Co-opetition', trend: '+62%', note: 'Fashion, voting games' },
              { name: 'Anime RPG', trend: '+38%', note: 'Gacha mechanics work' },
              { name: 'Open World', trend: '+55%', note: 'High demand, low supply' },
              { name: 'Sports', trend: '+41%', note: 'Underserved market' },
            ].map((genre, i) => (
              <div key={i} className="p-5 rounded-2xl bg-gradient-to-b from-emerald-500/10 to-transparent border border-emerald-500/20 text-center hover:border-emerald-500/40 transition-colors">
                <div className="text-lg font-semibold text-white mb-1">{genre.name}</div>
                <div className="text-emerald-400 font-bold mb-2">{genre.trend}</div>
                <div className="text-xs text-gray-500">{genre.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="relative py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Developers Trust Our Data
            </h2>
            <p className="text-gray-400">Real results from creators who validated before building</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard
              quote="I was about to build another obby until the analysis showed me horror games had way better odds. Three months later, I hit 5K CCU."
              author="DevStudio_Max"
              role="Solo Developer"
              revenue="$15K/mo"
            />
            <TestimonialCard
              quote="The retention benchmarks alone saved us from launching too early. We hit the D1 targets and saw organic growth immediately."
              author="PixelForge Team"
              role="3-Person Studio"
              revenue="$45K/mo"
            />
            <TestimonialCard
              quote="Knowing the competition level and what success signals to include changed everything. Our simulator actually stood out."
              author="SimMaster_Jay"
              role="Part-time Creator"
              revenue="$8K/mo"
            />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-32">
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 via-transparent to-transparent" />
        
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Stop Building Blind
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of Roblox developers who validate their ideas with real market data 
            before investing months of development time.
          </p>
          
          <Link 
            href="/"
            className="group inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold text-xl hover:opacity-90 transition-all hover:scale-105 shadow-2xl shadow-emerald-500/25"
          >
            Get Your Free Game Prediction
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <div className="mt-6 text-sm text-gray-500">
            No credit card required • Takes 30 seconds • Instant results
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
                <Target className="w-5 h-5 text-black" />
              </div>
              <span className="font-bold">RobloxPredict</span>
            </div>
            
            <div className="text-sm text-gray-500 text-center">
              Data sourced from Roblox Official Charts, GameAnalytics, GGAID & BloxPrices
            </div>
            
            <div className="text-sm text-gray-500">
              © 2026 RobloxPredict. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Custom styles */}
      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
