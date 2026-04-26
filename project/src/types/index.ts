// Core types for Betify betting exchange

export interface Team {
  name: string;
  short: string;
  score: string;
}

export interface Batsman {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  sr: number;
  onStrike: boolean;
}

export interface Bowler {
  name: string;
  overs: string;
  runs: number;
  wickets: number;
  economy: number;
}

export interface Situation {
  currentOver: string;
  runRate: string;
  requiredRunRate: string | null;
  target: number | null;
  partnership: string | null;
  lastWicket: string | null;
}

export interface ScoreDisplay {
  matchId: string;
  statusText: string;
  teams: Team[];
  overBalls: string[];
  batsmen: Batsman[];
  bowler: Bowler | null;
  situation: Situation;
}

export interface SelectionOdds {
  back: number;
  lay: number;
  impliedProb: number;
}

export interface LiveOdds {
  team1: SelectionOdds;
  team2: SelectionOdds;
}

export interface Match {
  id: string;
  sport: string;
  league: string;
  team1Name: string;
  team2Name: string;
  team1Score: string;
  team2Score: string;
  status: string;
  startTime: string;
  isLive: boolean;
}

export interface Bet {
  id: string;
  selectionName: string;
  marketType: string;
  betType: 'back' | 'lay';
  odds: number;
  stake: number;
  exposure: number;
  potentialProfit: number;
  status: string;
  pnl: number | null;
  placedAt: string;
}

export interface Market {
  id: string;
  matchId: string;
  type: string;
  name: string;
  status: string;
  minStake: number;
  maxStake: number;
  selections: Selection[];
}

export interface Selection {
  id: string;
  marketId: string;
  name: string;
  backOdds: number;
  layOdds: number;
  prevBackOdds: number;
  prevLayOdds: number;
  oddsMoved: 'up' | 'down' | null;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  note: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  exposure: number;
  available: number;
  role: string;
}