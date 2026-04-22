// Betting Engine - Bet placement and settlement logic
class BettingEngine {
  constructor() {
    this.db = null;
  }

  setDB(database) {
    this.db = database;
  }

  // Place a new bet
  async placeBet(params) {
    const { userId, matchId, marketId, selectionId, selectionName, marketType, betType, requestedOdds, stake } = params;

    // 1. Validate market is open
    const market = await this.db.getMarket(marketId);
    if (!market) return this.fail('Market not found');
    if (market.status !== 'open') return this.fail(`Market is ${market.status}`);
    if (stake < market.min_stake) return this.fail(`Min stake is ${market.min_stake}`);
    if (stake > market.max_stake) return this.fail(`Max stake is ${market.max_stake}`);

    // 2. Get LIVE odds from DB
    const selection = await this.db.getSelection(selectionId);
    if (!selection) return this.fail('Selection not found');

    const liveOdds = betType === 'back' ? selection.back_odds : selection.lay_odds;

    // 3. Reject if odds have drifted more than 5%
    const drift = Math.abs(requestedOdds - liveOdds) / liveOdds;
    if (drift > 0.05) {
      return this.fail(`Odds moved. You saw ${requestedOdds}, current: ${liveOdds}. Refresh and retry.`);
    }

    // 4. Calculate exposure and potential profit
    const exposure = betType === 'back' 
      ? stake 
      : parseFloat((stake * (liveOdds - 1)).toFixed(2));
    const potentialProfit = betType === 'back' 
      ? parseFloat((stake * (liveOdds - 1)).toFixed(2)) 
      : stake;

    // 5. Lock exposure atomically
    const lockResult = await this.db.lockExposure(userId, exposure);
    if (!lockResult.success) return this.fail('Insufficient available balance');

    // 6. Insert bet record
    const bet = await this.db.placeBet({
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
      potential_profit: potentialProfit
    });

    if (!bet) {
      // Rollback exposure
      await this.db.lockExposure(userId, -exposure);
      return this.fail('Failed to place bet');
    }

    // 7. Log transaction
    const user = await this.db.getUser(userId);
    await this.db.logTransaction({
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
    const bet = await this.db.getBet(betId);
    if (!bet || bet.user_id !== userId || bet.status !== 'open') {
      return this.fail('Bet not found or already settled');
    }

    // Cashout value calculation
    let cashoutValue;
    if (bet.bet_type === 'back') {
      // Back: stake * (original_odds / current_odds)
      cashoutValue = parseFloat((bet.stake * (bet.odds / currentSelectionOdds)).toFixed(2));
    } else {
      // Lay: liability * (current_odds / original_odds)
      cashoutValue = parseFloat((bet.exposure * (currentSelectionOdds / bet.odds)).toFixed(2));
    }
    cashoutValue = Math.max(0, cashoutValue);
    const pnl = cashoutValue - bet.exposure;

    // Settle cashout
    await this.db.cashoutBet(betId, cashoutValue, pnl);
    await this.db.settleUser(userId, bet.exposure, cashoutValue);

    return { success: true, cashoutValue, pnl };
  }

  // Settle market (admin only)
  async settleMarket(marketId, winnerName) {
    // Close market
    await this.db.settleMarket(marketId, winnerName);

    // Get all open bets for this market
    const bets = await this.db.getOpenBetsForMarket(marketId);
    if (!bets?.length) return { success: true, settled: 0 };

    let settledCount = 0;
    for (const bet of bets) {
      const selectionWon = bet.selection_name === winnerName;
      
      // Back wins when selection wins, Lay wins when selection loses
      const betWon = bet.bet_type === 'back' ? selectionWon : !selectionWon;

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
        if (selectionWon) {
          // Selection won → lay bettor loses liability
          pnl = -bet.exposure;
          winnings = 0;
        } else {
          // Selection lost → lay bettor wins the stake
          pnl = bet.stake;
          winnings = bet.exposure + bet.stake;
        }
      }

      await this.db.settleBet(bet.id, betWon ? 'won' : 'lost', pnl);
      await this.db.settleUser(bet.user_id, bet.exposure, Math.max(0, winnings));

      const user = await this.db.getUser(bet.user_id);
      await this.db.logTransaction({
        user_id: bet.user_id,
        type: betWon ? 'bet_win' : 'bet_loss',
        amount: pnl,
        balance_before: (user?.balance ?? 0) - Math.max(0, pnl),
        balance_after: user?.balance ?? 0,
        reference_id: bet.id,
        note: `${bet.selection_name} @ ${bet.odds} — ${betWon ? 'WON' : 'LOST'} ₹${Math.abs(pnl).toFixed(2)}`
      });

      settledCount++;
    }

    return { success: true, settled: settledCount };
  }

  fail(msg) {
    return { success: false, error: msg };
  }
}

export const bettingEngine = new BettingEngine();