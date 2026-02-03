// ============================================
// Market Data Analysis Utilities
// Uses real data from HTMAG, GameDiscoverCo, VGInsights, SteamDB
// ============================================

import genreData from './data/genreData.json';
import benchmarks from './data/benchmarks.json';
import greatConjunction from './data/greatConjunction.json';

export type GenreKey = keyof typeof genreData.genres;

export interface GenreInfo {
  key: string;
  name: string;
  successRate: number;
  successRateDisplay: string;
  gamesReleased: number;
  hits: number;
  medianRevenue: number;
  p90Revenue: number;
  trend: string;
  lifecyclePhase: string;
  winnerTakeAll: boolean;
  devTime: string;
  teamSizeMin: number;
  recommended: boolean;
  greatConjunction: boolean;
  warning: boolean;
  notes: string;
  examples: string[];
}

export interface MarketAnalysis {
  genreInfo: GenreInfo | null;
  matchedGenres: GenreInfo[];
  isGreatConjunction: boolean;
  conjunctionInfo: typeof greatConjunction.active_conjunctions[0] | null;
  warnings: string[];
  opportunities: string[];
  insights: string[];
}

// Keywords to match concept text to genres
const genreKeywords: Record<string, string[]> = {
  'friend_slop': ['co-op', 'coop', 'multiplayer', 'friends', 'chaos', 'party', 'silly', '4 player', 'four player'],
  'horror': ['horror', 'scary', 'spooky', 'creepy', 'terror', 'frightening', 'fear', 'monster', 'survival horror'],
  'horror_casino': ['gambling', 'casino', 'roulette', 'cards', 'betting', 'poker', 'blackjack', 'slots'],
  'job_simulator': ['simulator', 'shop', 'store', 'business', 'manage', 'run a', 'own a', 'supermarket', 'gas station', 'restaurant'],
  'idle_incremental': ['idle', 'incremental', 'clicker', 'afk', 'offline progress', 'auto'],
  'roguelike': ['roguelike', 'roguelite', 'permadeath', 'procedural', 'run-based', 'runs'],
  'roguelike_deckbuilder': ['deckbuilder', 'deck builder', 'deck-builder', 'card game roguelike', 'slay the spire'],
  'survivor_like': ['survivor', 'vampire survivors', 'bullet heaven', 'auto-shooter', 'horde'],
  '2d_platformer': ['2d platformer', 'side-scroller', 'platforming', 'jump and run', 'metroidvania'],
  '3d_platformer': ['3d platformer', 'collectathon', 'mario-like'],
  'puzzle': ['puzzle', 'brain teaser', 'logic', 'match-3', 'sokoban'],
  'management_sim': ['tycoon', 'management', 'strategy sim', 'build and manage'],
  'farming': ['farming', 'farm sim', 'harvest', 'crops', 'stardew'],
  'rpg': ['rpg', 'role-playing', 'jrpg', 'crpg', 'leveling', 'character progression'],
  'narrative': ['story', 'narrative', 'visual novel', 'choice-based', 'text adventure'],
  'tower_defense': ['tower defense', 'td game', 'defend base'],
  'city_builder': ['city builder', 'build city', 'urban planning', 'settlement'],
  'shooter': ['shooter', 'fps', 'first person shooter', 'shoot', 'guns'],
  'metroidvania': ['metroidvania', 'ability gating', 'backtracking', 'hollow knight'],
  'party_game': ['party game', 'local multiplayer', 'couch co-op', 'minigames'],
  'vr': ['vr', 'virtual reality', 'oculus', 'quest', 'headset'],
  'visual_novel': ['visual novel', 'vn', 'dating sim'],
  'point_and_click': ['point and click', 'adventure game', 'lucas arts'],
  'action_adventure': ['action adventure', 'zelda-like', 'exploration'],
  'strategy': ['strategy', 'rts', 'turn-based', '4x', 'grand strategy'],
  'simulation': ['simulation', 'sim'],
  'sandbox': ['sandbox', 'creative', 'minecraft', 'building'],
  'open_world_survival_craft': ['survival craft', 'open world survival', 'gather resources', 'build base', 'valheim'],
  'fighting': ['fighting game', 'fighter', 'combo', 'versus'],
  'racing': ['racing', 'driving', 'cars', 'vehicles'],
  'sports': ['sports', 'football', 'soccer', 'basketball', 'golf']
};

/**
 * Detect genres from a game concept description
 */
