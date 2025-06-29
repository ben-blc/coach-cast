import { useState, useEffect, useCallback } from 'react';
import { getUserTokens, getUserTokenTransactions, syncUserTokens, type UserTokens, type TokenTransaction } from '@/lib/tokens';

export function useUserTokens() {
  const [tokens, setTokens] = useState<UserTokens | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTokens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userTokens = await getUserTokens();
      setTokens(userTokens);
    } catch (err) {
      console.error('Error loading tokens:', err);
      setError('Failed to load token data');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      const tokenTransactions = await getUserTokenTransactions();
      setTransactions(tokenTransactions);
    } catch (err) {
      console.error('Error loading token transactions:', err);
    }
  }, []);

  const refreshTokens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First sync tokens with subscription data
      await syncUserTokens();
      
      // Then load the updated tokens
      const userTokens = await getUserTokens();
      setTokens(userTokens);
      
      // Also refresh transactions
      await loadTransactions();
      
      return userTokens;
    } catch (err) {
      console.error('Error refreshing tokens:', err);
      setError('Failed to refresh token data');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadTransactions]);

  useEffect(() => {
    loadTokens();
    loadTransactions();
  }, [loadTokens, loadTransactions]);

  return {
    tokens,
    transactions,
    loading,
    error,
    refreshTokens,
    loadTransactions
  };
}