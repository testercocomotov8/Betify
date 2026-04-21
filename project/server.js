require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Pool } = require('pg');
const redis = require('redis');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'betify',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Redis client
let redisClient;
let redisSubscriber;

async function initRedis() {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    redisSubscriber = redisClient.duplicate();
    
    await redisClient.connect();
    await redisSubscriber.connect();
    
    console.log('Redis connected');
  } catch (error) {
    console.log('Redis connection failed, using in-memory fallback');
    redisClient = null;
    redisSubscriber = null;
  }
}

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests' }
});
app.use('/api/', limiter);

// JWT Authentication
const JWT_SECRET = process.env.JWT_SECRET || 'betify-secret-key-change-in-production';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// In-memory cache fallback
const memoryCache = new Map();
const CACHE_TTL = 30000;

function cacheSet(key, value, ttl = CACHE_TTL) {
  if (redisClient) {
    redisClient.setEx(key, ttl / 1000, JSON.stringify(value));
  } else {
    memoryCache.set(key, { value, expiry: Date.now() + ttl });
  }
}

function cacheGet(key) {
  if (redisClient) {
    return redisClient.get(key).then(v => v ? JSON.parse(v) : null);
  } else {
    const item = memoryCache.get(key);
    if (!item) return Promise.resolve(null);
    if (Date.now() > item.expiry) {
      memoryCache.delete(key);
      return Promise.resolve(null);
    }
    return Promise.resolve(item.value);
  }
}

// ==================== AGENT SYSTEM ====================

class Agent {
  constructor(name) {
    this.name = name;
    this.isEnabled = true;
    this.status = 'idle';
    this.lastRun = null;
    this.errorCount = 0;
    this.lastError = null;
    this.interval = null;
  }
  
  async run() {
    if (!this.isEnabled) return;
    this.status = 'running';
    try {
      await this.execute();
      this.status = 'idle';
      this.lastRun = new Date();
      this.errorCount = 0;
    } catch (error) {
      this.status = 'error';
      this.errorCount++;
      this.lastError = error.message;
      console.error(`${this.name} error:`, error.message);
    }
  }
  
  async execute() {}
  
  start(intervalMs = 5000) {
    this.interval = setInterval(() => this.run(), intervalMs);
    this.run();
  }
  
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
  
  enable() { this.isEnabled = true; }
  disable() { this.isEnabled = false; }
}

// DataFetchAgent - Fetches cricket and tennis data
class DataFetchAgent extends Agent {
  constructor() {
    super('DataFetchAgent');
  }
  
  async execute() {
    // Simulate fetching live match data
    const cricketMatches = await this.fetchCricketData();
    const tennisMatches = await this.fetchTennisData();
    
    const data = { cricket: cricketMatches, tennis: tennisMatches, timestamp: Date.now() };
    cacheSet('match_data', data);
    
    if (redisClient) {
      await redisClient.publish('match_updates', JSON.stringify(data));
    }
  }
  
  async fetchCricketData() {
    // Simulated cricket data - in production, integrate with real APIs
    return [
      {
        id: uuidv4(),
        sport: 'cricket',
        teamA: 'India',
        teamB: 'Australia',
        status: 'live',
        scoreA: 245,
        scoreB: 178,
        overs: 32.4,
        runs: 245,
        wickets: 4,
        batting: 'India'
      },
      {
        id: uuidv4(),
        sport: 'cricket',
        teamA: 'England',
        teamB: 'South Africa',
        status: 'upcoming',
        startTime: new Date(Date.now() + 3600000).toISOString()
      }
    ];
  }
  
  async fetchTennisData() {
    // Simulated tennis data
    return [
      {
        id: uuidv4(),
        sport: 'tennis',
        playerA: 'Djokovic',
        playerB: 'Alcaraz',
        status: 'live',
        setsA: 2,
        setsB: 1,
        gamesA: 5,
        gamesB: 3,
        currentGame: 'A'
      },
      {
        id: uuidv4(),
        sport: 'tennis',
        playerA: 'Federer',
        playerB: 'Nadal',
        status: 'upcoming',
        startTime: new Date(Date.now() + 7200000).toISOString()
      }
    ];
  }
}