export function detectGenres(concept: string, title: string = '', vibes: string[] = []): GenreInfo[] {
  const text = `${title} ${concept} ${vibes.join(' ')}`.toLowerCase();
  const matchedGenres: GenreInfo[] = [];
  const scores: Record<string, number> = {};

  // Score each genre based on keyword matches
  for (const [genreKey, keywords] of Object.entries(genreKeywords)) {
    let score = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += keyword.split(' ').length; // Multi-word matches score higher
      }
    }
    if (score > 0) {
      scores[genreKey] = score;
    }
  }

  // Sort by score and get top matches
  const sortedGenres = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  for (const [genreKey] of sortedGenres) {
    const info = getGenreInfo(genreKey as GenreKey);
    if (info) {
      matchedGenres.push(info);
    }
  }

  return matchedGenres;
}

/**
 * Get detailed info about a specific genre
 */
export function getGenreInfo(genreKey: string): GenreInfo | null {
  const genre = genreData.genres[genreKey as GenreKey];
  if (!genre) return null;

  return {
    key: genreKey,
    name: genre.name,
    successRate: genre.success_rate,
    successRateDisplay: `${(genre.success_rate * 100).toFixed(2)}%`,
    gamesReleased: genre.games_released_2025,
    hits: genre.hits_2025,
    medianRevenue: genre.median_revenue,
    p90Revenue: genre.p90_revenue,
    trend: genre.trend,
    lifecyclePhase: genre.lifecycle_phase,
    winnerTakeAll: genre.winner_take_all,
    devTime: genre.dev_time_typical,
    teamSizeMin: genre.team_size_minimum,
    recommended: genre.recommended,
    greatConjunction: (genre as any).great_conjunction || false,
    warning: (genre as any).warning || false,
    notes: genre.notes,
    examples: genre.examples
  };
}

/**
 * Get all genres sorted by success rate
 */
export function getAllGenres(): GenreInfo[] {
  return Object.entries(genreData.genres)
    .map(([key, genre]) => ({
      key,
      name: genre.name,
      successRate: genre.success_rate,
      successRateDisplay: `${(genre.success_rate * 100).toFixed(2)}%`,
      gamesReleased: genre.games_released_2025,
      hits: genre.hits_2025,
      medianRevenue: genre.median_revenue,
      p90Revenue: genre.p90_revenue,
      trend: genre.trend,
      lifecyclePhase: genre.lifecycle_phase,
      winnerTakeAll: genre.winner_take_all,
      devTime: genre.dev_time_typical,
      teamSizeMin: genre.team_size_minimum,
      recommended: genre.recommended,
      greatConjunction: (genre as any).great_conjunction || false,
      warning: (genre as any).warning || false,
      notes: genre.notes,
      examples: genre.examples
    }))
    .sort((a, b) => b.successRate - a.successRate);
}

/**
 * Get Great Conjunction genres
 */
export function getGreatConjunctionGenres() {
  return greatConjunction.active_conjunctions;
}

/**
 * Analyze a game concept against market data
 */
