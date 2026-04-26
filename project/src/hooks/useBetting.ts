import { useState, useCallback } from 'react';
import { socket } from '../lib/socket';
import { useUserStore } from '../store/userStore';

interface BetParams {
  matchId: string;
  marketId: string;
  selectionId: string;
  selectionName: string;
  marketType: string;
  betType: 'back' | 'lay';
  requestedOdds: number;
  stake: number;
}

interface BetResult {
  success: boolean;
  bet?: any;
  exposure?: number;
  potentialProfit?: number;
  message?: string;
  error?: string;
}

export function useBetting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setWallet } = useUserStore();

  const placeBet = useCallback(async (params: BetParams): Promise<BetResult> => {
    return new Promise((resolve) => {
      setLoading(true);
      setError(null);

      socket.emit('place_bet', params, (result: BetResult) => {
        setLoading(false);
        if (result.success) {
          if (result.bet) {
            setWallet({
              balance: result.bet.balance || 0,
              exposure: result.bet.exposure || 0,
              available: (result.bet.balance || 0) - (result.bet.exposure || 0),
            });
          }
          resolve(result);
        } else {
          setError(result.error || 'Failed to place bet');
          resolve(result);
        }
      });
    });
  }, [setWallet]);

  const cashout = useCallback(async (betId: string, currentOdds: number) => {
    return new Promise((resolve) => {
      setLoading(true);
      socket.emit('cashout', { betId, currentOdds }, (result: any) => {
        setLoading(false);
        resolve(result);
      });
    });
  }, []);

  return { placeBet, cashout, loading, error };
}