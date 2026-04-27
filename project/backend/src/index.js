// Betify Backend - Node.js + Express + Socket.io
// WebSocket-first architecture, REST for static operations

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { initDatabase, db } from './database.js';
import { processManualScoreEntry } from './cricketWsClient.js';
import { recalculateOdds, getOddsSnapshot } from './oddsEngine.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const JWT_SECRET = process.env.JWT_SECRET || 'betify-secret-key-change-in-production';
const DEFAULT_COMMISSION_RATE = 0.02; // 2%

app.use(cors());
app.use(express.json());

// ============ DATABASE HELPERS ============
const dbHelpers = {
  getMatch: (id) => db.prepare('SELECT * FROM matches WHERE matchId = ?').get(id),
  getAllMatches: () => db.prepare('SELECT * FROM matches ORDER BY startTime DESC').all(),
  getUser: (userId) => db.prepare('SELECT * FROM users WHERE userId = ?').get(userId),
  getAllUsers: () => db.prepare('SELECT userId, balance, createdAt, isAdmin FROM users').all(),
  updateMarketStatus: (matchId, marketType, status) => {
    db.prepare('UPDATE matches SET marketStatus = ? WHERE matchId = ?').run(status, matchId);
  },
  getMarketStatus: (matchId) => {
    const match = db.prepare('SELECT marketStatus FROM matches WHERE matchId = ?').get(matchId);
    return match?.marketStatus || 'open';
  }
};

// ============ AUTH MIDDLEWARE ============
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function adminOnly(req, res, next) {
  if (!req.user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });
  next();
}

// ============ AUTH ROUTES ============
app.post('/api/login', (req, res) => {
  const { userId, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE userId = ?').get(userId);
  
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ userId: user.userId, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, userId: user.userId, isAdmin: user.isAdmin, balance: user.balance });
});

app.post('/api/changePassword', authenticate, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE userId = ?').get(req.user.userId);
  
  if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return res.status(400).json({ error: 'Current password incorrect' });
  }
  
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET passwordHash = ? WHERE userId = ?').run(hash, req.user.userId);
  res.json({ success: true });
});

// ============ MATCH ROUTES (REST for static data) ============
app.get('/api/matches', (req, res) => {
  const matches = dbHelpers.getAllMatches();
  res.json(matches);
});