export function analyzeMarket(
  concept: string,
  title: string = '',
  vibes: string[] = [],
  platform: string = '',
  teamSize: string = ''
): MarketAnalysis {
  const matchedGenres = detectGenres(concept, title, vibes);
  const warnings: string[] = [];
  const opportunities: string[] = [];
  const insights: string[] = [];

  const primaryGenre = matchedGenres[0] || null;

  // Check for Great Conjunction
  let conjunctionInfo = null;
  let isGreatConjunction = false;

  if (primaryGenre?.greatConjunction) {
    isGreatConjunction = true;
    conjunctionInfo = greatConjunction.active_conjunctions.find(
      c => c.name.toLowerCase().includes(primaryGenre.name.toLowerCase().split(' ')[0])
    ) || null;

    opportunities.push(`🔥 GREAT CONJUNCTION: ${primaryGenre.name} is in a demand > supply window. Success rate is unusually high.`);
    if (conjunctionInfo?.window_remaining) {
      opportunities.push(`Window remaining: approximately ${conjunctionInfo.window_remaining}`);
    }
  }

  // Check for warning genres
  if (primaryGenre?.warning) {
    warnings.push(`⚠️ GENRE WARNING: ${primaryGenre.name} has a ${primaryGenre.successRateDisplay} success rate. This is in the "avoid" category.`);
    warnings.push(primaryGenre.notes);
  }

  // Lifecycle phase insights
  if (primaryGenre) {
    const lifecycleMessages: Record<string, string> = {
      'proto': '🚀 Proto phase - Maximum opportunity! Define the genre.',
      'definer': '⚡ Definer phase - Fast follow opportunity available.',
      'variant_window': '✨ Variant window - Good opportunity for differentiated takes.',
      'mature': '📊 Mature market - Need strong differentiation to stand out.',
      'oligopoly': '⚠️ Oligopoly phase - Window closing, quality bar very high.',
      'oversaturated': '🔴 Oversaturated - Extremely difficult to break through.',
      'dead': '💀 Market essentially dead for new entries.',
      'evergreen': '🌲 Evergreen genre - Consistent demand over time.',
      'niche': '🎯 Niche market - Dedicated audience but limited scale.'
    };

    const lifecycleMsg = lifecycleMessages[primaryGenre.lifecyclePhase];
    if (lifecycleMsg) {
      insights.push(lifecycleMsg);
    }

    // Trend insights
    const trendMessages: Record<string, string> = {
      'rising_fast': '📈 Rapidly rising trend - Great timing!',
      'rising': '📈 Rising trend - Good momentum.',
      'stable': '➡️ Stable trend - Consistent market.',
      'consistently_strong': '💪 Consistently strong performer.',
      'declining': '📉 Declining trend - Consider implications.',
      'stagnant': '😐 Stagnant market growth.'
    };

    const trendMsg = trendMessages[primaryGenre.trend];
    if (trendMsg) {
      insights.push(trendMsg);
    }

    // Winner-take-all warning
    if (primaryGenre.winnerTakeAll) {
      warnings.push(`⚠️ Winner-take-all market: Only top games succeed in ${primaryGenre.name}. High risk for new entries.`);
    }

    // Team size check
    const teamSizeNum = parseInt(teamSize) || 1;
    if (teamSizeNum < primaryGenre.teamSizeMin) {
      warnings.push(`Team size alert: ${primaryGenre.name} typically requires ${primaryGenre.teamSizeMin}+ team members. You have ${teamSizeNum}.`);
    }

    // Revenue insights
    insights.push(`Median revenue for successful ${primaryGenre.name} games: $${primaryGenre.medianRevenue.toLocaleString()}`);
    insights.push(`Top 10% revenue potential: $${primaryGenre.p90Revenue.toLocaleString()}`);
    insights.push(`Typical dev time: ${primaryGenre.devTime}`);
    insights.push(`In 2025: ${primaryGenre.gamesReleased} released, ${primaryGenre.hits} achieved 1000+ reviews (success rate: ${primaryGenre.successRateDisplay})`);
  }

  // Platform-specific insights
  if (platform.toLowerCase().includes('mobile')) {
    warnings.push('📱 Mobile requires 10x more polish for discoverability. Consider soft launch strategy.');
    insights.push(`Mobile soft launch KPIs: D1 retention >40%, D7 >20%, LTV/CPI ratio >3x`);
  }

  if (platform.toLowerCase().includes('vr')) {
    warnings.push('🥽 VR has a tiny market with high dev costs. Only Beat Saber-level hits survive.');
  }

  return {
    genreInfo: primaryGenre,
    matchedGenres,
    isGreatConjunction,
    conjunctionInfo,
    warnings,
    opportunities,
    insights
  };
}

/**
 * Get price psychology insights
 */
export function getPriceInsights(pricePoint: number): string[] {
  const insights: string[] = [];
  const priceData = benchmarks.price_psychology;

  if (pricePoint >= priceData.impulse_zone.range[0] && pricePoint <= priceData.impulse_zone.range[1]) {
    insights.push(`💰 Impulse price zone ($${priceData.impulse_zone.range[0]}-$${priceData.impulse_zone.range[1]}): ${priceData.impulse_zone.behavior}`);
    insights.push('HIGH viral coefficient - streamers will say "JUST BUY IT"');
  } else if (pricePoint >= priceData.uncanny_valley.range[0] && pricePoint <= priceData.uncanny_valley.range[1]) {
    insights.push(`⚠️ PRICE WARNING: $${pricePoint} is in the "uncanny valley" ($${priceData.uncanny_valley.range[0]}-$${priceData.uncanny_valley.range[1]})`);
    insights.push(priceData.uncanny_valley.behavior);
    insights.push('Consider pricing at $7.99 (impulse) or $29.99+ (premium)');
  } else if (pricePoint >= priceData.premium_zone.range[0]) {
    insights.push(`💎 Premium price zone: ${priceData.premium_zone.behavior}`);
    insights.push(priceData.premium_zone.requirement);
  }

  return insights;
}

/**
 * Get development benchmarks
 */
export function getDevBenchmarks() {
  return benchmarks.development_benchmarks;
}

/**
 * Get Steam market statistics
 */
export function getSteamStats() {
  return benchmarks.steam_market_2025;
}

/**
 * Get validation timeline recommendations
 */
export function getValidationTimeline() {
  return benchmarks.validation_timeline;
}

/**
 * Get anti-patterns to avoid
 */
export function getAntiPatterns() {
  return benchmarks.anti_patterns;
}

/**
 * Get success stories for inspiration
 */
