// Database module - SQLite implementation for local development
// In production, replace with Supabase client

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

const db = new Database(':memory:');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    auth_id TEXT UNIQUE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    balance REAL NOT NULL DEFAULT 1000.00,
    exposure REAL NOT NULL DEFAULT 0.00,
    total_deposited REAL NOT NULL DEFAULT 0.00,
    total_withdrawn REAL NOT NULL DEFAULT 0.00,
    role TEXT NOT NULL DEFAULT 'user',
    is_banned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    balance_before REAL NOT NULL,
    balance_after REAL NOT NULL,
    reference_id TEXT,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    sport TEXT NOT NULL,
    league TEXT,
    league_id TEXT,
    team1_id TEXT,
    team2_id TEXT,
    team1_name TEXT,
    team2_name TEXT,
    team1_short TEXT,
    team2_short TEXT,
    team1_score TEXT,
    team2_score TEXT,
    venue TEXT,
    status TEXT NOT NULL DEFAULT 'upcoming',
    innings INTEGER NOT NULL DEFAULT 1,
    last_ball_id TEXT,
    start_time TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS markets (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    min_stake REAL NOT NULL DEFAULT 100,
    max_stake REAL NOT NULL DEFAULT 10000,
    result TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    settled_at TEXT,
    FOREIGN KEY (match_id) REFERENCES matches(id)
  );

  CREATE TABLE IF NOT EXISTS selections (
    id TEXT PRIMARY KEY,
    market_id TEXT NOT NULL,
    name TEXT NOT NULL,
    back_odds REAL,
    lay_odds REAL,
    prev_back_odds REAL,
    prev_lay_odds REAL,
    odds_moved TEXT,
    liquidity_back REAL DEFAULT 50000,
    liquidity_lay REAL DEFAULT 50000,
    is_winner INTEGER,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (market_id) REFERENCES markets(id)
  );

  CREATE TABLE IF NOT EXISTS fancy_markets (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL,
    name TEXT NOT NULL,
    yes_odds REAL,
    no_odds REAL,
    yes_price INTEGER DEFAULT 100,
    no_price INTEGER DEFAULT 100,
    min_stake REAL DEFAULT 100,
    max_stake REAL DEFAULT 25000,
    status TEXT NOT NULL DEFAULT 'open',
    result REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    settled_at TEXT,
    FOREIGN KEY (match_id) REFERENCES matches(id)
  );

  CREATE TABLE IF NOT EXISTS bets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    match_id TEXT NOT NULL,
    market_id TEXT,
    fancy_market_id TEXT,
    selection_id TEXT,
    selection_name TEXT NOT NULL,
    market_type TEXT NOT NULL,
    bet_type TEXT NOT NULL,
    odds REAL NOT NULL,
    stake REAL NOT NULL,
    exposure REAL NOT NULL,
    potential_profit REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    pnl REAL,
    cashout_value REAL,
    placed_at TEXT NOT NULL DEFAULT (datetime('now')),
    settled_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (match_id) REFERENCES matches(id)
  );

  CREATE TABLE IF NOT EXISTS odds_log (
    id TEXT PRIMARY KEY,
    selection_id TEXT NOT NULL,
    back_odds REAL,
    lay_odds REAL,
    trigger TEXT,
    logged_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (selection_id) REFERENCES selections(id)
  );
