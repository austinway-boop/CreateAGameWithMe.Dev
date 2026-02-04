// ============================================
// Roblox Market Data Analysis Utilities
// Uses real data from Roblox Charts, GGAID, GameAnalytics Roblox Report
// ============================================

import robloxGenreData from './data/robloxGenreData.json';
import robloxBenchmarks from './data/robloxBenchmarks.json';

export type RobloxGenreKey = keyof typeof robloxGenreData.genres;

export interface RobloxGenreInfo {
  key: string;
  name: string;
  description: string;
  popularityRank: number;
  growthTrend: string;
  lifecyclePhase: string;
  competitionLevel: string;
  monetizationPotential: string;
  devTime: string;
  teamSizeMin: number;
  recommended: boolean;
  isHotGenre: boolean;
  warning: boolean;
  notes: string;
  topGames: Array<{ name: string; visits: string; monthly_revenue_estimate: string }>;
  successSignals: string[];
  retentionBenchmarks: { d1: number; d7: number; d30: number };
}

export interface RobloxMarketAnalysis {
  genreInfo: RobloxGenreInfo | null;
  matchedGenres: RobloxGenreInfo[];
  isHotGenre: boolean;
  warnings: string[];
  opportunities: string[];
  insights: string[];
  competitorGames: Array<{ name: string; visits: string; monthly_revenue_estimate: string }>;
}

// Keywords to match concept text to Roblox genres
// Format: keyword -> weight (higher = stronger signal)
const robloxGenreKeywords: Record<string, Array<[string, number]>> = {
  'simulator': [
    ['simulator', 3], ['pet sim', 5], ['farming sim', 5], ['bee swarm', 5],
    ['collecting', 2], ['grinding', 2], ['afk', 3], ['idle', 3], ['clicker', 3],
    ['hatch', 3], ['rebirth', 3], ['pets', 2], ['gem', 1], ['coin', 1]
  ],
  'roleplay_lifesim': [
    ['roleplay', 4], ['rp game', 5], ['lifesim', 5], ['life sim', 5],
    ['adopt me', 5], ['bloxburg', 5], ['family', 2], ['town', 2], ['city life', 4],
    ['hangout', 3], ['house', 1], ['decorate', 2], ['customiz', 2]
  ],
  'horror': [
    ['horror', 5], ['scary', 4], ['spooky', 3], ['monster', 2], ['survival horror', 5],
    ['doors', 4], ['piggy', 4], ['backrooms', 4], ['creepy', 3], ['jumpscare', 4],
    ['fear', 2], ['ghost', 3], ['haunted', 4], ['possessed', 4], ['demon', 3],
    ['escape the', 3], ['survive', 2], ['killer', 3], ['night', 1], ['dark', 1],
    ['among us', 4], ['imposter', 4], ['traitor', 4], ['sabotage', 3], ['social deduction', 5]
  ],
  'battlegrounds_pvp': [
    ['pvp', 4], ['battlegrounds', 5], ['combat', 3], ['fighting', 3], ['battle', 2],
    ['arena', 3], ['bedwars', 5], ['murder mystery', 5], ['vs', 2], ['competitive', 3],
    ['shooter', 4], ['fps', 4], ['gun', 3], ['weapon', 2], ['kill', 2], ['duel', 3]
  ],
  'obby_platformer': [
    ['obby', 5], ['obstacle course', 5], ['parkour', 4], ['tower of hell', 5],
    ['jumping', 2], ['platformer', 4], ['climb', 2], ['checkpoint', 3], ['levels', 1],
    ['jump on platforms', 5], ['reach the end', 3]
  ],
  'tycoon': [
    ['tycoon', 5], ['business', 2], ['manage', 2], ['factory', 3], ['empire', 2],
    ['money', 1], ['idle tycoon', 5], ['build base', 3], ['upgrade', 2], ['droppers', 4]
  ],
  'anime_rpg': [
    ['anime', 4], ['devil fruit', 5], ['shindo', 5], ['naruto', 5], ['one piece', 5],
    ['dbz', 4], ['dragon ball', 5], ['gacha', 4], ['leveling', 2], ['powers', 2],
    ['bleach', 4], ['jujutsu', 4], ['demon slayer', 4], ['manga', 3], ['awakening', 3]
  ],
  'social_coopetition': [
    ['fashion', 4], ['dress up', 5], ['voting', 3], ['talent show', 5], ['runway', 5],
    ['makeover', 4], ['beauty', 3], ['co-opetition', 5], ['party', 2], ['show off', 3],
    ['rate my', 4], ['judge', 3], ['outfit', 3]
  ],
  'driving_racing': [
    ['driving', 4], ['racing', 5], ['car', 3], ['vehicle', 3], ['speed', 2],
    ['drift', 4], ['motorcycle', 3], ['truck', 2], ['jailbreak', 5], ['getaway', 3]
  ],
  'open_world_action': [
    ['open world', 5], ['exploration', 3], ['adventure', 2], ['questing', 3],
    ['survival', 3], ['crafting', 3], ['apocalypse', 3], ['sandbox', 4], ['freedom', 2]
  ],
  'sports_arcade': [
    ['sports', 4], ['soccer', 5], ['football', 4], ['basketball', 5], ['baseball', 4],
    ['golf', 4], ['arcade sports', 5], ['goal', 2], ['score', 1], ['team sport', 4]
  ],
  'tower_defense': [
    ['tower defense', 5], ['td game', 5], ['defend', 2], ['waves', 3], ['towers', 3],
    ['units', 2], ['strategy', 2], ['place towers', 5], ['enemy waves', 4]
  ],
  'minigames_party': [
    ['minigames', 5], ['mini games', 5], ['party', 2], ['variety', 2], ['random games', 4],
    ['collection', 1], ['rounds', 2], ['different games', 4]
  ]
};