export function getSuccessStories() {
  return benchmarks.success_stories_rapid;
}

/**
 * Generate pivot suggestions based on current concept
 */
export function generatePivotSuggestions(currentGenres: GenreInfo[]): string[] {
  const suggestions: string[] = [];
  const conjunctions = getGreatConjunctionGenres();

  // If not in a great conjunction, suggest pivoting to one
  const isInConjunction = currentGenres.some(g => g.greatConjunction);
  
  if (!isInConjunction) {
    suggestions.push('Consider adding co-op multiplayer for "friend-slop" viral potential (15% success rate)');
    suggestions.push('Adding horror elements could 3x your success rate (horror accepts rough graphics)');
  }

  // Check for specific issues
  const hasWarningGenre = currentGenres.some(g => g.warning);
  if (hasWarningGenre) {
    suggestions.push('Your primary genre has very low success rates. Consider pivoting to: Job Simulator, Horror, or Idle/Incremental');
  }

  // Add conjunction-specific suggestions
  for (const conjunction of conjunctions.slice(0, 3)) {
    suggestions.push(`Pivot to ${conjunction.name}: ${conjunction.opportunity_score}% opportunity score, window: ${conjunction.window_remaining}`);
  }

  return suggestions.slice(0, 5);
}

/**
 * Build market context for AI prompt
 */
export function buildMarketContext(
  concept: string,
  title: string,
  vibes: string[],
  platform: string,
  teamSize: string
): string {
  const analysis = analyzeMarket(concept, title, vibes, platform, teamSize);
  const steamStats = getSteamStats();
  
  let context = `
=== REAL MARKET DATA (Use this to inform your analysis) ===

STEAM MARKET 2025:
- Total games released: ${steamStats.total_games_released.toLocaleString()}
- Games with 1000+ reviews (success threshold): ${steamStats.games_with_1000_reviews}
- Overall success rate: ${(steamStats.overall_success_rate * 100).toFixed(2)}%
- Median revenue (all games): $${steamStats.median_revenue_all.toLocaleString()}

`;

  if (analysis.genreInfo) {
    context += `DETECTED PRIMARY GENRE: ${analysis.genreInfo.name}
- Success rate: ${analysis.genreInfo.successRateDisplay} (${analysis.genreInfo.hits}/${analysis.genreInfo.gamesReleased} games succeeded in 2025)
- Lifecycle phase: ${analysis.genreInfo.lifecyclePhase}
- Trend: ${analysis.genreInfo.trend}
- Median revenue for hits: $${analysis.genreInfo.medianRevenue.toLocaleString()}
- Top 10% revenue: $${analysis.genreInfo.p90Revenue.toLocaleString()}
- Typical dev time: ${analysis.genreInfo.devTime}
- Minimum team size: ${analysis.genreInfo.teamSizeMin}
- Similar games: ${analysis.genreInfo.examples.join(', ')}
- Notes: ${analysis.genreInfo.notes}
${analysis.genreInfo.warning ? '⚠️ WARNING: This genre is on the "avoid" list due to very low success rates.' : ''}
${analysis.genreInfo.greatConjunction ? '🔥 GREAT CONJUNCTION: This genre has unusually high success rates right now!' : ''}

`;
  }

  if (analysis.matchedGenres.length > 1) {
    context += `SECONDARY GENRES DETECTED:\n`;
    for (const genre of analysis.matchedGenres.slice(1)) {
      context += `- ${genre.name}: ${genre.successRateDisplay} success rate\n`;
    }
    context += '\n';
  }

  if (analysis.opportunities.length > 0) {
    context += `OPPORTUNITIES:\n${analysis.opportunities.map(o => `- ${o}`).join('\n')}\n\n`;
  }

  if (analysis.warnings.length > 0) {
    context += `WARNINGS:\n${analysis.warnings.map(w => `- ${w}`).join('\n')}\n\n`;
  }

  if (analysis.conjunctionInfo) {
    context += `GREAT CONJUNCTION DETAILS:
- Status: ${analysis.conjunctionInfo.status}
- Opportunity score: ${analysis.conjunctionInfo.opportunity_score}/100
- Window remaining: ${analysis.conjunctionInfo.window_remaining}
- Success examples: ${analysis.conjunctionInfo.success_examples.map(e => e.name).join(', ')}
- Key characteristics: ${analysis.conjunctionInfo.characteristics.join(', ')}

`;
  }

  // Add anti-patterns
  const antiPatterns = getAntiPatterns();
  context += `ANTI-PATTERNS TO FLAG:
Development: ${antiPatterns.development.map(p => p.pattern).join(', ')}
Marketing: ${antiPatterns.marketing.map(p => p.pattern).join(', ')}

`;

  return context;
}