`);

// Helper functions
const dbModule = {
  // User operations
  async getUser(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  async getUserByAuthId(authId) {
    return db.prepare('SELECT * FROM users WHERE auth_id = ?').get(authId);
  },

  async createUser(data) {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO users (id, auth_id, username, email, phone, balance, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.auth_id, data.username, data.email, data.phone || null, data.balance || 1000, data.role || 'user');
    return this.getUser(id);
  },

  async lockExposure(userId, amount) {
    const user = this.getUser(userId);
    if (!user) return { success: false, error: 'User not found' };
    
    const available = user.balance - user.exposure + (amount < 0 ? -amount : 0);
    if (amount > 0 && available < amount) {
      return { success: false, error: 'Insufficient balance' };
    }
    
    db.prepare('UPDATE users SET exposure = exposure + ? WHERE id = ?').run(amount, userId);
    return { success: true };
  },

  async settleUser(userId, exposure, winnings) {
    db.prepare('UPDATE users SET exposure = MAX(0, exposure - ?), balance = balance + ? WHERE id = ?')
      .run(exposure, winnings, userId);
  },

  async deposit(userId, amount) {
    const user = this.getUser(userId);
    db.prepare('UPDATE users SET balance = balance + ?, total_deposited = total_deposited + ? WHERE id = ?')
      .run(amount, amount, userId);
    return this.getUser(userId);
  },

  async withdraw(userId, amount) {
    const user = this.getUser(userId);
    const available = user.balance - user.exposure;
    if (available < amount) {
      return { success: false, error: 'Insufficient available balance' };
    }
    db.prepare('UPDATE users SET balance = balance - ?, total_withdrawn = total_withdrawn + ? WHERE id = ?')
      .run(amount, amount, userId);
    return { success: true, user: this.getUser(userId) };
  },

  // Match operations
  async getMatches(status) {
    if (status) {
      return db.prepare('SELECT * FROM matches WHERE status = ? ORDER BY start_time').all(status);
    }
    return db.prepare('SELECT * FROM matches ORDER BY start_time').all();
  },

  async getMatch(id) {
    return db.prepare('SELECT * FROM matches WHERE id = ?').get(id);
  },

  async createMatch(data) {
    db.prepare(`
      INSERT INTO matches (id, sport, league, league_id, team1_name, team2_name, team1_short, team2_short, status, start_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(data.id, data.sport, data.league, data.league_id, data.team1_name, data.team2_name, 
           data.team1_short, data.team2_short, data.status || 'upcoming', data.start_time);
    return this.getMatch(data.id);
  },

  async updateMatch(id, data) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id);
    db.prepare(`UPDATE matches SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...values);
    return this.getMatch(id);
  },

  // Market operations
  async getMarkets(matchId) {
    return db.prepare('SELECT * FROM markets WHERE match_id = ?').all(matchId);
  },

  async getMarket(id) {
    return db.prepare('SELECT * FROM markets WHERE id = ?').get(id);
  },

  async createMarket(data) {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO markets (id, match_id, type, name, status, min_stake, max_stake)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.match_id, data.type, data.name, data.status || 'open', data.min_stake || 100, data.max_stake || 10000);
    return this.getMarket(id);
  },

  async settleMarket(id, winner) {
    db.prepare("UPDATE markets SET status = 'settled', result = ?, settled_at = datetime('now') WHERE id = ?")
      .run(winner, id);
  },

  // Selection operations
  async getSelections(marketId) {
    return db.prepare('SELECT * FROM selections WHERE market_id = ?').all(marketId);
  },

  async getSelection(id) {
    return db.prepare('SELECT * FROM selections WHERE id = ?').get(id);
  },

  async createSelection(data) {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO selections (id, market_id, name, back_odds, lay_odds)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, data.market_id, data.name, data.back_odds || 1.5, data.lay_odds || 1.5);
    return this.getSelection(id);
  },

  async updateSelection(id, data) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id);
    db.prepare(`UPDATE selections SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...values);
    return this.getSelection(id);
  },

  // Bet operations
  async placeBet(data) {
    const id = randomUUID();
    try {
      db.prepare(`
        INSERT INTO bets (id, user_id, match_id, market_id, selection_id, selection_name, market_type, bet_type, odds, stake, exposure, potential_profit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, data.user_id, data.match_id, data.market_id, data.selection_id, data.selection_name, 
             data.market_type, data.bet_type, data.odds, data.stake, data.exposure, data.potential_profit);
      return this.getBet(id);
    } catch (e) {
      return null;
    }
  },

  async getBet(id) {
    return db.prepare('SELECT * FROM bets WHERE id = ?').get(id);
  },

  async getUserBets(userId, status) {
    if (status) {
      return db.prepare('SELECT * FROM bets WHERE user_id = ? AND status = ? ORDER BY placed_at DESC').all(userId, status);
    }
    return db.prepare('SELECT * FROM bets WHERE user_id = ? ORDER BY placed_at DESC').all(userId);
  },

  async getOpenBetsForMarket(marketId) {
    return db.prepare("SELECT * FROM bets WHERE market_id = ? AND status = 'open'").all(marketId);
  },

  async cashoutBet(id, cashoutValue, pnl) {
    db.prepare("UPDATE bets SET status = 'cashedout', cashout_value = ?, pnl = ?, settled_at = datetime('now') WHERE id = ?")
      .run(cashoutValue, pnl, id);
  },

  async settleBet(id, status, pnl) {
    db.prepare('UPDATE bets SET status = ?, pnl = ?, settled_at = datetime(\'now\') WHERE id = ?')
      .run(status, pnl, id);
  },

  // Transaction operations
  async logTransaction(data) {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO transactions (id, user_id, type, amount, balance_before, balance_after, reference_id, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.user_id, data.type, data.amount, data.balance_before, data.balance_after, data.reference_id || null, data.note || null);
    return id;
  },

  async getUserTransactions(userId, limit = 50) {
    return db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit);
  },

  // Odds log
  async logOdds(selectionId, backOdds, layOdds, trigger) {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO odds_log (id, selection_id, back_odds, lay_odds, trigger)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, selectionId, backOdds, layOdds, trigger);
  }
};

export default dbModule;