// OddsAgent - Manages betting odds
class OddsAgent extends Agent {
  constructor() {
    super('OddsAgent');
  }
  
  async execute() {
    const odds = await this.generateOdds();
    cacheSet('odds_data', odds);
    
    if (redisClient) {
      await redisClient.publish('odds_updates', JSON.stringify(odds));
    }
  }
  
  async generateOdds() {
    // Generate simulated odds
    return {
      cricket: [
        { matchId: '1', market: 'match_winner', selections: [
          { name: 'India', odds: 1.85 },
          { name: 'Australia', odds: 2.10 }
        ]},
        { matchId: '2', market: 'match_winner', selections: [
          { name: 'England', odds: 1.95 },
          { name: 'South Africa', odds: 1.95 }
        ]}
      ],
      tennis: [
        { matchId: '1', market: 'match_winner', selections: [
          { name: 'Djokovic', odds: 1.70 },
          { name: 'Alcaraz', odds: 2.30 }
        ]},
        { matchId: '2', market: 'match_winner', selections: [
          { name: 'Federer', odds: 2.00 },
          { name: 'Nadal', odds: 1.90 }
        ]}
      ],
      timestamp: Date.now()
    };
  }
}

// NormalizationAgent - Normalizes data from different sources
class NormalizationAgent extends Agent {
  constructor() {
    super('NormalizationAgent');
  }
  
  async execute() {
    const matchData = await cacheGet('match_data');
    const oddsData = await cacheGet('odds_data');
    
    if (!matchData || !oddsData) return;
    
    const normalized = this.normalize(matchData, oddsData);
    cacheSet('normalized_data', normalized);
    
    if (redisClient) {
      await redisClient.publish('normalized_updates', JSON.stringify(normalized));
    }
  }
  
  normalize(matches, odds) {
    return {
      matches: [...matches.cricket, ...matches.tennis].map(m => ({
        ...m,
        displayName: m.teamA && m.teamB ? `${m.teamA} vs ${m.teamB}` : `${m.playerA} vs ${m.playerB}`,
        sportType: m.sport
      })),
      odds: [...odds.cricket, ...odds.tennis],
      timestamp: Date.now()
    };
  }
}

// BroadcastAgent - Broadcasts data to WebSocket clients
class BroadcastAgent extends Agent {
  constructor() {
    super('BroadcastAgent');
  }
  
  async execute() {
    const data = await cacheGet('normalized_data');
    if (!data) return;
    
    this.broadcast(data);
  }
  