app.get('/api/match/:id', (req, res) => {
  const match = dbHelpers.getMatch(req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  
  // Include current odds snapshot
  const odds = getOddsSnapshot(req.params.id, dbHelpers);
  res.json({ ...match, odds });
});

// ============ BETTING ROUTES ============
app.post('/api/placeBet', authenticate, (req, res) => {
  const { matchId, marketType, selection, stake } = req.body;
  const userId = req.user.userId;
  
  // Validate stake
  if (!stake || stake <= 0) {
    return res.status(400).json({ error: 'Invalid stake amount' });
  }
  
  // Get user and check balance
  const user = dbHelpers.getUser(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.balance < stake) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  // Get match
  const match = dbHelpers.getMatch(matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  
  // Check suspension for bookmaker/session (NOT match_odds)
  if (marketType !== 'match_odds') {
    const marketStatus = dbHelpers.getMarketStatus(matchId);
    if (marketStatus === 'suspended') {
      return res.status(400).json({ error: 'Market is currently suspended' });
    }
  }
  
  // Get current odds
  const odds = getOddsSnapshot(matchId, dbHelpers);
  let oddsValue;
  
  switch (marketType) {
    case 'match_odds':
      oddsValue = odds.matchOdds[selection];
      break;
    case 'bookmaker':
      oddsValue = selection.includes('back') ? 
        (selection === 'back1' ? odds.bookmakerOdds.back1 : odds.bookmakerOdds.back2) :
        (selection === 'lay1' ? odds.bookmakerOdds.lay1 : odds.bookmakerOdds.lay2);
      break;
    case 'session':
      oddsValue = selection === 'over' ? odds.sessionOdds.over : odds.sessionOdds.under;
      break;
    default:
      return res.status(400).json({ error: 'Invalid market type' });
  }
  
  if (!oddsValue) return res.status(400).json({ error: 'Invalid selection' });
  
  // Commission for match_odds only
  const commissionRate = marketType === 'match_odds' ? DEFAULT_COMMISSION_RATE : 0;
  const grossPayout = stake * oddsValue;
  const commission = grossPayout * commissionRate;
  const netPayout = grossPayout - commission;
  
  // Atomic transaction: deduct balance + create bet + log transaction
  const betId = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const txnId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    db.transaction(() => {
      // Deduct balance
      db.prepare('UPDATE users SET balance = balance - ? WHERE userId = ?').run(stake, userId);
      
      // Create bet
      db.prepare(`
        INSERT INTO bets (betId, userId, matchId, marketType, selection, stake, odds, 
          commissionRate, grossPayout, netPayout, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
      `).run(betId, userId, matchId, marketType, selection, stake, oddsValue, 
             commissionRate, grossPayout, netPayout);
      
      // Log transaction
      const newBalance = user.balance - stake;
      db.prepare(`
        INSERT INTO transactions (txnId, userId, type, amount, balanceBefore, balanceAfter, 
          reference, status, createdAt)
        VALUES (?, ?, 'DEBIT', ?, ?, ?, ?, 'completed', datetime('now'))
      `).run(txnId, userId, stake, user.balance, newBalance, betId);
    })();
    
    // Emit balance update via WebSocket
    io.to(`user:${userId}`).emit('balance:update', {
      userId, newBalance: user.balance - stake, txnId
    });
    
    res.json({
      betId,
      userId,
      matchId,
      marketType,
      selection,
      stake,
      oddsAtPlacement: oddsValue,
      commissionRate,
      estimatedGrossPayout: grossPayout,
      estimatedCommission: commission,
      estimatedNetPayout: netPayout,
      status: 'pending',
      placedAt: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to place bet: ' + e.message });
  }
});

app.get('/api/my-bets', authenticate, (req, res) => {
  const bets = db.prepare(`
    SELECT b.*, m.team1 as team1Name, m.team2 as team2Name 
    FROM bets b 
    JOIN matches m ON b.matchId = m.matchId 
    WHERE b.userId = ? 
    ORDER BY b.createdAt DESC
  `).all(req.user.userId);
  res.json(bets);
});

app.get('/api/transactions', authenticate, (req, res) => {
  const txns = db.prepare(`
    SELECT * FROM transactions WHERE userId = ? ORDER BY createdAt DESC LIMIT 50
  `).all(req.user.userId);
  res.json(txns);
});

// ============ WALLET ROUTES ============
app.post('/api/deposit', authenticate, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  
  const user = dbHelpers.getUser(req.user.userId);
  const txnId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    db.transaction(() => {
      db.prepare('UPDATE users SET balance = balance + ? WHERE userId = ?').run(amount, req.user.userId);
      db.prepare(`
        INSERT INTO transactions (txnId, userId, type, amount, balanceBefore, balanceAfter, 
          reference, status, createdAt)
        VALUES (?, ?, 'CREDIT', ?, ?, ?, ?, 'completed', datetime('now'))
      `).run(txnId, req.user.userId, amount, user.balance, user.balance + amount, 'deposit');
    })();
    
    const newBalance = user.balance + amount;
    io.to(`user:${req.user.userId}`).emit('balance:update', { userId: req.user.userId, newBalance, txnId });
    
    res.json({ success: true, txnId, newBalance });
  } catch (e) {
    res.status(500).json({ error: 'Deposit failed: ' + e.message });
  }
});

app.post('/api/withdraw', authenticate, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  
  const user = dbHelpers.getUser(req.user.userId);
  if (user.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  const txnId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    db.transaction(() => {
      db.prepare('UPDATE users SET balance = balance - ? WHERE userId = ?').run(amount, req.user.userId);
      db.prepare(`
        INSERT INTO transactions (txnId, userId, type, amount, balanceBefore, balanceAfter, 
          reference, status, createdAt)
        VALUES (?, ?, 'DEBIT', ?, ?, ?, ?, 'completed', datetime('now'))
      `).run(txnId, req.user.userId, amount, user.balance, user.balance - amount, 'withdrawal');
    })();
    
    const newBalance = user.balance - amount;
    io.to(`user:${req.user.userId}`).emit('balance:update', { userId: req.user.userId, newBalance, txnId });
    
    res.json({ success: true, txnId, newBalance });
  } catch (e) {
    res.status(500).json({ error: 'Withdrawal failed: ' + e.message });
  }
});

