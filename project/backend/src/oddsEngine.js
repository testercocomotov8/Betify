// Odds Engine - T20 Win Probability Model
// Calculates Back/Lay odds based on match state

class OddsEngine {
  // Convert probability to exchange odds
  probToOdds(p) {
    if (p <= 0.01) return 99.0;
    if (p >= 0.99) return 1.01;
    return Math.round((1 / p) * 100) / 100;
  }

  // Generate back/lay spread - widens as odds lengthen
  spread(midOdds) {
    if (midOdds < 1.5) return 0.02;
    if (midOdds < 2.0) return 0.04;
    if (midOdds < 3.0) return 0.06;
    if (midOdds < 5.0) return 0.10;
    if (midOdds < 10.0) return 0.20;
    return 0.50;
  }

  makeOdds(prob) {
    // 3.5% margin for exchange
    const adjProb = prob * (1 - 0.035);
    const mid = this.probToOdds(adjProb);
    const s = this.spread(mid);
    return {
      back: parseFloat((mid - s / 2).toFixed(2)),
      lay: parseFloat((mid + s / 2).toFixed(2)),
      impliedProb: Math.round(prob * 100) / 100
    };
  }

  // T20 chase win probability using resource model
  chaseWinProb(state) {
    if (!state.target) return 0.5;
    
    const runsNeeded = state.target - state.battingScore;
    const ballsRemaining = 120 - state.ballsBowled;
    const wktsRemaining = 10 - state.wickets;

    if (runsNeeded <= 0) return 0.99;
    if (ballsRemaining <= 0 || wktsRemaining <= 0) return 0.01;

    // Resource percentage
    const ballsFrac = ballsRemaining / 120;
    const wktsFrac = wktsRemaining / 10;
    const resource = Math.pow(ballsFrac, 0.45) * Math.pow(wktsFrac, 0.75);

    // Expected runs from remaining resource
    const expectedRuns = 160 * resource;
    const feasibility = expectedRuns / runsNeeded;

    // Run rate pressure
    const rrRatio = state.requiredRunRate ? Math.min(state.runRate / state.requiredRunRate, 2) : 1;

    let prob = (feasibility * 0.55) + ((rrRatio / 2) * 0.45);
    return Math.max(0.03, Math.min(0.97, prob));
  }

  // First innings projected probability
  firstInningsProb(state) {
    const ballsRemaining = 120 - state.ballsBowled;
    const wktsRemaining = 10 - state.wickets;

    if (wktsRemaining <= 0 || ballsRemaining <= 0) {
      const prob = 0.35 + (state.battingScore - 120) / 200;
      return Math.max(0.2, Math.min(0.8, prob));
    }

    const resource = Math.pow(ballsRemaining / 120, 0.45) * Math.pow(wktsRemaining / 10, 0.75);
    const projectedTotal = state.battingScore + (160 * resource);
    const prob = 0.35 + (projectedTotal - 130) / 200;
    return Math.max(0.2, Math.min(0.8, prob));
  }

  // Main recalculate after each ball
  recalculate(state, ballEvent = 'run') {
    const battingProb = state.innings === 2 ? this.chaseWinProb(state) : this.firstInningsProb(state);
    const bowlingProb = 1 - battingProb;

    // In innings 1: team1 batting, team2 bowling
    // In innings 2: team2 batting (chasing), team1 bowling
    const team1Prob = state.innings === 1 ? battingProb : bowlingProb;
    const team2Prob = state.innings === 1 ? bowlingProb : battingProb;

    return {
      team1: this.makeOdds(team1Prob),
      team2: this.makeOdds(team2Prob)
    };
  }

  // Bookmaker odds (no lay, tighter margin)
  bookmakerOdds(exchangeOdds) {
    return {
      team1: parseFloat((exchangeOdds.team1.back * 0.95).toFixed(2)),
      team2: parseFloat((exchangeOdds.team2.back * 0.95).toFixed(2))
    };
  }

  // Fancy market lines
  fancyLine(type, state) {
    const rr = state.runRate || 6;
    if (type === 'next_over_runs') {
      const expected = Math.round(rr * 0.9);
      return { yes: expected + 1, no: expected + 1 };
    }
    if (type === 'total_sixes') {
      const projected = Math.round((state.ballsBowled > 0 ? (state.battingScore / state.ballsBowled) * 120 : 160) / 20);
      return { yes: projected + 1, no: projected + 1 };
    }
    return null;
  }
}

export const oddsEngine = new OddsEngine();