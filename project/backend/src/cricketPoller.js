// Cricket Poller - ESPN API polling engine
import fetch from 'node-fetch';

const POLL_INTERVAL_MS = 3500;
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/cricket';
const ESPN_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
  'Accept': 'application/json',
  'Referer': 'https://www.espncricinfo.com/'
};

export class CricketPoller {
  constructor() {
    this.pollers = new Map();
    this.io = null;
    this.database = null;
    this.oddsEngine = null;
  }

  setIO(io) {
    this.io = io;
  }

  setDatabase(db) {
    this.database = db;
  }

  setOddsEngine(engine) {
    this.oddsEngine = engine;
  }

  startMatch(matchId, leagueSlug = 'ipl') {
    if (this.pollers.has(matchId)) return;

    const poller = {
      leagueSlug,
      failCount: 0,
      lastBallId: null,
      lastState: null,
      interval: setInterval(() => this.tick(matchId), POLL_INTERVAL_MS)
    };

    this.pollers.set(matchId, poller);
    this.tick(matchId); // immediate first fetch
  }

  stopMatch(matchId) {
    const p = this.pollers.get(matchId);
    if (p) {
      clearInterval(p.interval);
      this.pollers.delete(matchId);
    }
  }

  async tick(matchId) {
    const p = this.pollers.get(matchId);
    if (!p) return;

    try {
      const raw = await this.fetchESPN(matchId, p.leagueSlug);
      const parsed = this.parseESPN(raw, matchId);
      if (!parsed) return;

      const isNewBall = parsed.lastBallId !== p.lastBallId;
      if (!isNewBall && p.lastBallId !== null) return;

      p.lastBallId = parsed.lastBallId;
      p.failCount = 0;

      // Recalculate odds
      const newOdds = this.oddsEngine.recalculate(parsed.matchState, parsed.lastBallEvent);

      // Persist to database
      await this.syncToDatabase(matchId, parsed, newOdds);

      // Broadcast to all clients
      if (this.io) {
        this.io.to(`match:${matchId}`).emit('score_update', {
          matchId,
          display: parsed.display,
          odds: newOdds,
          event: parsed.lastBallEvent,
          isWicket: parsed.lastBallEvent === 'wicket',
          isSix: parsed.lastBallEvent === 'six',
          isFour: parsed.lastBallEvent === 'four',
          timestamp: Date.now()
        });
      }

      p.lastState = parsed;
    } catch (err) {
      p.failCount++;
      console.error(`[Poller ${matchId}] Fail #${p.failCount}:`, err.message);

      if (p.failCount >= 6) {
        console.error(`[Poller ${matchId}] All score APIs down. Suspending markets.`);
        if (this.database) {
          this.database.suspendMatchMarkets(matchId);
        }
        if (this.io) {
          this.io.to(`match:${matchId}`).emit('score_unavailable', {
            matchId,
            reason: 'Score feed temporarily unavailable. Markets suspended.',
            timestamp: Date.now()
          });
        }
      }
    }
  }