  broadcast(data) {
    const message = JSON.stringify({ type: 'update', data });
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

// CacheAgent - Manages cache lifecycle
class CacheAgent extends Agent {
  constructor() {
    super('CacheAgent');
  }
  
  async execute() {
    // Clean expired cache entries
    const now = Date.now();
    for (const [key, value] of memoryCache.entries()) {
      if (now > value.expiry) {
        memoryCache.delete(key);
      }
    }
    
    // Update cache stats
    cacheSet('cache_stats', {
      size: memoryCache.size,
      timestamp: now
    });
  }
}

// FallbackAgent - Handles API failures
class FallbackAgent extends Agent {
  constructor() {
    super('FallbackAgent');
  }
  
  async execute() {
    // Generate fallback data when APIs fail
    const fallbackData = this.generateFallbackData();
    cacheSet('fallback_data', fallbackData);
  }
  
  generateFallbackData() {
    return {
      cricket: {
        runs: Math.floor(Math.random() * 300) + 150,
        wickets: Math.floor(Math.random() * 10),
        overs: (Math.random() * 50).toFixed(1),
        lastWicket: 'Batsman caught at boundary'
      },
      tennis: {
        server: Math.random() > 0.5 ? 'Player A' : 'Player B',
        point: Math.floor(Math.random() * 40),
        gameScore: `${Math.floor(Math.random() * 6)}-${Math.floor(Math.random() * 6)}`
      },
      timestamp: Date.now()
    };
  }
}

// BetEngineAgent - Processes bets
class BetEngineAgent extends Agent {
  constructor() {
    super('BetEngineAgent');
  }
  
  async execute() {
    // Process pending bets
    const pendingBets = await this.getPendingBets();
    for (const bet of pendingBets) {
      await this.processBet(bet);
    }
  }
  
  async getPendingBets() {
    try {
      const result = await pool.query(`
        SELECT b.*, m.status as match_status, m.score_a, m.score_b
        FROM bets b
        JOIN matches m ON b.match_id = m.id
        WHERE b.status = 'pending' AND m.status = 'completed'
        LIMIT 100
      `);
      return result.rows;
    } catch (error) {
      return [];
    }
  }
  
  async processBet(bet) {
    // Determine if bet won or lost
    const won = Math.random() > 0.5; // Simplified logic
    
    await pool.query(`
      UPDATE bets SET status = $1, settled_at = CURRENT_TIMESTAMP WHERE id = $2
    `, [won ? 'won' : 'lost', bet.id]);
    
    if (won) {
      await pool.query(`
        UPDATE users SET balance = balance + $1 WHERE id = $2
      `, [bet.potential_win, bet.user_id]);
      
      await this.createLedgerEntry(bet.user_id, 'bet_win', bet.potential_win, 'Bet won');
    }
  }
  
  async createLedgerEntry(userId, type, amount, description) {
    const user = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
    if (user.rows.length === 0) return;
    
    await pool.query(`
      INSERT INTO ledger (user_id, transaction_type, amount, balance_before, balance_after, description)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId, type, amount, user.rows[0].balance, user.rows[0].balance + amount, description]);
  }
}

// AdminAgent - Handles admin operations
class AdminAgent extends Agent {
  constructor() {
    super('AdminAgent');
  }
  
  async execute() {
    // Monitor system health
    const health = await this.checkHealth();
    cacheSet('system_health', health);
  }
  
  async checkHealth() {
    try {
      await pool.query('SELECT 1');
      const dbStatus = 'connected';
    } catch {
      const dbStatus = 'disconnected';
    }
    
    return {
      database: dbStatus || 'unknown',
      redis: redisClient ? 'connected' : 'disconnected',
      websocket: wss.clients.size,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: Date.now()
    };
  }
}

// SecurityAgent - Monitors security
class SecurityAgent extends Agent {
  constructor() {
    super('SecurityAgent');
  }
  
  async execute() {
    // Log security events
    const events = await this.getRecentEvents();
    cacheSet('security_events', events);
  }
  
  async getRecentEvents() {
    try {
      const result = await pool.query(`
        SELECT * FROM security_logs 
        ORDER BY created_at DESC LIMIT 100
      `);
      return result.rows;
    } catch {
      return [];
    }
  }
  
  async logSecurityEvent(eventType, severity, userId, details, ipAddress) {
    try {
      await pool.query(`
        INSERT INTO security_logs (event_type, severity, user_id, details, ip_address)
        VALUES ($1, $2, $3, $4, $5)
      `, [eventType, severity, userId, JSON.stringify(details), ipAddress]);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}

// Initialize agents
const agents = {
  dataFetch: new DataFetchAgent(),
  odds: new OddsAgent(),
  normalization: new NormalizationAgent(),
  broadcast: new BroadcastAgent(),
  cache: new CacheAgent(),
  fallback: new FallbackAgent(),
  betEngine: new BetEngineAgent(),
  admin: new AdminAgent(),
  security: new SecurityAgent()
};

// Start all agents
function startAgents() {
  agents.dataFetch.start(10000);
  agents.odds.start(15000);
  agents.normalization.start(12000);
  agents.broadcast.start(5000);
  agents.cache.start(30000);
  agents.fallback.start(60000);
  agents.betEngine.start(30000);
  agents.admin.start(10000);
  agents.security.start(45000);
  
  console.log('All agents started');
}

// ==================== WEBSOCKET HANDLING ====================

wss.on('connection', (ws, req) => {
  console.log('Client connected');
  
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      await handleWebSocketMessage(ws, data);
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
  
  // Send initial data
  const sendInitialData = async () => {
    const matches = await cacheGet('match_data');
    const odds = await cacheGet('odds_data');
    const health = await cacheGet('system_health');
    
    ws.send(JSON.stringify({
      type: 'initial',
      data: { matches, odds, health }
    }));
  };
  
  sendInitialData();
});

// Heartbeat to detect dead connections
setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

async function handleWebSocketMessage(ws, data) {
  switch (data.type) {
    case 'subscribe':
      ws.subscriptions = data.channels || [];
      ws.send(JSON.stringify({ type: 'subscribed', channels: ws.subscriptions }));
      break;
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    default:
      ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
  }
}

// ==================== API ROUTES ====================

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, balance: user.balance } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(`
      INSERT INTO users (username, email, password_hash, balance)
      VALUES ($1, $2, $3, 1000.00)
      RETURNING id, username, email, role, balance
    `, [username, email, hashedPassword]);
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Match routes
app.get('/api/matches', async (req, res) => {
  try {
    const { sport } = req.query;
    let query = 'SELECT * FROM matches';
    const params = [];
    
    if (sport) {
      query += ' WHERE sport = $1';
      params.push(sport);
    }
    
    query += ' ORDER BY start_time DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

app.get('/api/matches/live', async (req, res) => {
  try {
    const data = await cacheGet('match_data');
    res.json(data || { cricket: [], tennis: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch live matches' });
  }
});

// Odds routes
app.get('/api/odds', async (req, res) => {
  try {
    const { matchId } = req.query;
    let query = 'SELECT * FROM odds WHERE is_active = true';
    const params = [];
    
    if (matchId) {
      query += ' AND match_id = $1';
      params.push(matchId);
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch odds' });
  }
});

app.get('/api/odds/live', async (req, res) => {
  try {
    const data = await cacheGet('odds_data');
    res.json(data || { cricket: [], tennis: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch live odds' });
  }
});

// Bet routes
app.post('/api/bets', authenticateToken, async (req, res) => {
  try {
    const { matchId, oddsId, selection, stake } = req.body;
    const userId = req.user.id;
    
    // Get user balance
    const userResult = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const balance = parseFloat(userResult.rows[0].balance);
    const stakeAmount = parseFloat(stake);
    
    if (balance < stakeAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Get odds
    const oddsResult = await pool.query('SELECT * FROM odds WHERE id = $1', [oddsId]);
    if (oddsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Odds not found' });
    }
    
    const odds = oddsResult.rows[0];
    const potentialWin = stakeAmount * parseFloat(odds.odds_value);
    
    // Create bet
    const betResult = await pool.query(`
      INSERT INTO bets (user_id, match_id, odds_id, selection, stake, potential_win)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [userId, matchId, oddsId, selection, stakeAmount, potentialWin]);
    
    // Deduct balance
    await pool.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [stakeAmount, userId]);
    
    // Create ledger entry
    await pool.query(`
      INSERT INTO ledger (user_id, transaction_type, amount, balance_before, balance_after, description)
      VALUES ($1, 'bet_placed', $2, $3, $4, $5)
    `, [userId, stakeAmount, balance, balance - stakeAmount, `Bet on ${selection}`]);
    
    res.json(betResult.rows[0]);
  } catch (error) {
    console.error('Bet error:', error);
    res.status(500).json({ error: 'Failed to place bet' });
  }
});