/**
 * Detect Roblox genres from a game concept description
 * Uses weighted keyword matching for better accuracy
 */
export function detectRobloxGenres(concept: string, title: string = '', vibes: string[] = []): RobloxGenreInfo[] {
  const text = `${title} ${concept} ${vibes.join(' ')}`.toLowerCase();
  const matchedGenres: RobloxGenreInfo[] = [];
  const scores: Record<string, number> = {};

  // Score each genre based on weighted keyword matches
  for (const [genreKey, keywordPairs] of Object.entries(robloxGenreKeywords)) {
    let score = 0;
    const matchedKeywords: string[] = [];
    
    for (const [keyword, weight] of keywordPairs) {
      const kw = keyword.toLowerCase();
      // Count occurrences (not just presence)
      const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = text.match(regex);
      if (matches) {
        score += weight * matches.length;
        matchedKeywords.push(keyword);
      }
    }
    
    // Bonus for multiple keyword matches (signals stronger genre fit)
    if (matchedKeywords.length >= 3) {
      score *= 1.5;
    } else if (matchedKeywords.length >= 2) {
      score *= 1.2;
    }
    
    if (score > 0) {
      scores[genreKey] = score;
    }
  }

  // Sort by score and get top matches
  const sortedGenres = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  // Only include genres with meaningful scores
  const topScore = sortedGenres[0]?.[1] || 0;
  for (const [genreKey, score] of sortedGenres) {
    // Include if score is at least 30% of top score (to filter weak secondary matches)
    if (score >= topScore * 0.3 || score >= 3) {
      const info = getRobloxGenreInfo(genreKey as RobloxGenreKey);
      if (info) {
        matchedGenres.push(info);
      }
    }
  }

  return matchedGenres;
}

/**
 * Get detailed info about a specific Roblox genre
 */
export function getRobloxGenreInfo(genreKey: string): RobloxGenreInfo | null {
  const genre = robloxGenreData.genres[genreKey as RobloxGenreKey];
  if (!genre) return null;

  return {
    key: genreKey,
    name: genre.name,
    description: genre.description,
    popularityRank: genre.popularity_rank,
    growthTrend: genre.growth_trend,
    lifecyclePhase: genre.lifecycle_phase,
    competitionLevel: genre.competition_level,
    monetizationPotential: genre.monetization_potential,
    devTime: genre.dev_time_typical,
    teamSizeMin: genre.team_size_minimum,
    recommended: genre.recommended,
    isHotGenre: (genre as any).hot_genre || false,
    warning: (genre as any).warning || false,
    notes: genre.notes,
    topGames: genre.top_games,
    successSignals: genre.success_signals,
    retentionBenchmarks: genre.retention_benchmarks
  };
}

/**
 * Get all Roblox genres sorted by popularity
 */
