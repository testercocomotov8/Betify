// Betting Engine - Bet placement and settlement logic
export class BettingEngine {
  constructor() {
    this.database = null;
  }

  setDatabase(db) {
    this.database = db;
  }

  // Place a new bet
  async placeBet(params) {
    const { userId, matchId, marketId, selectionId, selectionName, marketType, betType, requestedOdds, stake } = params;

    // 1. Validate market is open
    const market = this.database.getMarket(marketId);
    if (!market) return this.fail('Market not found');
    if (market.status !== 'open') return this.fail(`Market is ${market.status}`);
    if (stake < market.min_stake) return this.fail(`Min stake is ${market.min_stake}`);
    if (stake > market.max_stake) return this.fail(`Max stake is ${market.max_stake}`);

    // 2. Get LIVE odds from DB
    const selection = this.database.getSelection(selectionId);
    if (!selection) return this.fail('Selection not found');

    const liveOdds = betType === 'back' ? selection.back_odds : selection.lay_odds;

    // 3. Reject if odds drifted more than 5%
    const drift = Math.abs(requestedOdds - liveOdds) / liveOdds;
    if (drift > 0.05) {
      return this.fail(`Odds moved. You saw ${requestedOdds}, current: ${liveOdds}. Refresh and retry.`);
    }

    // 4. Calculate exposure and potential profit
    const exposure = betType === 'back' ? stake : parseFloat((stake * (liveOdds - 1)).toFixed(2));
    const potentialProfit = betType === 'back' ? parseFloat((stake * (liveOdds - 1)).toFixed(2)) : stake;

    // 5. Lock exposure atomically
    const lockResult = this.database.lockExposure(userId, exposure);
    if (!lockResult.success) return this.fail('Insufficient available balance');

    // 6. Insert bet record
    const bet = this.database.insertBet({
      user_id: userId,
      match_id: matchId,
      market_id: marketId,
      selection_id: selectionId,
      selection_name: selectionName,
      market_type: marketType,
      bet_type: betType,
      odds: liveOdds,
      stake,
      exposure,
      potential_profit: potentialProfit,
      status: 'open'
    });

    if (!bet) {
      // Rollback exposure
      this.database.lockExposure(userId, -exposure);
      return this.fail('Failed to place bet');
    }

    // 7. Log transaction
    const user = this.database.getUser(userId);
    this.database.insertTransaction({
      user_id: userId,
      type: 'bet_place',
      amount: -exposure,
      balance_before: (user?.balance ?? 0) + exposure,
      balance_after: user?.balance ?? 0,
      reference_id: bet.id,
      note: `${betType.toUpperCase()} ${selectionName} @ ${liveOdds} — stake ₹${stake}`
    });

    return {
      success: true,
      bet,
      exposure,
      potentialProfit,
      matchedOdds: liveOdds,
      message: betType === 'back' 
        ? `Back bet placed! Win ₹${potentialProfit} if ${selectionName} wins.`
        : `Lay bet placed! Win ₹${potentialProfit} if ${selectionName} loses.`
    };
  }

  // Cashout an open bet
  async cashout(betId, userId, currentSelectionOdds) {
    const bet = this.database.getBet(betId);
    if (!bet || bet.user_id !== userId || bet.status !== 'open') {
      return this.fail('Bet not found or already settled');
    }

    // Calculate cashout value
    let cashoutValue;
    if (bet.bet_type === 'back') {
      cashoutValue = parseFloat((bet.stake * (bet.odds / currentSelectionOdds)).toFixed(2));
    } else {
      cashoutValue = parseFloat((bet.exposure * (currentSelectionOdds / bet.odds)).toFixed(2));
    }
    cashoutValue = Math.max(0, cashoutValue);
    const pnl = cashoutValue - bet.exposure;

    // Settle
    this.database.updateBet(betId, {
      status: 'cashedout',
      pnl,
      cashout_value: cashoutValue,
      settled_at: new Date().toISOString()
    });

    this.database.settleUser(userId, bet.exposure, cashoutValue);

    return { success: true, cashoutValue, pnl };
  }

  // Settle market (admin only)
  async settleMarket(marketId, winnerName) {
    // Close market
    this.database.updateMarket(marketId, {
      status: 'settled',
      result: winnerName,
      settled_at: new Date().toISOString()
    });

    // Get all open bets for this market
    const bets = this.database.getBetsByMarket(marketId, 'open');
    if (!bets?.length) return { success: true, settled: 0 };

    for (const bet of bets) {
      const selectionWon = bet.selection_name === winnerName;
      
      let pnl, winnings;
      if (bet.bet_type === 'back') {
        if (selectionWon) {
          pnl = bet.potential_profit;
          winnings = bet.stake + bet.potential_profit;
        } else {
          pnl = -bet.stake;
          winnings = 0;
        }
      } else {
        // Lay bet - wins when selection LOSES
        if (selectionWon) {
          pnl = -bet.exposure;
          winnings = 0;
        } else {
          pnl = bet.stake;
          winnings = bet.exposure + bet.stake;
        }
      }

      const betWon = bet.bet_type === 'back' ? selectionWon : !selectionWon;

      this.database.updateBet(bet.id, {
        status: betWon ? 'won' : 'lost',
        pnl,
        settled_at: new Date().toISOString()
      });

      this.database.settleUser(bet.user_id, bet.exposure, Math.max(0, winnings));

      const user = this.database.getUser(bet.user_id);
      this.database.insertTransaction({
        user_id: bet.user_id,
        type: betWon ? 'bet_win' : 'bet_loss',
        amount: pnl,
        balance_before: (user?.balance ?? 0) - Math.max(0, pnl),
        balance_after: user?.balance ?? 0,
        reference_id: bet.id,
        note: `${bet.selection_name} @ ${bet.odds} — ${betWon ? 'WON' : 'LOST'} ₹${Math.abs(pnl).toFixed(2)}`
      });
    }

    return { success: true, settled: bets.length };
  }

  fail(msg) {
    return { success: false, error: msg };
  }
}

export const bettingEngine = new BettingEngine();