  async fetchESPN(matchId, leagueSlug) {
    const url = `${ESPN_BASE}/${leagueSlug}/summary?event=${matchId}`;
    const res = await fetch(url, {
      headers: ESPN_HEADERS,
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) throw new Error(`ESPN HTTP ${res.status}`);
    return res.json();
  }

  parseESPN(raw, matchId) {
    try {
      const comp = raw?.header?.competitions?.[0];
      const situation = raw?.situation ?? {};
      const commentary = raw?.commentary?.items ?? [];
      const boxscore = raw?.boxscore;

      if (!comp) return null;

      const teams = (comp.competitors ?? []).map(c => ({
        name: c.team?.displayName ?? '',
        short: c.team?.abbreviation ?? '',
        score: c.score ?? '0',
        id: c.team?.id
      }));

      const lastBall = commentary[0] ?? null;
      const lastBallId = lastBall?.id ?? null;
      const lastBallEvent = this.mapBallType(lastBall?.type?.id);
      const lastBallRuns = lastBall?.scoreValue ?? 0;
      const lastBallText = lastBall?.text ?? '';

      // Parse current over balls
      const overBalls = commentary
        .slice(0, 6)
        .map(b => {
          if (b.type?.id === 'wicket') return 'W';
          if (b.type?.id === 'wide') return 'Wd';
          if (b.type?.id === 'no ball') return 'Nb';
          if (!b.scoreValue) return '.';
          return String(b.scoreValue);
        })
        .reverse();

      // Batsmen
      const battingPlayers = boxscore?.players?.[0]?.statistics?.[0]?.athletes ?? [];
      const batsmen = battingPlayers
        .filter(a => a.active)
        .map(a => ({
          name: a.athlete?.shortName ?? '',
          runs: Number(a.stats?.[0] ?? 0),
          balls: Number(a.stats?.[1] ?? 0),
          fours: Number(a.stats?.[2] ?? 0),
          sixes: Number(a.stats?.[3] ?? 0),
          sr: Number(a.stats?.[4] ?? 0),
          onStrike: a.onField && !a.throwing
        }));

      // Current bowler
      const bowlingPlayers = boxscore?.players?.[1]?.statistics?.[0]?.athletes ?? [];
      const bowlerRaw = bowlingPlayers.find(a => a.active && a.throwing);
      const bowler = bowlerRaw ? {
        name: bowlerRaw.athlete?.shortName ?? '',
        overs: bowlerRaw.stats?.[0] ?? '0',
        runs: Number(bowlerRaw.stats?.[1] ?? 0),
        wickets: Number(bowlerRaw.stats?.[2] ?? 0),
        economy: Number(bowlerRaw.stats?.[3] ?? 0)
      } : null;

      // Match state
      const overStr = situation.currentOver ?? '0.0';
      const overNum = parseFloat(overStr);
      const ballsBowled = Math.floor(overNum) * 6 + Math.round((overNum % 1) * 10);

      const scoreStr = teams[0]?.score ?? '0';
      const scoreMatch = scoreStr.match(/(\d+)(?:\/(\d+))?/);
      const battingScore = parseInt(scoreMatch?.[1] ?? '0');
      const wickets = parseInt(scoreMatch?.[2] ?? '0');

      const matchState = {
        innings: comp.status?.period ?? 1,
        battingScore,
        wickets,
        ballsBowled,
        target: situation.target ? parseInt(situation.target) : null,
        team1IsBatting: true,
        runRate: parseFloat(situation.runRate ?? '0'),
        requiredRunRate: situation.requiredRunRate ? parseFloat(situation.requiredRunRate) : null
      };

      return {
        lastBallId,
        lastBallEvent,
        lastBallRuns,
        lastBallText,
        matchState,
        display: {
          matchId,
          statusText: comp.status?.type?.description ?? '',
          teams,
          overBalls,
          batsmen,
          bowler,
          situation: {
            currentOver: overStr,
            runRate: situation.runRate ?? '0',
            requiredRunRate: situation.requiredRunRate ?? null,
            target: matchState.target,
            partnership: situation.partnership ?? null,
            lastWicket: situation.lastWicket ?? null
          }
        }
      };
    } catch (err) {
      console.error('[espnParser] Parse error:', err);
      return null;
    }
  }

  mapBallType(typeId) {
    const map = {
      'four': 'four',
      'six': 'six',
      'wicket': 'wicket',
      'wide': 'wide',
      'no ball': 'noball'
    };
    return map[typeId] ?? 'run';
  }

  async syncToDatabase(matchId, parsed, odds) {
    if (!this.database) return;

    // Update match scores
    this.database.updateMatch(matchId, {
      team1_score: parsed.display.teams?.[0]?.score,
      team2_score: parsed.display.teams?.[1]?.score,
      status: parsed.display.statusText,
      innings: parsed.matchState.innings,
      last_ball_id: parsed.lastBallId
    });

    // Update selections odds
    if (odds?.team1 && odds?.team2) {
      const market = this.database.getMatchMarket(matchId, 'match_odds');
      if (market) {
        const selections = this.database.getSelectionsByMarket(market.id);
        for (const sel of selections) {
          const teamOdds = sel.name === parsed.display.teams?.[0]?.name ? odds.team1 : odds.team2;
          this.database.updateSelection(sel.id, {
            prev_back_odds: sel.back_odds,
            prev_lay_odds: sel.lay_odds,
            back_odds: teamOdds.back,
            lay_odds: teamOdds.lay,
            odds_moved: teamOdds.back > sel.back_odds ? 'up' : teamOdds.back < sel.back_odds ? 'down' : null
          });

          // Log to odds history
          this.database.insertOddsLog({
            selection_id: sel.id,
            back_odds: teamOdds.back,
            lay_odds: teamOdds.lay,
            trigger: parsed.lastBallEvent
          });
        }
      }
    }
  }
}

export const cricketPoller = new CricketPoller();