// Cricket WebSocket Client - NO POLLING
// Receives cricket score events from external feed OR admin manual entry
// Broadcasts to all connected clients via Socket.io

let io = null;
let dbHelpers = null;
let cricketWs = null;

// Initialize external cricket WebSocket feed connection
export function init(socketIo, helpers) {
  io = socketIo;
  dbHelpers = helpers;

  const CRICKET_WS_URL = process.env.CRICKET_WS_URL;
  
  if (!CRICKET_WS_URL) {
    console.log('[CricketWS] No external feed configured. Using manual entry mode.');
    return;
  }

  console.log('[CricketWS] Connecting to external feed:', CRICKET_WS_URL);
  
  try {
    cricketWs = new WebSocket(CRICKET_WS_URL);
    
    cricketWs.on('open', () => {
      console.log('[CricketWS] Connected to external feed');
    });

    cricketWs.on('message', (data) => {
      try {
        const event = JSON.parse(data);
        processCricketEvent(event);
      } catch (e) {
        console.error('[CricketWS] Parse error:', e);
      }
    });

    cricketWs.on('error', (err) => {
      console.error('[CricketWS] Connection error:', err.message);
    });

    cricketWs.on('close', () => {
      console.log('[CricketWS] Disconnected from external feed');
      // Attempt reconnect after 5 seconds
      setTimeout(() => {
        if (process.env.CRICKET_WS_URL) init(io, dbHelpers);
      }, 5000);
    });
  } catch (e) {
    console.error('[CricketWS] Failed to connect:', e.message);
  }
}

// Process cricket event from external feed or manual entry
export function processManualScoreEntry(matchId, ballData) {
  processCricketEvent({
    type: 'ball:event',
    matchId,
    ...ballData
  });
}

function processCricketEvent(event) {
  const { type, matchId } = event;
  
  if (!matchId) return;

  switch (type) {
    case 'ball:event':
      handleBallEvent(event);
      break;
    case 'score:update':
      handleScoreUpdate(event);
      break;
    case 'match:end':
      handleMatchEnd(event);
      break;
    default:
      console.log('[CricketWS] Unknown event type:', type);
  }
}

function handleBallEvent(event) {
  const { matchId, over, ball, runs, isWicket, isWide, isNoBall, ballState } = event;
  
  // Emit ball event to all match subscribers
  io.to(`match:${matchId}`).emit('ball:event', {
    matchId,
    ballNumber: over * 6 + ball,
    over,
    runsScored: runs || 0,
    isWicket: isWicket || false,
    isWide: isWide || false,
    isNoBall: isNoBall || false,
    ballState: ballState || 'dead'
  });

  // Handle market suspension based on ball state
  if (ballState === 'in_play') {
    // SUSPEND bookmaker and session markets
    suspendMarkets(matchId, ['bookmaker', 'session']);
  } else if (ballState === 'dead') {
    // RESUME bookmaker and session markets, recalculate odds
    resumeMarkets(matchId, ['bookmaker', 'session']);
    recalculateAndBroadcast(matchId, event);
  }
}

function handleScoreUpdate(event) {
  const { matchId, runs, wickets, overs, innings } = event;
  
  // Update database
  if (dbHelpers?.getMatch) {
    const match = dbHelpers.getMatch(matchId);
    if (match) {
      // Update match score
      db.prepare('UPDATE matches SET runs = ?, wickets = ?, overs = ? WHERE matchId = ?')
        .run(runs, wickets, overs, matchId);
    }
  }

  // Emit score update
  io.to(`match:${matchId}`).emit('score:update', {
    matchId,
    runs,
    wickets,
    overs,
    innings: innings || 1
  });

  // Recalculate odds
  recalculateAndBroadcast(matchId, event);
}

function handleMatchEnd(event) {
  const { matchId, winner, result } = event;
  
  io.to(`match:${matchId}`).emit('match:end', {
    matchId,
    winner,
    result
  });

  // Trigger bet settlement
  settleAllBets(matchId, winner, result);
}

function suspendMarkets(matchId, marketTypes) {
  marketTypes.forEach(type => {
    if (dbHelpers?.updateMarketStatus) {
      dbHelpers.updateMarketStatus(matchId, type, 'suspended');
    }
    io.to(`match:${matchId}`).emit('market:status', {
      matchId,
      marketType: type,
      status: 'suspended'
    });
  });
}

function resumeMarkets(matchId, marketTypes) {
  marketTypes.forEach(type => {
    if (dbHelpers?.updateMarketStatus) {
      dbHelpers.updateMarketStatus(matchId, type, 'open');
    }
    io.to(`match:${matchId}`).emit('market:status', {
      matchId,
      marketType: type,
      status: 'open'
    });
  });
}

function recalculateAndBroadcast(matchId, ballData) {
  if (!dbHelpers?.getMatch) return;

  const match = dbHelpers.getMatch(matchId);
  if (!match) return;

  // Import odds engine dynamically to avoid circular deps
  import('./oddsEngine.js').then(({ recalculateOdds }) => {
    const odds = recalculateOdds(matchId, {
      runs: ballData.runs ?? match.runs,
      wickets: ballData.wickets ?? match.wickets,
      overs: ballData.overs ?? match.overs,
      over: Math.floor((ballData.overs ?? match.overs)),
      ball: ((ballData.overs ?? match.overs) % 1) * 6,
      isWicket: ballData.isWicket
    }, dbHelpers);

    if (odds) {
      io.to(`match:${matchId}`).emit('odds:update', {
        matchId,
        oddsData: odds,
        timestamp: new Date().toISOString()
      });
    }
  });
}

function settleAllBets(matchId, winner, result) {
  // Import settlement function
  import('./index.js').then(({ settleBet }) => {
    // Get all pending bets for this match
    const bets = db.prepare('SELECT * FROM bets WHERE matchId = ? AND status = "pending"').all(matchId);
    
    bets.forEach(bet => {
      let betResult = 'lost';
      
      if (result === 'void') {
        betResult = 'void';
      } else if (bet.marketType === 'match_odds') {
        if ((bet.selection === 'team1' && winner === 'team1') ||
            (bet.selection === 'team2' && winner === 'team2') ||
            (bet.selection === 'draw' && winner === 'draw')) {
          betResult = 'won';
        }
      }
      
      settleBet(bet.betId, betResult);
    });
  }).catch(() => {
    console.log('[CricketWS] Settlement will be handled by index.js');
  });
}

// Cleanup on shutdown
export function disconnect() {
  if (cricketWs) {
    cricketWs.close();
    cricketWs = null;
  }
}