app.get('/api/bets', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, m.team_a, m.team_b, m.status as match_status
      FROM bets b
      JOIN matches m ON b.match_id = m.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bets' });
  }
});

// Wallet routes
app.get('/api/wallet', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, username, email, balance FROM users WHERE id = $1',
      [req.user.id]
    );
    
    const transactionsResult = await pool.query(`
      SELECT * FROM ledger WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50
    `, [req.user.id]);
    
    res.json({
      user: userResult.rows[0],
      transactions: transactionsResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});

app.post('/api/wallet/deposit', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;
    
    const userResult = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
    const balance = parseFloat(userResult.rows[0].balance);
    const newBalance = balance + parseFloat(amount);
    
    await pool.query('UPDATE users SET balance = $1 WHERE id = $2', [newBalance, userId]);
    
    await pool.query(`
      INSERT INTO ledger (user_id, transaction_type, amount, balance_before, balance_after, description)
      VALUES ($1, 'deposit', $2, $3, $4, 'Wallet deposit')
    `, [userId, amount, balance, newBalance]);
    
    res.json({ success: true, balance: newBalance });
  } catch (error) {
    res.status(500).json({ error: 'Deposit failed' });
  }
});

app.post('/api/wallet/withdraw', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;
    
    const userResult = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
    const balance = parseFloat(userResult.rows[0].balance);
    
    if (balance < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    const newBalance = balance - parseFloat(amount);
    
    await pool.query('UPDATE users SET balance = $1 WHERE id = $2', [newBalance, userId]);
    
    await pool.query(`
      INSERT INTO ledger (user_id, transaction_type, amount, balance_before, balance_after, description)
      VALUES ($1, 'withdrawal', $2, $3, $4, 'Wallet withdrawal')
    `, [userId, amount, balance, newBalance]);
    
    res.json({ success: true, balance: newBalance });
  } catch (error) {
    res.status(500).json({ error: 'Withdrawal failed' });
  }
});

