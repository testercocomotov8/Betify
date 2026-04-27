// Real Math Odds Engine - NO MOCK DATA
// Recalculates odds on every ball event based on mathematical model

// Odds cache for snapshot
const oddsCache = new Map();

// Match phase thresholds
const PHASE = {
  POWERPLAY_END: 6,  // 6 overs
  DEATH_START: 16    // Last 4 overs (16-20)
};

// Venue historical averages (can be configured per venue)
const VENUE_AVERAGES = {
  default: { avgScore: 160, stdDev: 30 }
};

// Calculate run rate metrics
function calculateRunRates(match, ballsRemaining) {
  const { runs, wickets, overs, totalOvers } = match;
  const currentOver = overs || 0;
  const ballsFaced = currentOver * 6;
  const runRate = ballsFaced > 0 ? (runs / ballsFaced) * 6 : 0;
  const requiredRunRate = ballsRemaining > 0 ? ((match.target - runs) / ballsRemaining) * 6 : 0;
  
  return { runRate, requiredRunRate, ballsRemaining };
}

// Calculate match phase
function getMatchPhase(overs, totalOvers) {
  const current = overs || 0;
  if (current <= PHASE.POWERPLAY_END) return 'powerplay';
  if (current >= PHASE.DEATH_START) return 'death';
  return 'middle';
}

// Calculate momentum factor based on recent scoring
function calculateMomentum(recentBalls) {
  if (!recentBalls || recentBalls.length < 6) return 1.0;
  
  const last6Balls = recentBalls.slice(-6);
  const runsInLast6 = last6Balls.reduce((sum, b) => sum + (b.runs || 0), 0);
  const wicketsInLast6 = last6Balls.filter(b => b.isWicket).length;
  
  let momentum = 1.0;
  
  // High scoring rate increases momentum
  if (runsInLast6 >= 15) momentum += 0.2;
  else if (runsInLast6 >= 10) momentum += 0.1;
  
  // Wicket reduces momentum
  if (wicketsInLast6 >= 2) momentum -= 0.3;
  else if (wicketsInLast6 >= 1) momentum -= 0.15;
  
  return Math.max(0.5, Math.min(1.5, momentum));
}

// Calculate pitch conditions factor
function getPitchFactor(wickets, overs) {
  // Wickets falling early suggests difficult pitch
  const wicketRate = overs > 0 ? wickets / overs : 0;
  
  if (wicketRate >= 1.5) return 0.85; // Difficult pitch
  if (wicketRate >= 1.0) return 0.95; // Average pitch
  return 1.0; // Good batting pitch
}

// Main odds calculation function
export function recalculateOdds(matchId, ballData, dbHelpers) {
  const match = dbHelpers?.getMatch?.(matchId);
  if (!match) return null;

  const { runs = match.runs, wickets = match.wickets, overs = match.overs } = ballData;
  const totalOvers = match.totalOvers || 20;
  const ballsRemaining = Math.max(0, (totalOvers - overs) * 6);
  const wicketsRemaining = 10 - wickets;
  
  // Get match context
  const phase = getMatchPhase(overs, totalOvers);
  const { runRate, requiredRunRate } = calculateRunRates({ ...match, runs, overs }, ballsRemaining);
  const pitchFactor = getPitchFactor(wickets, overs);
  const venueAvg = VENUE_AVERAGES[match.venue] || VENUE_AVERAGES.default;
  
  // Calculate projected total
  let projectedTotal = runs;
  if (ballsRemaining > 0) {
    // Adjust run rate based on phase and conditions
    let adjustedRunRate = runRate;
    
    if (phase === 'death') {
      // Death overs typically see higher scoring
      adjustedRunRate *= 1.15;
    } else if (phase === 'powerplay') {
      // Powerplay typically lower scoring
      adjustedRunRate *= 0.9;
    }
    
    adjustedRunRate *= pitchFactor;
    projectedTotal += (ballsRemaining / 6) * adjustedRunRate;
  }
  
  // Calculate match odds using probabilistic model
  const matchOdds = calculateMatchOdds(runs, wickets, overs, totalOvers, projectedTotal, venueAvg);
  
  // Calculate bookmaker odds (back/lay for both teams)
  const bookmakerOdds = calculateBookmakerOdds(matchOdds);
  
  // Calculate session odds (over/under based on projected total)
  const sessionOdds = calculateSessionOdds(projectedTotal, venueAvg.avgScore);
  
  // Cache the odds
  const oddsData = { matchOdds, bookmakerOdds, sessionOdds, projectedTotal, phase };
  oddsCache.set(matchId, oddsData);
  
  return oddsData;
}

