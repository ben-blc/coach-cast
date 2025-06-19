'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Database, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SupabaseConnectButton() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkSupabaseStatus();
  }, []);

  const checkSupabaseStatus = async () => {
    try {
      const response = await fetch('/api/supabase/status');
      const data = await response.json();
      setIsConfigured(data.configured);
    } catch (error) {
      console.error('Error checking Supabase status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    router.push('/setup/supabase');
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <Database className="w-4 h-4 mr-2" />
        Checking...
      </Button>
    );
  }

  if (isConfigured) {
    return (
      <Button variant="outline" disabled className="text-green-600 border-green-200">
        <CheckCircle className="w-4 h-4 mr-2" />
        Supabase Connected
      </Button>
    );
  }

  return (
    <Button variant="outline" onClick={handleConnect} className="text-orange-600 border-orange-200">
      <AlertCircle className="w-4 h-4 mr-2" />
      Connect Supabase
    </Button>
  );
}