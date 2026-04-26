import { useEffect } from 'react';
import { socket } from '../lib/socket';
import { useMatchStore } from '../store/matchStore';

export function useCricketScore(matchId: string, leagueSlug = 'ipl') {
  const { setScore, setOdds, setEvent } = useMatchStore();

  useEffect(() => {
    socket.emit('join_match', { matchId, leagueSlug });

    const onScoreUpdate = (data: any) => {
      if (data.matchId !== matchId) return;
      if (data.display) setScore(matchId, data.display);
      if (data.odds) setOdds(matchId, data.odds);
      if (data.event) setEvent(matchId, data.event);
    };

    const onMarketSettled = ({ marketId }: { marketId: string }) => {
      window.dispatchEvent(new CustomEvent('market_settled', { detail: marketId }));
    };

    socket.on('score_update', onScoreUpdate);
    socket.on('market_settled', onMarketSettled);

    return () => {
      socket.emit('leave_match', { matchId });
      socket.off('score_update', onScoreUpdate);
      socket.off('market_settled', onMarketSettled);
    };
  }, [matchId, leagueSlug, setScore, setOdds, setEvent]);
}