export function getAllRobloxGenres(): RobloxGenreInfo[] {
  return Object.entries(robloxGenreData.genres)
    .map(([key, genre]) => ({
      key,
      name: genre.name,
      description: genre.description,
      popularityRank: genre.popularity_rank,
      growthTrend: genre.growth_trend,
      lifecyclePhase: genre.lifecycle_phase,
      competitionLevel: genre.competition_level,
      monetizationPotential: genre.monetization_potential,
      devTime: genre.dev_time_typical,
      teamSizeMin: genre.team_size_minimum,
      recommended: genre.recommended,
      isHotGenre: (genre as any).hot_genre || false,
      warning: (genre as any).warning || false,
      notes: genre.notes,
      topGames: genre.top_games,
      successSignals: genre.success_signals,
      retentionBenchmarks: genre.retention_benchmarks
    }))
    .sort((a, b) => a.popularityRank - b.popularityRank);
}

/**
 * Get hot/trending Roblox genres
 */
export function getHotRobloxGenres(): string[] {
  return robloxGenreData.hot_genres;
}

/**
 * Map user-specified genre keywords to our genre keys
 * Searches for ANY of these keywords in the user's genre string
 */
const userGenreKeywords: Array<[string, string]> = [
  // Horror (check first - common primary genre)
  ['horror', 'horror'],
  ['scary', 'horror'],
  ['survival horror', 'horror'],
  ['social deduction', 'horror'], // Among Us style = horror-adjacent
  ['possessed', 'horror'],
  ['haunted', 'horror'],
  ['ghost', 'horror'],
  
  // Obby/Platformer
  ['obby', 'obby_platformer'],
  ['platformer', 'obby_platformer'],
  ['obstacle', 'obby_platformer'],
  ['parkour', 'obby_platformer'],
  ['tower of hell', 'obby_platformer'],
  
  // Simulator
  ['simulator', 'simulator'],
  ['sim', 'simulator'],
  ['pet sim', 'simulator'],
  ['idle', 'simulator'],
  
  // Roleplay/Lifesim
  ['roleplay', 'roleplay_lifesim'],
  ['rp', 'roleplay_lifesim'],
  ['life sim', 'roleplay_lifesim'],
  ['lifesim', 'roleplay_lifesim'],
  
  // Tycoon
  ['tycoon', 'tycoon'],
  
  // PvP/Battlegrounds
  ['pvp', 'battlegrounds_pvp'],
  ['battlegrounds', 'battlegrounds_pvp'],
  ['fighting', 'battlegrounds_pvp'],
  ['combat', 'battlegrounds_pvp'],
  ['shooter', 'battlegrounds_pvp'],
  
  // Anime RPG
  ['anime', 'anime_rpg'],
  ['anime rpg', 'anime_rpg'],
  ['rpg', 'anime_rpg'],
  
  // Social/Fashion
  ['fashion', 'social_coopetition'],
  ['dress up', 'social_coopetition'],
  
  // Racing
  ['racing', 'driving_racing'],
  ['driving', 'driving_racing'],
  ['car', 'driving_racing'],
  
  // Open World
  ['open world', 'open_world_action'],
  ['adventure', 'open_world_action'],
  ['exploration', 'open_world_action'],
  
  // Sports
  ['sports', 'sports_arcade'],
  ['soccer', 'sports_arcade'],
  ['basketball', 'sports_arcade'],
  
  // Tower Defense
  ['tower defense', 'tower_defense'],
  ['td', 'tower_defense'],
  
  // Minigames
  ['minigames', 'minigames_party'],
  ['party', 'minigames_party'],
];

/**
 * Find the best matching genre key from a user-specified genre string
 */
function matchUserGenre(userGenre: string): string | null {
  const normalized = userGenre.toLowerCase().trim();
  
  for (const [keyword, genreKey] of userGenreKeywords) {
    if (normalized.includes(keyword)) {
      return genreKey;
    }
  }
  
  return null;
}

/**
 * Analyze a Roblox game concept against market data
 */
