// Main server entry point
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import db from './database.js';
import { bettingEngine } from './bettingEngine.js';
import { oddsEngine } from './oddsEngine.js';
import { CricketPoller } from './cricketPoller.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Set database on betting engine
bettingEngine.setDB(db);

// Cricket poller instance
const poller = new CricketPoller(io, db, oddsEngine);

// Auth middleware (simplified for demo)
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No auth token' });
  }
  req.userId = token; // In production, verify JWT
  next();
};

// Routes
app.get('/api/matches', async (req, res) => {
  const status = req.query.status;
  const matches = await db.getMatches(status);
  res.json(matches);
});

app.get('/api/matches/:id', async (req, res) => {
  const match = await db.getMatch(req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  
  const markets = await db.getMarkets(req.params.id);
  const marketsWithSelections = await Promise.all(
    markets.map(async (m) => {
      const selections = await db.getSelections(m.id);
      return { ...m, selections };
    })
  );
  
  res.json({ ...match, markets: marketsWithSelections });
});

app.get('/api/user/:id', async (req, res) => {
  const user = await db.getUser(req.params.id);
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

app.post('/api/bets', authMiddleware, async (req, res) => {
  const result = await bettingEngine.placeBet({
    userId: req.userId,
    ...req.body
  });
  res.json(result);
});

app.post('/api/cashout', authMiddleware, async (req, res) => {
  const { betId, currentOdds } = req.body;
  const result = await bettingEngine.cashout(betId, req.userId, currentOdds);
  res.json(result);
});

app.get('/api/bets/:userId', async (req, res) => {
  const bets = await db.getUserBets(req.params.userId);
  res.json(bets);
});

app.get('/api/transactions/:userId', async (req, res) => {
  const transactions = await db.getUserTransactions(req.params.userId);
  res.json(transactions);
});

app.post('/api/deposit', authMiddleware, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount < 100) {
    return res.status(400).json({ error: 'Min deposit is ₹100' });
  }
  const user = await db.deposit(req.userId, amount);
  await db.logTransaction({
    user_id: req.userId,
    type: 'deposit',
    amount,
    balance_before: user.balance - amount,
    balance_after: user.balance,
    note: `Deposit of ₹${amount}`
  });
  res.json({ success: true, balance: user.balance });
});

app.post('/api/withdraw', authMiddleware, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount < 100) {
    return res.status(400).json({ error: 'Min withdrawal is ₹100' });
  }
  const result = await db.withdraw(req.userId, amount);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  await db.logTransaction({
    user_id: req.userId,
    type: 'withdraw',
    amount: -amount,
    balance_before: result.user.balance + amount,
    balance_after: result.user.balance,
    note: `Withdrawal of ₹${amount}`
  });
  res.json({ success: true, balance: result.user.balance });
});

// Admin: settle market
app.post('/api/admin/settle', authMiddleware, async (req, res) => {
  const { marketId, winner } = req.body;
  const result = await bettingEngine.settleMarket(marketId, winner);
  io.emit('market_settled', { marketId, winner });
  res.json(result);
});

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_match', async ({ matchId, leagueSlug }) => {
    socket.join(`match:${matchId}`);
    poller.startMatch(matchId, leagueSlug);
    
    // Send current state
    const match = await db.getMatch(matchId);
    if (match) {
      const markets = await db.getMarkets(matchId);
      const marketsWithSelections = await Promise.all(
        markets.map(async (m) => {
          const selections = await db.getSelections(m.id);
          return { ...m, selections };
        })
      );
      socket.emit('match_state', { match, markets: marketsWithSelections });
    }
  });

  socket.on('leave_match', ({ matchId }) => {
    socket.leave(`match:${matchId}`);
  });

  socket.on('place_bet', async (data, callback) => {
    const result = await bettingEngine.placeBet({
      userId: data.userId,
      ...data
    });
    callback(result);
    
    if (result.success) {
      const user = await db.getUser(data.userId);
      socket.emit('balance_update', {
        balance: user.balance,
        exposure: user.exposure,
        available: user.balance - user.exposure
      });
    }
  });

  socket.on('cashout', async ({ betId, userId, currentOdds }, callback) => {
    const result = await bettingEngine.cashout(betId, userId, currentOdds);
    callback(result);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Seed demo data
async function seedDemoData() {
  // Create demo user
  const demoUser = await db.createUser({
    auth_id: 'demo-auth-id',
    username: 'demo_user',
    email: 'demo@betify.com',
    balance: 10000,
    role: 'user'
  });
  
  // Create admin user
  const adminUser = await db.createUser({
    auth_id: 'admin-auth-id',
    username: 'admin',
    email: 'admin@betify.com',
    balance: 50000,
    role: 'admin'
  });

  // Create demo matches
  const matches = [
    {
      id: 'ipl-2024-m1',
      sport: 'cricket',
      league: 'Indian Premier League',
      league_id: 'ipl',
      team1_name: 'Mumbai Indians',
      team2_name: 'Chennai Super Kings',
      team1_short: 'MI',
      team2_short: 'CSK',
      team1_score: '145/3 (15.2 ov)',
      team2_score: '',
      status: 'live',
      start_time: new Date().toISOString()
    },
    {
      id: 'ipl-2024-m2',
      sport: 'cricket',
      league: 'Indian Premier League',
      league_id: 'ipl',
      team1_name: 'Royal Challengers Bangalore',
      team2_name: 'Kolkata Knight Riders',
      team1_short: 'RCB',
      team2_short: 'KKR',
      team1_score: '0/0 (0.0 ov)',
      team2_score: '',
      status: 'upcoming',
      start_time: new Date(Date.now() + 3600000).toISOString()
    },
    {
      id: 'psl-2024-m1',
      sport: 'cricket',
      league: 'Pakistan Super League',
      league_id: 'psl',
      team1_name: 'Islamabad United',
      team2_name: 'Lahore Qalandars',
      team1_short: 'IU',
      team2_short: 'LQ',
      team1_score: '178/6 (20.0 ov)',
      team2_score: '89/2 (10.3 ov)',
      status: 'live',
      start_time: new Date().toISOString()
    }
  ];

  for (const matchData of matches) {
    await db.createMatch(matchData);
    
    // Create match odds market
    const market = await db.createMarket({
      match_id: matchData.id,
      type: 'match_odds',
      name: 'Match Odds'
    });
    
    // Create selections
    await db.createSelection({
      market_id: market.id,
      name: matchData.team1_name,
      back_odds: 1.95,
      lay_odds: 2.00
    });
    
    await db.createSelection({
      market_id: market.id,
      name: matchData.team2_name,
      back_odds: 2.10,
      lay_odds: 2.15
    });
    
    // Create bookmaker market
    const bmMarket = await db.createMarket({
      match_id: matchData.id,
      type: 'bookmaker',
      name: 'Bookmaker'
    });
    
    await db.createSelection({
      market_id: bmMarket.id,
      name: matchData.team1_name,
      back_odds: 1.90,
      lay_odds: 1.90
    });
    
    await db.createSelection({
      market_id: bmMarket.id,
      name: matchData.team2_name,
      back_odds: 2.00,
      lay_odds: 2.00
    });
  }

  console.log('Demo data seeded successfully');
  console.log('Demo user ID:', demoUser.id);
  console.log('Admin user ID:', adminUser.id);
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await seedDemoData();
});