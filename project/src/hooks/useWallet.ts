import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  note: string;
  created_at: string;
}

export function useWallet() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userId, setWallet } = useUserStore();

  const deposit = useCallback(async (amount: number) => {
    if (!userId) return { success: false, error: 'Not authenticated' };
    if (amount < 100) return { success: false, error: 'Minimum deposit is ₹100' };

    setLoading(true);
    setError(null);

    try {
      const { data: user } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

      const { error: rpcError } = await supabase.rpc('deposit', {
        p_user_id: userId,
        p_amount: amount,
      });

      if (rpcError) throw rpcError;

      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'deposit',
        amount: amount,
        balance_before: user?.balance || 0,
        balance_after: (user?.balance || 0) + amount,
        note: `Deposit of ₹${amount}`,
      });

      const { data: updated } = await supabase
        .from('users')
        .select('balance, exposure')
        .eq('id', userId)
        .single();

      if (updated) {
        setWallet({
          balance: updated.balance,
          exposure: updated.exposure,
          available: updated.balance - updated.exposure,
        });
      }

      setLoading(false);
      return { success: true, message: `Deposited ₹${amount} successfully` };
    } catch (err: any) {
      setLoading(false);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [userId, setWallet]);

  const withdraw = useCallback(async (amount: number) => {
    if (!userId) return { success: false, error: 'Not authenticated' };
    if (amount < 100) return { success: false, error: 'Minimum withdrawal is ₹100' };

    setLoading(true);
    setError(null);

    try {
      const { data: user } = await supabase
        .from('users')
        .select('balance, exposure')
        .eq('id', userId)
        .single();

      const available = (user?.balance || 0) - (user?.exposure || 0);
      if (amount > available) {
        throw new Error('Insufficient available balance');
      }

      const { error: rpcError } = await supabase.rpc('withdraw', {
        p_user_id: userId,
        p_amount: amount,
      });

      if (rpcError) throw rpcError;

      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'withdraw',
        amount: -amount,
        balance_before: user?.balance || 0,
        balance_after: (user?.balance || 0) - amount,
        note: `Withdrawal of ₹${amount}`,
      });

      const { data: updated } = await supabase
        .from('users')
        .select('balance, exposure')
        .eq('id', userId)
        .single();

      if (updated) {
        setWallet({
          balance: updated.balance,
          exposure: updated.exposure,
          available: updated.balance - updated.exposure,
        });
      }

      setLoading(false);
      return { success: true, message: `Withdrawal of ₹${amount} initiated` };
    } catch (err: any) {
      setLoading(false);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [userId, setWallet]);

  const getTransactions = useCallback(async (limit = 50): Promise<Transaction[]> => {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data || [];
  }, [userId]);

  return { deposit, withdraw, getTransactions, loading, error };
}