export function analyzeRobloxMarket(
  concept: string,
  title: string = '',
  vibes: string[] = [],
  teamSize: string = '',
  userSpecifiedGenre: string = ''
): RobloxMarketAnalysis {
  // First, try to use user-specified genre if provided
  let matchedGenres = detectRobloxGenres(concept, title, vibes);
  
  // If user specified a genre, use that as primary (supports compound genres like "Horror / Social Deduction")
  if (userSpecifiedGenre) {
    const mappedKey = matchUserGenre(userSpecifiedGenre);
    if (mappedKey) {
      const userGenreInfo = getRobloxGenreInfo(mappedKey);
      if (userGenreInfo) {
        // Put user's genre first, keep others as secondary
        matchedGenres = [userGenreInfo, ...matchedGenres.filter(g => g.key !== mappedKey)];
      }
    }
  }
  
  const warnings: string[] = [];
  const opportunities: string[] = [];
  const insights: string[] = [];
  const competitorGames: Array<{ name: string; visits: string; monthly_revenue_estimate: string }> = [];

  const primaryGenre = matchedGenres[0] || null;

  // Check for hot genre opportunity
  let isHotGenre = false;
  if (primaryGenre?.isHotGenre) {
    isHotGenre = true;
    opportunities.push(`🔥 HOT GENRE: ${primaryGenre.name} is showing strong growth on Roblox right now!`);
    
    if (primaryGenre.lifecyclePhase === 'variant_window') {
      opportunities.push(`Window is open for differentiated takes on ${primaryGenre.name}`);
    } else if (primaryGenre.lifecyclePhase === 'proto') {
      opportunities.push(`Early mover advantage! ${primaryGenre.name} is still being defined on Roblox`);
    }
  }

  // Check for warning genres
  if (primaryGenre?.warning) {
    warnings.push(`⚠️ GENRE WARNING: ${primaryGenre.name} is oversaturated on Roblox`);
    warnings.push(primaryGenre.notes);
  }

  // Competition level insights
  if (primaryGenre) {
    const competitionMessages: Record<string, string> = {
      'extreme': '🔴 Extreme competition - need exceptional quality and unique hook',
      'very_high': '⚠️ Very high competition - strong differentiation required',
      'high': '📊 High competition - need clear unique selling point',
      'moderate': '✨ Moderate competition - good opportunity with quality execution',
      'low': '🚀 Low competition - excellent opportunity for first movers!'
    };

    const compMsg = competitionMessages[primaryGenre.competitionLevel];
    if (compMsg) {
      insights.push(compMsg);
    }

    // Growth trend insights
    const trendMessages: Record<string, string> = {
      'rising_fast': '📈 Rapidly rising - excellent timing!',
      'rising': '📈 Growing trend - good momentum',
      'stable': '➡️ Stable genre - consistent player interest',
      'declining': '📉 Declining trend - consider pivoting'
    };

    const trendMsg = trendMessages[primaryGenre.growthTrend];
    if (trendMsg) {
      insights.push(trendMsg);
    }

    // Team size check
    const teamSizeNum = parseInt(teamSize) || 1;
    if (teamSizeNum < primaryGenre.teamSizeMin) {
      warnings.push(`Team size alert: ${primaryGenre.name} typically requires ${primaryGenre.teamSizeMin}+ team members`);
    }

    // Add top competitors
    competitorGames.push(...primaryGenre.topGames);

    // Retention benchmarks
    insights.push(`Target D1 retention for ${primaryGenre.name}: ${primaryGenre.retentionBenchmarks.d1}%+`);
    insights.push(`Typical dev time: ${primaryGenre.devTime}`);
    
    // Monetization potential
    const monetizationMessages: Record<string, string> = {
      'excellent': '💰 Excellent monetization potential - strong revenue opportunity',
      'good': '💵 Good monetization potential',
      'moderate': '💲 Moderate monetization - may need creative strategies',
      'low': '⚠️ Low monetization potential - consider hybrid approaches'
    };
    
    const monMsg = monetizationMessages[primaryGenre.monetizationPotential];
    if (monMsg) {
      insights.push(monMsg);
    }

    // Success signals
    if (primaryGenre.successSignals.length > 0) {
      insights.push(`Key success signals: ${primaryGenre.successSignals.join(', ')}`);
    }
  }

  return {
    genreInfo: primaryGenre,
    matchedGenres,
    isHotGenre,
    warnings,
    opportunities,
    insights,
    competitorGames
  };
}

/**
 * Get Roblox retention benchmarks
 */
export function getRobloxRetentionBenchmarks() {
  return robloxBenchmarks.retention_benchmarks;
}

/**
 * Get Roblox session time benchmarks
 */
export function getRobloxSessionBenchmarks() {
  return robloxBenchmarks.session_time_benchmarks;
}

/**
 * Get Roblox CCU benchmarks
 */
export function getRobloxCCUBenchmarks() {
  return robloxBenchmarks.concurrent_users_benchmarks;
}

/**
 * Get Roblox monetization benchmarks
 */
export function getRobloxMonetizationBenchmarks() {
  return robloxBenchmarks.monetization_benchmarks;
}

/**
 * Get Roblox platform statistics
 */
export function getRobloxPlatformStats() {
  return robloxBenchmarks.platform_stats_2025;
}