// ============ ADMIN ROUTES ============
app.post('/api/admin/createUser', adminOnly, (req, res) => {
  const { userId, password, initialBalance = 0 } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ error: 'userId and password required' });
  }
  
  const existing = db.prepare('SELECT * FROM users WHERE userId = ?').get(userId);
  if (existing) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (userId, passwordHash, balance, isAdmin, createdAt) VALUES (?, ?, ?, 0, datetime(\'now\'))')
    .run(userId, hash, initialBalance);
  
  res.json({ success: true, userId });
});

app.delete('/api/admin/user/:userId', adminOnly, (req, res) => {
  if (req.params.userId === req.user.userId) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }
  db.prepare('DELETE FROM users WHERE userId = ?').run(req.params.userId);
  res.json({ success: true });
});

app.post('/api/admin/resetPassword', adminOnly, (req, res) => {
  const { userId, newPassword } = req.body;
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET passwordHash = ? WHERE userId = ?').run(hash, userId);
  res.json({ success: true });
});

app.get('/api/admin/users', adminOnly, (req, res) => {
  res.json(dbHelpers.getAllUsers());
});

app.get('/api/admin/stats', adminOnly, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalBets = db.prepare('SELECT COUNT(*) as count FROM bets').get().count;
  const totalVolume = db.prepare('SELECT SUM(stake) as total FROM bets').get().total || 0;
  const pendingBets = db.prepare('SELECT COUNT(*) as count FROM bets WHERE status = \'pending\'').get().count;
  
  res.json({ totalUsers, totalBets, totalVolume, pendingBets });
});

// Admin manual score entry (fallback when no WebSocket feed)
app.post('/api/admin/manualScore', adminOnly, (req, res) => {
  const { matchId, over, ball, runs, isWicket, isWide, isNoBall, ballState } = req.body;
  
  processManualScoreEntry(matchId, { over, ball, runs, isWicket, isWide, isNoBall, ballState });
  
  res.json({ success: true });
});

// Admin market control
app.post('/api/admin/suspendMarket', adminOnly, (req, res) => {
  const { matchId, marketType } = req.body;
  dbHelpers.updateMarketStatus(matchId, marketType, 'suspended');
  io.to(`match:${matchId}`).emit('market:status', { matchId, marketType, status: 'suspended' });
  res.json({ success: true });
});

app.post('/api/admin/resumeMarket', adminOnly, (req, res) => {
  const { matchId, marketType } = req.body;
  dbHelpers.updateMarketStatus(matchId, marketType, 'open');
  io.to(`match:${matchId}`).emit('market:status', { matchId, marketType, status: 'open' });
  res.json({ success: true });
});

