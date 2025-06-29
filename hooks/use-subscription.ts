import { useState, useEffect } from 'react';
import { getUserActiveSubscription } from '@/lib/subscription-service';

export function useUserSubscription() {
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubscription() {
      try {
        setLoading(true);
        setError(null);
        
        const subscription = await getUserActiveSubscription();
        setActiveSubscription(subscription);
      } catch (err) {
        console.error('Error loading subscription:', err);
        setError('Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    }

    loadSubscription();
  }, []);

  const refreshSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const subscription = await getUserActiveSubscription();
      setActiveSubscription(subscription);
      return subscription;
    } catch (err) {
      console.error('Error refreshing subscription:', err);
      setError('Failed to refresh subscription data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    activeSubscription,
    loading,
    error,
    refreshSubscription
  };
}