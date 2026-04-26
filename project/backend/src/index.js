// Main server entry point
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { database } from './database.js';
import { bettingEngine } from './bettingEngine.js';
import { oddsEngine } from './oddsEngine.js';
import { CricketPoller } from './cricketPoller.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
database.init();
bettingEngine.setDatabase(database);

// Initialize cricket poller
const poller = new CricketPoller(database, io, oddsEngine);

// Auth middleware for socket
io.use((socket, next) => {
  const userId = socket.handshake.auth?.userId;
  if (!userId) {
    // Allow anonymous connections for viewing
    socket.userId = null;
    return next();
  }
  const user = database.getUser(userId);
  if (!user) {
    return next(new Error('User not found'));
  }
  if (user.is_banned) {
    return next(new Error('User is banned'));
  }
  socket.userId = userId;
  socket.user = user;
  next();
});

// Socket events
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}, userId: ${socket.userId}`);

  // Join match room
  socket.on('join_match', ({ matchId, leagueSlug }) => {
    socket.join(`match:${matchId}`);
    poller.startMatch(matchId, leagueSlug);
    const match = database.getMatch(matchId);
    if (match) {
      const markets = database.getMarketsByMatch(matchId);
      socket.emit('match_data', { match, markets });
    }
  });

  // Leave match room
  socket.on('leave_match', ({ matchId }) => {
    socket.leave(`match:${matchId}`);
    const room = io.sockets.adapter.rooms.get(`match:${matchId}`);
    if (!room || room.size === 0) {
      poller.stopMatch(matchId);
    }
  });

  // Place bet
  socket.on('place_bet', async (data, callback) => {
    if (!socket.userId) {
      return callback({ success: false, error: 'Please login to place bets' });
    }
    const result = await bettingEngine.placeBet({
      userId: socket.userId,
      ...data
    });
    if (result.success) {
      const user = database.getUser(socket.userId);
      socket.emit('balance_update', {
        balance: user.balance,
        exposure: user.exposure,
        available: user.balance - user.exposure
      });
    }
    callback(result);
  });

  // Cashout
  socket.on('cashout', async ({ betId, currentOdds }, callback) => {
    if (!socket.userId) {
      return callback({ success: false, error: 'Please login' });
    }
    const result = await bettingEngine.cashout(betId, socket.userId, currentOdds);
    if (result.success) {
      const user = database.getUser(socket.userId);
      socket.emit('balance_update', {
        balance: user.balance,
        exposure: user.exposure,
        available: user.balance - user.exposure
      });
    }
    callback(result);
  });

  // Admin: settle market
  socket.on('admin_settle', async ({ marketId, winner }, callback) => {
    if (!socket.userId || socket.user?.role !== 'admin') {
      return callback({ success: false, error: 'Forbidden' });
    }
    const result = await bettingEngine.settleMarket(marketId, winner);
    io.emit('market_settled', { marketId, winner });
    callback(result);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// REST API routes
app.get('/api/matches', (req, res) => {
  const { status } = req.query;
  const matches = status === 'live' ? database.getLiveMatches() : database.getAllMatches();
  res.json(matches);
});

app.get('/api/matches/:id', (req, res) => {
  const match = database.getMatch(req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  const markets = database.getMarketsByMatch(req.params.id);
  res.json({ match, markets });
});

app.get('/api/markets/:id/selections', (req, res) => {
  const selections = database.getSelectionsByMarket(req.params.id);
  res.json(selections);
});

app.get('/api/user/:id', (req, res) => {
  const user = database.getUser(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    id: user.id,
    username: user.username,
    balance: user.balance,
    exposure: user.exposure,
    available: user.balance - user.exposure,
    role: user.role
  });
});

app.get('/api/user/:id/bets', (req, res) => {
  const { status } = req.query;
  const bets = database.getBetsByUser(req.params.id, status || null);
  res.json(bets);
});

app.get('/api/user/:id/transactions', (req, res) => {
  const transactions = database.getTransactionsByUser(req.params.id);
  res.json(transactions);
});

app.post('/api/user/:id/deposit', (req, res) => {
  if (String(database.getUser(req.params.id)?.id) !== String(req.params.id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { amount } = req.body;
  if (!amount || amount < 100) {
    return res.status(400).json({ error: 'Minimum deposit is ₹100' });
  }
  database.deposit(req.params.id, amount);
  const user = database.getUser(req.params.id);
  database.insertTransaction({
    user_id: req.params.id,
    type: 'deposit',
    amount,
    balance_before: user.balance - amount,
    balance_after: user.balance,
    note: `Deposit of ₹${amount}`
  });
  res.json({ success: true, balance: user.balance });
});

app.post('/api/user/:id/withdraw', (req, res) => {
  if (String(database.getUser(req.params.id)?.id) !== String(req.params.id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { amount } = req.body;
  if (!amount || amount < 100) {
    return res.status(400).json({ error: 'Minimum withdrawal is ₹100' });
  }
  const result = database.withdraw(req.params.id, amount);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  const user = database.getUser(req.params.id);
  database.insertTransaction({
    user_id: req.params.id,
    type: 'withdraw',
    amount: -amount,
    balance_before: user.balance + amount,
    balance_after: user.balance,
    note: `Withdrawal of ₹${amount}`
  });
  res.json({ success: true, balance: user.balance });
});

// Admin routes
app.get('/api/admin/users', (req, res) => {
  const users = database.getAllUsers();
  res.json(users);
});

app.post('/api/admin/users/:id/ban', (req, res) => {
  database.updateUser(req.params.id, { is_banned: 1 });
  res.json({ success: true });
});

app.post('/api/admin/users/:id/unban', (req, res) => {
  database.updateUser(req.params.id, { is_banned: 0 });
  res.json({ success: true });
});

app.post('/api/admin/settle', (req, res) => {
  const { marketId, winner } = req.body;
  const result = bettingEngine.settleMarket(marketId, winner);
  io.emit('market_settled', { marketId, winner });
  res.json(result);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
  console.log(`[Server] WebSocket ready for connections`);
});