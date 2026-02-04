'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  Target, 
  BarChart3, 
  Database,
  ArrowRight,
  ChevronRight,
  Users,
  DollarSign,
  AlertTriangle,
  Flame,
  XCircle,
  CheckCircle
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

// Genre card for the demo
function GenreCard({ 
  name, 
  status, 
  competition, 
  trend, 
  revenue,
  isSelected,
  onClick 
}: { 
  name: string;
  status: 'hot' | 'caution' | 'avoid';
  competition: string;
  trend: string;
  revenue: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusConfig = {
    hot: { icon: Flame, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'High Potential' },
    caution: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Saturated' },
    avoid: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Oversaturated' }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
        isSelected 
          ? `${config.bg} ${config.border} shadow-sm` 
          : 'bg-white border-gray-100 hover:border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="font-semibold text-gray-900">{name}</span>
        <div className={`flex items-center gap-1 text-xs font-medium ${config.color}`}>
          <Icon className="w-3.5 h-3.5" />
          {config.label}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-gray-400 text-xs">Competition</div>
          <div className="text-gray-700">{competition}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">Trend</div>
          <div className="text-gray-700">{trend}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">Top Revenue</div>
          <div className="text-gray-700">{revenue}</div>
        </div>
      </div>
    </button>
  );
}

export default function LandingPage() {
  const [selectedGenre, setSelectedGenre] = useState<'horror' | 'simulator' | 'obby'>('horror');

  const genreDetails = {
    horror: {
      name: 'Horror',
      d1: '30%',
      devTime: '1-4 months',
      teamSize: '1+',
      topGames: [
        { name: 'DOORS', visits: '5.2B', revenue: '$1-2M/mo' },
        { name: 'Piggy', visits: '4.5B', revenue: '$500K-1M/mo' },
        { name: 'The Mimic', visits: '1.8B', revenue: '$300-600K/mo' },
      ],
      notes: 'Horror games are highly streamable and players are forgiving of rough edges. DOORS changed what\'s possible here.',
      signals: ['Jump scares', 'Unique monster designs', 'Multiplayer survival', 'Streaming moments']
    },
    simulator: {
      name: 'Simulator',
      d1: '35%',
      devTime: '2-6 months',
      teamSize: '1+',
      topGames: [
        { name: 'Pet Simulator X', visits: '8.9B', revenue: '$2-4M/mo' },
        { name: 'Bee Swarm Simulator', visits: '7.5B', revenue: '$1-2M/mo' },
        { name: 'Mining Simulator 2', visits: '1.2B', revenue: '$500K-1M/mo' },
      ],
      notes: 'Extremely popular but crowded. The top games have been dominating for years. You need a genuinely unique hook.',
      signals: ['Daily rewards', 'Pet/item collecting', 'Rebirth mechanics', 'Social trading']
    },
    obby: {
      name: 'Obby / Platformer',
      d1: '20%',
      devTime: '1-4 weeks',
      teamSize: '1',
      topGames: [
        { name: 'Tower of Hell', visits: '26.8B', revenue: '$1-2M/mo' },
        { name: 'Escape Room', visits: '1.2B', revenue: '$200-400K/mo' },
      ],
      notes: 'There are thousands of generic obbies on Roblox. Only procedural/tower-style or genuinely unique concepts break through now.',
      signals: ['Procedural generation', 'Competitive leaderboards', 'Must have unique twist']
    }
  };

  const details = genreDetails[selectedGenre];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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
            Try It Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm mb-8">
            <Database className="w-4 h-4" />
            Built on Roblox market data
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
            Validate your Roblox game
            <br />
            <span className="text-gray-400">before you build it</span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            We analyze your game concept against genre benchmarks, competition levels, 
            and retention data to tell you what you're up against.
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

      {/* Stats Section */}
      <section className="py-16 border-y border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-1">
                <AnimatedCounter end={111.8} suffix="M" decimals={1} />
              </div>
              <div className="text-sm text-gray-500">Roblox Daily Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-1">
                <AnimatedCounter end={40} suffix="M+" />
              </div>
              <div className="text-sm text-gray-500">Total Experiences</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-1">
                <AnimatedCounter end={923} prefix="$" suffix="M" />
              </div>
              <div className="text-sm text-gray-500">Creator Earnings (2024)</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-1">0.1%</div>
              <div className="text-sm text-gray-500">Make Meaningful Revenue</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">See how genres compare</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Different genres have wildly different competition levels and success rates. 
              Click to explore.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Genre selector */}
            <div className="space-y-3">
              <GenreCard
                name="Horror"
                status="hot"
                competition="Moderate"
                trend="Rising Fast"
                revenue="$1-2M/mo"
                isSelected={selectedGenre === 'horror'}
                onClick={() => setSelectedGenre('horror')}
              />
              <GenreCard
                name="Pet Simulator"
                status="caution"
                competition="Very High"
                trend="Stable"
                revenue="$2-4M/mo"
                isSelected={selectedGenre === 'simulator'}
                onClick={() => setSelectedGenre('simulator')}
              />
              <GenreCard
                name="Obby / Platformer"
                status="avoid"
                competition="Extreme"
                trend="Declining"
                revenue="$200K-2M/mo"
                isSelected={selectedGenre === 'obby'}
                onClick={() => setSelectedGenre('obby')}
              />
            </div>

            {/* Details panel */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">{details.name} Genre</h3>
                <div className="text-sm text-gray-500">D1 Retention Target: {details.d1}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-gray-50">
                  <div className="text-xs text-gray-400 mb-1">Typical Dev Time</div>
                  <div className="font-medium">{details.devTime}</div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50">
                  <div className="text-xs text-gray-400 mb-1">Min Team Size</div>
                  <div className="font-medium">{details.teamSize}</div>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 mb-3">Top Games in Genre</div>
                <div className="space-y-2">
                  {details.topGames.map((game, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <span className="text-gray-900">{game.name}</span>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{game.visits} visits</div>
                        <div className="text-xs text-gray-400">{game.revenue}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 mb-4">
                <div className="text-sm text-gray-600 leading-relaxed">{details.notes}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                {details.signals.map((signal, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-600">
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Track Section */}
      <section className="py-24 bg-white border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What we analyze</h2>
            <p className="text-gray-500">
              Data points we use to evaluate your concept
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-gray-50">
              <BarChart3 className="w-8 h-8 text-gray-700 mb-4" />
              <h3 className="font-semibold mb-2">Genre Competition</h3>
              <p className="text-sm text-gray-500">
                How crowded is your genre? We track competition levels from 13 major Roblox genres.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-50">
              <TrendingUp className="w-8 h-8 text-gray-700 mb-4" />
              <h3 className="font-semibold mb-2">Growth Trends</h3>
              <p className="text-sm text-gray-500">
                Is the genre rising, stable, or declining? Timing matters more than most realize.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-50">
              <Target className="w-8 h-8 text-gray-700 mb-4" />
              <h3 className="font-semibold mb-2">Retention Benchmarks</h3>
              <p className="text-sm text-gray-500">
                D1, D7, D30 targets by genre. Know what numbers you need to hit.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-50">
              <Users className="w-8 h-8 text-gray-700 mb-4" />
              <h3 className="font-semibold mb-2">Top Competitors</h3>
              <p className="text-sm text-gray-500">
                Who dominates your space? Visit counts and estimated revenue of market leaders.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-50">
              <DollarSign className="w-8 h-8 text-gray-700 mb-4" />
              <h3 className="font-semibold mb-2">Monetization Fit</h3>
              <p className="text-sm text-gray-500">
                Different genres monetize differently. We flag what works where.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-50">
              <AlertTriangle className="w-8 h-8 text-gray-700 mb-4" />
              <h3 className="font-semibold mb-2">Red Flags</h3>
              <p className="text-sm text-gray-500">
                Common mistakes that tank Roblox games. We call them out before you make them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Benchmarks */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What success looks like</h2>
            <p className="text-gray-500">CCU benchmarks from the Roblox ecosystem</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-6 p-6 rounded-2xl bg-white border border-gray-200">
              <div className="w-20 text-right">
                <div className="text-2xl font-bold text-emerald-600">50K+</div>
                <div className="text-xs text-gray-400">CCU</div>
              </div>
              <div className="flex-1">
                <div className="font-medium">Breakout Hit</div>
                <div className="text-sm text-gray-500">$500K-2M/month • Top 0.01% of games</div>
              </div>
            </div>
            <div className="flex items-center gap-6 p-6 rounded-2xl bg-white border border-gray-200">
              <div className="w-20 text-right">
                <div className="text-2xl font-bold text-emerald-600">10K+</div>
                <div className="text-xs text-gray-400">CCU</div>
              </div>
              <div className="flex-1">
                <div className="font-medium">Successful Game</div>
                <div className="text-sm text-gray-500">$100K-500K/month • Top 0.1% of games</div>
              </div>
            </div>
            <div className="flex items-center gap-6 p-6 rounded-2xl bg-white border border-gray-200">
              <div className="w-20 text-right">
                <div className="text-2xl font-bold text-amber-600">1K+</div>
                <div className="text-xs text-gray-400">CCU</div>
              </div>
              <div className="flex-1">
                <div className="font-medium">Viable Game</div>
                <div className="text-sm text-gray-500">$10K-50K/month • Sustainable for a small team</div>
              </div>
            </div>
            <div className="flex items-center gap-6 p-6 rounded-2xl bg-white border border-gray-200">
              <div className="w-20 text-right">
                <div className="text-2xl font-bold text-gray-400">100+</div>
                <div className="text-xs text-gray-400">CCU</div>
              </div>
              <div className="flex-1">
                <div className="font-medium">Growing</div>
                <div className="text-sm text-gray-500">$1K-5K/month • Promising but needs iteration</div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 rounded-2xl bg-gray-100">
            <div className="text-sm text-gray-600">
              <strong>Data sources:</strong> Roblox Official Charts, GameAnalytics 2025 Roblox Benchmark Report, 
              GGAID Player Statistics, BloxPrices Revenue Tracking
            </div>
          </div>
        </div>
      </section>

      {/* Hot Genres */}
      <section className="py-24 bg-white border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Genres with momentum right now</h2>
            <p className="text-gray-500">Lower competition, growing player interest</p>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {[
              { name: 'Horror', note: 'Streamable, forgiving of rough edges' },
              { name: 'Social Co-opetition', note: 'Fashion shows, voting games' },
              { name: 'Anime RPG', note: 'Gacha mechanics perform well' },
              { name: 'Open World', note: 'High search demand, few quality games' },
              { name: 'Sports', note: 'Underserved, especially regional' },
            ].map((genre, i) => (
              <div key={i} className="p-5 rounded-xl bg-gray-50 text-center">
                <div className="font-medium text-gray-900 mb-2">{genre.name}</div>
                <div className="text-xs text-gray-500">{genre.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">See where your idea stands</h2>
          <p className="text-gray-500 mb-8">
            Get genre analysis, competition data, and benchmarks for your game concept.
          </p>
          
          <Link 
            href="/"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gray-900 text-white font-semibold text-lg hover:bg-gray-800 transition-all"
          >
            Analyze Your Idea
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <div className="mt-4 text-sm text-gray-400">
            Free to use
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gray-900 flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-gray-700">RobloxPredict</span>
            </div>
            <div>
              Data from Roblox Charts, GameAnalytics, GGAID, BloxPrices
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
