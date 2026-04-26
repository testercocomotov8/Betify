// Database module - SQLite for local development
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

class DatabaseManager {
  constructor() {
    this.db = null;
  }

  init(dbPath = './betify.db') {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.createTables();
    this.seedData();
    console.log('[DB] SQLite database initialized');
  }

  createTables() {
    this.db.exec(`
      -- Users table
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

      -- Transactions ledger
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

      -- Matches (synced from ESPN)
      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        sport TEXT NOT NULL DEFAULT 'cricket',
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

      -- Markets per match
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

      -- Selections per market
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

      -- Fancy markets
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

      -- Bets
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

      -- Odds movement log
      CREATE TABLE IF NOT EXISTS odds_log (
        id TEXT PRIMARY KEY,
        selection_id TEXT NOT NULL,
        back_odds REAL,
        lay_odds REAL,
        trigger TEXT,
        logged_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (selection_id) REFERENCES selections(id)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_bets_user ON bets(user_id);
      CREATE INDEX IF NOT EXISTS idx_bets_match ON bets(match_id);
      CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
      CREATE INDEX IF NOT EXISTS idx_markets_match ON markets(match_id);
      CREATE INDEX IF NOT EXISTS idx_selections_market ON selections(market_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
    `);
  }

  seedData() {
    // Check if we already have data
    const existingMatches = this.db.prepare('SELECT COUNT(*) as count FROM matches').get();
    if (existingMatches.count > 0) return;

    // Seed demo matches
    const matches = [
      { id: 'espn.1398300', team1: 'Mumbai Indians', team2: 'Chennai Super Kings', league: 'IPL', status: 'live', team1_score: '186/4 (18.3)', team2_score: '0/0' },
      { id: 'espn.1398301', team1: 'Royal Challengers Bangalore', team2: 'Kolkata Knight Riders', league: 'IPL', status: 'upcoming', team1_score: '', team2_score: '' },
      { id: 'espn.1398302', team1: 'Delhi Capitals', team2: 'Punjab Kings', league: 'IPL', status: 'live', team1_score: '145/3 (15.0)', team2_score: '0/0' },
      { id: 'espn.1398303', team1: 'Rajasthan Royals', team2: 'Sunrisers Hyderabad', league: 'IPL', status: 'upcoming', team1_score: '', team2: '' },
    ];

    const insertMatch = this.db.prepare(`
      INSERT INTO matches (id, team1_name, team2_name, league, status, team1_score, team2_score, start_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+1 hour'))
    `);

    const insertMarket = this.db.prepare(`
      INSERT INTO markets (id, match_id, type, name, status)
      VALUES (?, ?, 'match_odds', 'Match Odds', 'open')
    `);

    const insertSelection = this.db.prepare(`
      INSERT INTO selections (id, market_id, name, back_odds, lay_odds)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const m of matches) {
      insertMatch.run(m.id, m.team1, m.team2, m.league, m.status, m.team1_score, m.team2_score);
      const marketId = uuidv4();
      insertMarket.run(marketId, m.id);
      // Team 1 odds
      insertSelection.run(uuidv4(), marketId, m.team1, 1.85 + Math.random() * 0.3, 1.90 + Math.random() * 0.3);
      // Team 2 odds
      insertSelection.run(uuidv4(), marketId, m.team2, 2.00 + Math.random() * 0.3, 2.05 + Math.random() * 0.3);
      // Draw
      insertSelection.run(uuidv4(), marketId, 'The Draw', 8.00, 9.00);
    }

    // Seed demo user
    const demoUserId = uuidv4();
    this.db.prepare(`
      INSERT INTO users (id, username, email, balance, role)
      VALUES (?, 'demo_user', 'demo@betify.com', 10000.00, 'user')
    `).run(demoUserId);

    // Seed admin user
    this.db.prepare(`
      INSERT INTO users (id, username, email, balance, role)
      VALUES (?, 'admin', 'admin@betify.com', 50000.00, 'admin')
    `).run(uuidv4());

    console.log('[DB] Seeded demo data');
  }

  // User methods
  getUser(id) {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  getUserByAuthId(authId) {
    return this.db.prepare('SELECT * FROM users WHERE auth_id = ?').get(authId);
  }

  getUserByUsername(username) {
    return this.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  }

  createUser(data) {
    const id = uuidv4();
    this.db.prepare(`
      INSERT INTO users (id, username, email, balance, auth_id)
      VALUES (?, ?, ?, 1000.00, ?)
    `).run(id, data.username, data.email, data.authId);
    return this.getUser(id);
  }

  // Market methods
  getMarket(id) {
    return this.db.prepare('SELECT * FROM markets WHERE id = ?').get(id);
  }

  getMarketsByMatch(matchId) {
    return this.db.prepare('SELECT * FROM markets WHERE match_id = ?').all(matchId);
  }

  updateMarket(id, data) {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = Object.values(data);
    this.db.prepare(`UPDATE markets SET ${fields} WHERE id = ?`).run(...values, id);
  }

  // Selection methods
  getSelection(id) {
    return this.db.prepare('SELECT * FROM selections WHERE id = ?').get(id);
  }

  getSelectionsByMarket(marketId) {
    return this.db.prepare('SELECT * FROM selections WHERE market_id = ?').all(marketId);
  }

  updateSelectionOdds(matchId, odds, event) {
    const markets = this.getMarketsByMatch(matchId);
    for (const market of markets) {
      if (market.type !== 'match_odds') continue;
      const selections = this.getSelectionsByMarket(market.id);
      for (const sel of selections) {
        const teamOdds = sel.name.includes('Draw') ? null : 
          (sel.name === 'Mumbai Indians' || sel.name === 'Royal Challengers Bangalore' || sel.name === 'Delhi Capitals' || sel.name === 'Rajasthan Royals') ? odds.team1 : odds.team2;
        if (teamOdds) {
          this.db.prepare(`
            UPDATE selections SET prev_back_odds = back_odds, prev_lay_odds = lay_odds,
            back_odds = ?, lay_odds = ?, odds_moved = ?,
            updated_at = datetime('now') WHERE id = ?
          `).run(teamOdds.back, teamOdds.lay, teamOdds.back > sel.back_odds ? 'up' : 'down', sel.id);
          
          // Log odds movement
          this.db.prepare(`
            INSERT INTO odds_log (id, selection_id, back_odds, lay_odds, trigger)
            VALUES (?, ?, ?, ?, ?)
          `).run(uuidv4(), sel.id, teamOdds.back, teamOdds.lay, event);
        }
      }
    }
  }

  // Match methods
  getMatch(id) {
    return this.db.prepare('SELECT * FROM matches WHERE id = ?').get(id);
  }

  getAllMatches(status = null) {
    if (status) {
      return this.db.prepare('SELECT * FROM matches WHERE status = ? ORDER BY start_time').all(status);
    }
    return this.db.prepare('SELECT * FROM matches ORDER BY start_time').all();
  }

  getLiveMatches() {
    return this.db.prepare("SELECT * FROM matches WHERE status IN ('live', 'innings_break') ORDER BY start_time").all();
  }

  updateMatch(id, data) {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = Object.values(data);
    this.db.prepare(`UPDATE matches SET ${fields}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
  }

  // Bet methods
  getBet(id) {
    return this.db.prepare('SELECT * FROM bets WHERE id = ?').get(id);
  }

  getBetsByUser(userId, status = null) {
    if (status) {
      return this.db.prepare('SELECT * FROM bets WHERE user_id = ? AND status = ? ORDER BY placed_at DESC').all(userId, status);
    }
    return this.db.prepare('SELECT * FROM bets WHERE user_id = ? ORDER BY placed_at DESC').all(userId);
  }

  getOpenBetsForMarket(marketId) {
    return this.db.prepare('SELECT * FROM bets WHERE market_id = ? AND status = ?').all(marketId, 'open');
  }

  insertBet(data) {
    const id = uuidv4();
    try {
      this.db.prepare(`
        INSERT INTO bets (id, user_id, match_id, market_id, selection_id, selection_name, market_type, bet_type, odds, stake, exposure, potential_profit, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, data.user_id, data.match_id, data.market_id, data.selection_id, data.selection_name, data.market_type, data.bet_type, data.odds, data.stake, data.exposure, data.potential_profit, data.status);
      return this.getBet(id);
    } catch (e) {
      console.error('[DB] Insert bet failed:', e);
      return null;
    }
  }

  updateBet(id, data) {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = Object.values(data);
    this.db.prepare(`UPDATE bets SET ${fields} WHERE id = ?`).run(...values, id);
  }

  // Balance operations
  lockExposure(userId, amount) {
    try {
      const user = this.getUser(userId);
      if (!user) return { success: false, error: 'User not found' };
      
      const available = user.balance - user.exposure;
      if (amount > 0 && available < amount) {
        return { success: false, error: 'Insufficient balance' };
      }
      
      this.db.prepare('UPDATE users SET exposure = exposure + ? WHERE id = ?').run(amount, userId);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  settleUser(userId, exposure, winnings) {
    this.db.prepare('UPDATE users SET exposure = MAX(0, exposure - ?), balance = balance + ? WHERE id = ?').run(exposure, winnings, userId);
  }

  deposit(userId, amount) {
    this.db.prepare('UPDATE users SET balance = balance + ?, total_deposited = total_deposited + ? WHERE id = ?').run(amount, amount, userId);
  }

  withdraw(userId, amount) {
    const user = this.getUser(userId);
    const available = user.balance - user.exposure;
    if (available < amount) {
      return { success: false, error: 'Insufficient available balance' };
    }
    this.db.prepare('UPDATE users SET balance = balance - ?, total_withdrawn = total_withdrawn + ? WHERE id = ?').run(amount, amount, userId);
    return { success: true };
  }

  // Transaction methods
  insertTransaction(data) {
    const id = uuidv4();
    this.db.prepare(`
      INSERT INTO transactions (id, user_id, type, amount, balance_before, balance_after, reference_id, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.user_id, data.type, data.amount, data.balance_before, data.balance_after, data.reference_id, data.note);
    return id;
  }

  getTransactionsByUser(userId, limit = 50) {
    return this.db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit);
  }

  // Suspend markets when score API fails
  async suspendMarkets(matchId) {
    this.db.prepare("UPDATE markets SET status = 'suspended' WHERE match_id = ? AND status = 'open'").run(matchId);
  }

  // Get all users (admin)
  getAllUsers() {
    return this.db.prepare('SELECT id, username, email, balance, exposure, role, is_banned, created_at FROM users').all();
  }

  updateUser(id, data) {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = Object.values(data);
    this.db.prepare(`UPDATE users SET ${fields} WHERE id = ?`).run(...values, id);
  }
}

export const database = new DatabaseManager();