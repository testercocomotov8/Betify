// Database setup - SQLite with better-sqlite3
// NO POLLING - all data comes via WebSocket

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../../data');
const dbPath = join(dataDir, 'betify.db');

let _db;

export function getDb() {
  if (!_db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return _db;
}

export const db = {
  get prepare() {
    return getDb().prepare.bind(getDb());
  },
  get transaction() {
    return getDb().transaction.bind(getDb());
  },
  exec(sql) {
    return getDb().exec(sql);
  }
};

export async function initDatabase() {
  // Ensure data directory exists (synchronous)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  _db = new Database(dbPath);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  // Create tables
  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      userId TEXT PRIMARY KEY,
      passwordHash TEXT NOT NULL,
      balance REAL DEFAULT 0,
      isAdmin INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS matches (
      matchId TEXT PRIMARY KEY,
      team1 TEXT NOT NULL,
      team2 TEXT NOT NULL,
      venue TEXT,
      startTime TEXT,
      status TEXT DEFAULT 'upcoming',
      runs INTEGER DEFAULT 0,
      wickets INTEGER DEFAULT 0,
      overs REAL DEFAULT 0,
      innings INTEGER DEFAULT 1,
      target INTEGER,
      totalOvers INTEGER DEFAULT 20,
      marketStatus TEXT DEFAULT 'open',
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bets (
      betId TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      matchId TEXT NOT NULL,
      marketType TEXT NOT NULL,
      selection TEXT NOT NULL,
      stake REAL NOT NULL,
      odds REAL NOT NULL,
      commissionRate REAL DEFAULT 0,
      grossPayout REAL NOT NULL,
      netPayout REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      createdAt TEXT DEFAULT (datetime('now')),
      settledAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(userId),
      FOREIGN KEY (matchId) REFERENCES matches(matchId)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      txnId TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      balanceBefore REAL NOT NULL,
      balanceAfter REAL NOT NULL,
      reference TEXT,
      status TEXT DEFAULT 'completed',
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(userId)
    );

    CREATE TABLE IF NOT EXISTS ball_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matchId TEXT NOT NULL,
      over INTEGER NOT NULL,
      ball INTEGER NOT NULL,
      runs INTEGER DEFAULT 0,
      isWicket INTEGER DEFAULT 0,
      isWide INTEGER DEFAULT 0,
      isNoBall INTEGER DEFAULT 0,
      ballState TEXT DEFAULT 'dead',
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (matchId) REFERENCES matches(matchId)
    );
  `);

  // Create default admin if not exists
  const adminExists = _db.prepare('SELECT * FROM users WHERE userId = ?').get('admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    _db.prepare('INSERT INTO users (userId, passwordHash, balance, isAdmin) VALUES (?, ?, ?, 1)')
      .run('admin', hash, 10000);
  }

  // Create sample matches if none exist
  const matchCount = _db.prepare('SELECT COUNT(*) as count FROM matches').get().count;
  if (matchCount === 0) {
    const sampleMatches = [
      { matchId: 'match_001', team1: 'India', team2: 'Australia', venue: 'Wankhede Stadium', status: 'live' },
      { matchId: 'match_002', team1: 'England', team2: 'South Africa', venue: 'Lord\'s', status: 'upcoming' },
      { matchId: 'match_003', team1: 'Pakistan', team2: 'New Zealand', venue: 'Eden Gardens', status: 'upcoming' }
    ];

    const insertMatch = _db.prepare(`
      INSERT INTO matches (matchId, team1, team2, venue, status, startTime, runs, wickets, overs)
      VALUES (?, ?, ?, ?, ?, datetime('now', '+1 hour'), 0, 0, 0)
    `);

    for (const m of sampleMatches) {
      insertMatch.run(m.matchId, m.team1, m.team2, m.venue, m.status);
    }
  }

  console.log('[DB] Database initialized');
  return _db;
}

export default _db;