/**
 * Get Roblox success patterns
 */
export function getRobloxSuccessPatterns() {
  return robloxBenchmarks.success_patterns;
}

/**
 * Get Roblox anti-patterns to avoid
 */
export function getRobloxAntiPatterns() {
  return robloxBenchmarks.anti_patterns;
}

/**
 * Get Roblox validation checklist
 */
export function getRobloxValidationChecklist() {
  return robloxBenchmarks.validation_checklist;
}

/**
 * Generate pivot suggestions for Roblox games
 */
export function generateRobloxPivotSuggestions(currentGenres: RobloxGenreInfo[]): string[] {
  const suggestions: string[] = [];
  const hotGenres = getHotRobloxGenres();

  // If not in a hot genre, suggest pivoting to one
  const isInHotGenre = currentGenres.some(g => g.isHotGenre);
  
  if (!isInHotGenre) {
    suggestions.push('Consider adding horror elements - horror games accept jank and are highly streamable');
    suggestions.push('Social/multiplayer features can dramatically increase retention and virality');
    suggestions.push('Fashion/voting mechanics (social co-opetition) are trending with untapped potential');
  }

  // Check for specific issues
  const hasWarningGenre = currentGenres.some(g => g.warning);
  if (hasWarningGenre) {
    suggestions.push('Your genre (obby/platformer) is extremely saturated. Consider: Tower-style mechanics, horror elements, or unique twist');
  }

  // Add hot genre suggestions
  const hotGenreInfo = hotGenres.map(g => getRobloxGenreInfo(g)).filter(Boolean) as RobloxGenreInfo[];
  for (const genre of hotGenreInfo.slice(0, 2)) {
    if (!currentGenres.some(cg => cg.key === genre.key)) {
      suggestions.push(`Pivot to ${genre.name}: ${genre.notes}`);
    }
  }

  // Add Roblox-specific suggestions
  suggestions.push('Open world action has high demand but low supply - 14M searches, few quality games');
  suggestions.push('Sports games are underserved - localized content (Brazil soccer, etc.) shows strong demand');

  return suggestions.slice(0, 5);
}

/**
 * Build Roblox market context for AI prompt
 */