// ============ WEBSOCKET HANDLERS ============
io.on('connection', (socket) => {
  console.log('[WS] Client connected:', socket.id);
  
  // Authenticate socket connection
  socket.on('authenticate', (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;
      socket.isAdmin = decoded.isAdmin;
      socket.join(`user:${decoded.userId}`);
      socket.emit('authenticated', { userId: decoded.userId });
    } catch (e) {
      socket.emit('auth_error', { error: 'Invalid token' });
    }
  });
  
  // Subscribe to match updates
  socket.on('subscribe:match', (matchId) => {
    socket.join(`match:${matchId}`);
    // Send current odds snapshot
    const odds = getOddsSnapshot(matchId, dbHelpers);
    socket.emit('odds:update', { matchId, oddsData: odds, timestamp: new Date().toISOString() });
    
    // Send current market status
    const match = dbHelpers.getMatch(matchId);
    if (match) {
      socket.emit('market:status', { matchId, marketType: 'bookmaker', status: match.marketStatus || 'open' });
      socket.emit('market:status', { matchId, marketType: 'session', status: match.marketStatus || 'open' });
    }
  });
  
  socket.on('unsubscribe:match', (matchId) => {
    socket.leave(`match:${matchId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('[WS] Client disconnected:', socket.id);
  });
});

// ============ BET SETTLEMENT ============
export function settleBet(betId, result) {
  const bet = db.prepare('SELECT * FROM bets WHERE betId = ?').get(betId);
  if (!bet || bet.status !== 'pending') return;
  
  const user = dbHelpers.getUser(bet.userId);
  if (!user) return;
  
  const txnId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  let netPayout = 0;
  let commissionDeducted = 0;
  
  if (result === 'won') {
    netPayout = bet.netPayout;
    commissionDeducted = bet.grossPayout - bet.netPayout;
    
    db.transaction(() => {
      db.prepare('UPDATE users SET balance = balance + ? WHERE userId = ?').run(netPayout, bet.userId);
      db.prepare('UPDATE bets SET status = \'won\', settledAt = datetime(\'now\') WHERE betId = ?').run(betId);
      db.prepare(`
        INSERT INTO transactions (txnId, userId, type, amount, balanceBefore, balanceAfter, 
          reference, status, createdAt)
        VALUES (?, ?, 'CREDIT', ?, ?, ?, ?, 'completed', datetime('now'))
      `).run(txnId, bet.userId, netPayout, user.balance, user.balance + netPayout, betId);
    })();
    
    io.to(`user:${bet.userId}`).emit('balance:update', {
      userId: bet.userId, newBalance: user.balance + netPayout, txnId
    });
  } else if (result === 'lost') {
    db.prepare('UPDATE bets SET status = \'lost\', settledAt = datetime(\'now\') WHERE betId = ?').run(betId);
  } else if (result === 'void') {
    // Refund stake
    netPayout = bet.stake;
    db.transaction(() => {
      db.prepare('UPDATE users SET balance = balance + ? WHERE userId = ?').run(bet.stake, bet.userId);
      db.prepare('UPDATE bets SET status = \'void\', settledAt = datetime(\'now\') WHERE betId = ?').run(betId);
      db.prepare(`
        INSERT INTO transactions (txnId, userId, type, amount, balanceBefore, balanceAfter, 
          reference, status, createdAt)
        VALUES (?, ?, 'CREDIT', ?, ?, ?, ?, 'completed', datetime(\'now\'))
      `).run(txnId, bet.userId, bet.stake, user.balance, user.balance + bet.stake, betId);
    })();
    
    io.to(`user:${bet.userId}`).emit('balance:update', {
      userId: bet.userId, newBalance: user.balance + bet.stake, txnId
    });
  }
  
  // Emit bet result
  io.to(`user:${bet.userId}`).emit('bet:result', { betId, userId: bet.userId, result, netPayout, commissionDeducted });
}

// ============ START SERVER ============
const PORT = process.env.PORT || 3001;

initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`[Betify] Server running on port ${PORT}`);
    console.log(`[Betify] WebSocket ready for connections`);
  });
}).catch(e => {
  console.error('[Betify] Database init failed:', e);
  process.exit(1);
});

export { io, dbHelpers };