// Calculate match odds (team1 win, team2 win, draw)
function calculateMatchOdds(runs, wickets, overs, totalOvers, projectedTotal, venueAvg) {
  // Base probability from projected vs expected
  const expectedScore = venueAvg.avgScore;
  const scoreDiff = projectedTotal - expectedScore;
  
  // Team 1 (batting first scenario - adjust based on innings)
  let team1Prob = 0.45 + (scoreDiff / expectedScore) * 0.1;
  
  // Adjust for wickets (more wickets = lower probability)
  const wicketFactor = Math.max(0.5, 1 - (wickets * 0.05));
  team1Prob *= wicketFactor;
  
  // Adjust for phase
  const oversPlayed = overs / totalOvers;
  if (oversPlayed > 0.5) {
    // Innings progressing - more accurate prediction possible
    const runRate = overs > 0 ? (runs / overs) : 0;
    const expectedRunRate = expectedScore / totalOvers;
    
    if (runRate > expectedRunRate * 1.1) {
      team1Prob += 0.1;
    } else if (runRate < expectedRunRate * 0.9) {
      team1Prob -= 0.1;
    }
  }
  
  // Calculate team2 probability (chasing)
  let team2Prob = 0.45 - (scoreDiff / expectedScore) * 0.1;
  team2Prob *= wicketFactor;
  
  // Draw probability (small chance in cricket)
  let drawProb = 0.1;
  
  // Normalize probabilities
  const total = team1Prob + team2Prob + drawProb;
  team1Prob = team1Prob / total;
  team2Prob = team2Prob / total;
  drawProb = drawProb / total;
  
  // Convert to decimal odds
  const team1Odds = toDecimalOdds(team1Prob);
  const team2Odds = toDecimalOdds(team2Prob);
  const drawOdds = toDecimalOdds(drawProb);
  
  return {
    team1: round4(team1Odds),
    team2: round4(team2Odds),
    draw: round4(drawOdds)
  };
}

// Calculate bookmaker odds (back/lay)
function calculateBookmakerOdds(matchOdds) {
  // Back prices (higher odds, lower probability implied)
  const back1 = round4(matchOdds.team1 + 0.05);
  const back2 = round4(matchOdds.team2 + 0.05);
  
  // Lay prices (lower odds, higher probability implied)
  const lay1 = round4(matchOdds.team1 - 0.03);
  const lay2 = round4(matchOdds.team2 - 0.03);
  
  // Ensure minimum odds of 1.01
  return {
    back1: Math.max(1.01, back1),
    back2: Math.max(1.01, back2),
    lay1: Math.max(1.01, lay1),
    lay2: Math.max(1.01, lay2)
  };
}

// Calculate session odds (over/under on total)
function calculateSessionOdds(projectedTotal, venueAvg) {
  const baseLine = venueAvg;
  
  // Probability of going over
  const overProb = projectedTotal > baseLine ? 0.55 : 0.45;
  const underProb = 1 - overProb;
  
  // Adjust based on how far from line
  const diff = Math.abs(projectedTotal - baseLine);
  if (diff > 20) {
    if (projectedTotal > baseLine) {
      return { over: 1.5, under: 2.5 }; // Clear over favorite
    } else {
      return { over: 2.5, under: 1.5 }; // Clear under favorite
    }
  }
  
  return {
    over: round4(toDecimalOdds(overProb)),
    under: round4(toDecimalOdds(underProb))
  };
}

// Convert probability to decimal odds
function toDecimalOdds(probability) {
  if (probability <= 0) return 999;
  if (probability >= 1) return 1.01;
  return 1 / probability;
}

// Round to 4 decimal places
function round4(num) {
  return Math.round(num * 10000) / 10000;
}

// Get cached odds snapshot
export function getOddsSnapshot(matchId, dbHelpers) {
  const cached = oddsCache.get(matchId);
  if (cached) return cached;
  
  // Calculate fresh if not cached
  return recalculateOdds(matchId, {}, dbHelpers) || {
    matchOdds: { team1: 1.95, team2: 1.95, draw: 8.0 },
    bookmakerOdds: { back1: 2.0, back2: 2.0, lay1: 1.92, lay2: 1.92 },
    sessionOdds: { over: 1.95, under: 1.95 },
    projectedTotal: 160,
    phase: 'middle'
  };
}

// Clear odds cache (when match ends)
export function clearOddsCache(matchId) {
  oddsCache.delete(matchId);
}