export function buildRobloxMarketContext(
  concept: string,
  title: string,
  vibes: string[],
  teamSize: string
): string {
  const analysis = analyzeRobloxMarket(concept, title, vibes, teamSize);
  const platformStats = getRobloxPlatformStats();
  const retentionBenchmarks = getRobloxRetentionBenchmarks();
  const sessionBenchmarks = getRobloxSessionBenchmarks();
  const ccuBenchmarks = getRobloxCCUBenchmarks();
  
  let context = `
=== ROBLOX MARKET DATA (February 2026) ===

PLATFORM OVERVIEW:
- Daily Active Users: ${(platformStats.daily_active_users / 1000000).toFixed(1)} million
- Average play time: ${platformStats.hours_per_day_average} hours/day per user
- Total experiences: 40+ million (most never get players)
- Creator earnings (2024): $${(platformStats.creator_earnings_annual / 1000000).toFixed(0)}M total
- Top 1000 creators average: $${(platformStats.top_1000_creator_earnings / 1000000).toFixed(1)}M each

SUCCESS THRESHOLDS:
- Breakout hit: ${ccuBenchmarks.breakout_hit.ccu.toLocaleString()}+ CCU (${ccuBenchmarks.breakout_hit.monthly_revenue_estimate}/month)
- Successful game: ${ccuBenchmarks.successful.ccu.toLocaleString()}+ CCU (${ccuBenchmarks.successful.monthly_revenue_estimate}/month)
- Viable game: ${ccuBenchmarks.viable.ccu.toLocaleString()}+ CCU (${ccuBenchmarks.viable.monthly_revenue_estimate}/month)
- Struggling: <${ccuBenchmarks.growing.ccu} CCU - needs major changes

RETENTION TARGETS (must hit for viability):
- D1 (Day 1) retention: ${retentionBenchmarks.target_for_success.d1_minimum}%+ minimum
- D7 retention: ${retentionBenchmarks.target_for_success.d7_minimum}%+ minimum
- D30 retention: ${retentionBenchmarks.target_for_success.d30_minimum}%+ minimum
- Top 10% games: D1=${retentionBenchmarks.top_10_percent.d1}%, D7=${retentionBenchmarks.top_10_percent.d7}%, D30=${retentionBenchmarks.top_10_percent.d30}%

SESSION TIME TARGETS:
- Magic threshold: ${sessionBenchmarks.magic_threshold.minutes}+ minutes (viral potential unlocks)
- Top 10%: ${sessionBenchmarks.top_10_percent.minutes}+ minutes
- First session critical: ${sessionBenchmarks.first_session_critical.target_minutes}+ minutes or players leave

`;

  if (analysis.genreInfo) {
    context += `DETECTED PRIMARY GENRE: ${analysis.genreInfo.name}
- Competition level: ${analysis.genreInfo.competitionLevel}
- Growth trend: ${analysis.genreInfo.growthTrend}
- Lifecycle: ${analysis.genreInfo.lifecyclePhase}
- Monetization potential: ${analysis.genreInfo.monetizationPotential}
- Typical dev time: ${analysis.genreInfo.devTime}
- Minimum team size: ${analysis.genreInfo.teamSizeMin}
- Target D1 retention: ${analysis.genreInfo.retentionBenchmarks.d1}%
${analysis.genreInfo.warning ? '⚠️ WARNING: This genre is oversaturated on Roblox!' : ''}
${analysis.genreInfo.isHotGenre ? '🔥 HOT GENRE: This is trending with high growth potential!' : ''}

TOP COMPETITORS (study these):
${analysis.competitorGames.map(g => `- ${g.name}: ${g.visits} visits, ~${g.monthly_revenue_estimate}/month`).join('\n')}

SUCCESS SIGNALS FOR THIS GENRE:
${analysis.genreInfo.successSignals.map(s => `- ${s}`).join('\n')}

GENRE NOTES: ${analysis.genreInfo.notes}

`;
  }

  if (analysis.matchedGenres.length > 1) {
    context += `SECONDARY GENRES DETECTED:\n`;
    for (const genre of analysis.matchedGenres.slice(1)) {
      context += `- ${genre.name}: ${genre.competitionLevel} competition, ${genre.growthTrend} trend\n`;
    }
    context += '\n';
  }

  if (analysis.opportunities.length > 0) {
    context += `OPPORTUNITIES:\n${analysis.opportunities.map(o => `- ${o}`).join('\n')}\n\n`;
  }

  if (analysis.warnings.length > 0) {
    context += `WARNINGS:\n${analysis.warnings.map(w => `- ${w}`).join('\n')}\n\n`;
  }

  // Hot genres to consider
  const hotGenres = getHotRobloxGenres();
  context += `HOT GENRES ON ROBLOX RIGHT NOW:
${hotGenres.map(g => {
  const info = getRobloxGenreInfo(g);
  return info ? `- ${info.name}: ${info.notes}` : '';
}).filter(Boolean).join('\n')}

`;

  // Anti-patterns
  const antiPatterns = getRobloxAntiPatterns();
  context += `ROBLOX-SPECIFIC ANTI-PATTERNS TO FLAG:
Development: ${antiPatterns.development.slice(0, 3).map(p => p.pattern).join(', ')}
Design: ${antiPatterns.design.slice(0, 3).map(p => p.pattern).join(', ')}

`;

  // Roblox-specific factors
  context += `ROBLOX AUDIENCE FACTORS:
- Primary audience: Ages 9-15 (largest), 16-24 (growing, higher spending)
- Device split: 55% mobile, 35% desktop, 10% console
- Players expect weekly updates from top games
- Social/multiplayer features are critical for retention
- Streamability matters - horror and social games spread organically

`;

  return context;
}

// Legacy exports for backward compatibility (redirect to Roblox versions)
export const detectGenres = detectRobloxGenres;
export const getGenreInfo = getRobloxGenreInfo;
export const getAllGenres = getAllRobloxGenres;
export const analyzeMarket = analyzeRobloxMarket;
export const buildMarketContext = buildRobloxMarketContext;
export const generatePivotSuggestions = generateRobloxPivotSuggestions;
export const getAntiPatterns = getRobloxAntiPatterns;
export const getDevBenchmarks = () => robloxBenchmarks.development_velocity;
export const getSteamStats = getRobloxPlatformStats; // Redirect to Roblox stats
export const getValidationTimeline = getRobloxValidationChecklist;
export const getSuccessStories = getRobloxSuccessPatterns;
export const getPriceInsights = () => []; // Not applicable for Roblox (Robux-based)

// Type exports for backward compatibility
export type GenreKey = RobloxGenreKey;
export type GenreInfo = RobloxGenreInfo;
export type MarketAnalysis = RobloxMarketAnalysis;