// Admin routes
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    let query = 'SELECT id, username, email, role, balance, is_active, created_at FROM users';
    const params = [];
    
    if (search) {
      query += ' WHERE username ILIKE $1 OR email ILIKE $1';
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    
    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, role = 'user', initialBalance = 0 } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(`
      INSERT INTO users (username, email, password_hash, role, balance)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, role, balance
    `, [username, email, hashedPassword, role, initialBalance]);
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.post('/api/admin/users/:id/balance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { action, amount } = req.body;
    const userId = req.params.id;
    
    const userResult = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const balance = parseFloat(userResult.rows[0].balance);
    let newBalance;
    
    if (action === 'add') {
      newBalance = balance + parseFloat(amount);
    } else if (action === 'remove') {
      newBalance = balance - parseFloat(amount);
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    await pool.query('UPDATE users SET balance = $1 WHERE id = $2', [newBalance, userId]);
    
    await pool.query(`
      INSERT INTO ledger (user_id, transaction_type, amount, balance_before, balance_after, description)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId, action === 'add' ? 'admin_deposit' : 'admin_withdrawal', amount, balance, newBalance, `Admin ${action}`]);
    
    res.json({ success: true, newBalance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update balance' });
  }
});

// Agent management
app.get('/api/admin/agents', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM agent_status ORDER BY agent_name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

app.post('/api/admin/agents/:name/toggle', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const agentName = req.params.name;
    const agent = agents[agentName.toLowerCase()];
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    if (agent.isEnabled) {
      agent.disable();
    } else {
      agent.enable();
    }
    
    await pool.query(
      'UPDATE agent_status SET is_enabled = $1, updated_at = CURRENT_TIMESTAMP WHERE agent_name = $2',
      [agent.isEnabled, agentName]
    );
    
    res.json({ success: true, isEnabled: agent.isEnabled });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle agent' });
  }
});

app.post('/api/admin/agents/:name/restart', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const agentName = req.params.name;
    const agent = agents[agentName.toLowerCase()];
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    agent.stop();
    agent.run();
    agent.start();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restart agent' });
  }
});

// System health
app.get('/api/admin/health', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const health = await cacheGet('system_health');
    res.json(health || { status: 'unknown' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch health' });
  }
});

// Audit log
app.get('/api/admin/audit', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await pool.query(`
      SELECT a.*, u.username 
      FROM audit_log a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// Security logs
app.get('/api/admin/security', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const events = await cacheGet('security_events');
    res.json(events || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch security logs' });
  }
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3001;

async function start() {
  await initRedis();
  startAgents();
  
  server.listen(PORT, () => {
    console.log(`Betify server running on port ${PORT}`);
    console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
  });
}

start().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down agents...');
  Object.values(agents).forEach(agent => agent.stop());
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});