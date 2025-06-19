'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Copy,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { testSupabaseConnection, saveSupabaseConfig } from '@/lib/supabase-setup';

export default function SupabaseSetupPage() {
  const [config, setConfig] = useState({
    url: '',
    anonKey: '',
    serviceKey: ''
  });
  const [showKeys, setShowKeys] = useState({
    anonKey: false,
    serviceKey: false
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if Supabase is already configured
    const checkExistingConfig = async () => {
      try {
        const response = await fetch('/api/supabase/status');
        const data = await response.json();
        setIsConfigured(data.configured);
        if (data.configured) {
          setConnectionStatus('success');
        }
      } catch (error) {
        console.error('Error checking Supabase status:', error);
      }
    };

    checkExistingConfig();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setError('');
    setConnectionStatus('idle');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const testConnection = async () => {
    if (!config.url || !config.anonKey) {
      setError('Please provide both Supabase URL and Anonymous Key');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('testing');
    setError('');

    try {
      const result = await testSupabaseConnection(config);
      if (result.success) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
        setError(result.error || 'Connection failed');
      }
    } catch (err) {
      setConnectionStatus('error');
      setError('Failed to test connection');
    } finally {
      setIsConnecting(false);
    }
  };

  const saveConfiguration = async () => {
    if (connectionStatus !== 'success') {
      setError('Please test the connection first');
      return;
    }

    setIsConnecting(true);

    try {
      const result = await saveSupabaseConfig(config);
      if (result.success) {
        setIsConfigured(true);
        // Redirect to dashboard after successful setup
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(result.error || 'Failed to save configuration');
      }
    } catch (err) {
      setError('Failed to save configuration');
    } finally {
      setIsConnecting(false);
    }
  };

  if (isConfigured && connectionStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">Supabase Connected!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Your Supabase database is successfully connected and configured.
            </p>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connect to Supabase</h1>
          <p className="text-gray-600">
            Set up your Supabase database connection to enable all Coach Cast features
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Setup Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ExternalLink className="w-5 h-5 mr-2" />
                Setup Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Badge className="bg-blue-100 text-blue-800 mt-1">1</Badge>
                  <div>
                    <p className="font-medium">Create a Supabase Project</p>
                    <p className="text-sm text-gray-600">
                      Go to{' '}
                      <a 
                        href="https://supabase.com/dashboard" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        supabase.com/dashboard
                      </a>{' '}
                      and create a new project
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Badge className="bg-blue-100 text-blue-800 mt-1">2</Badge>
                  <div>
                    <p className="font-medium">Get Your Project URL</p>
                    <p className="text-sm text-gray-600">
                      In your project settings, copy the "Project URL"
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Badge className="bg-blue-100 text-blue-800 mt-1">3</Badge>
                  <div>
                    <p className="font-medium">Get Your API Keys</p>
                    <p className="text-sm text-gray-600">
                      In Settings → API, copy the "anon public" key and optionally the "service_role" key
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Badge className="bg-blue-100 text-blue-800 mt-1">4</Badge>
                  <div>
                    <p className="font-medium">Run Database Migration</p>
                    <p className="text-sm text-gray-600">
                      In the SQL Editor, run the migration script to create the required tables
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  The database migration script is already included in your project. 
                  You can find it in the supabase/migrations folder.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Configuration Form */}
          <Card>
            <CardHeader>
              <CardTitle>Database Configuration</CardTitle>
              <p className="text-sm text-gray-600">
                Enter your Supabase project credentials
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Project URL</Label>
                <Input
                  id="url"
                  placeholder="https://your-project.supabase.co"
                  value={config.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="anonKey">Anonymous Key</Label>
                <div className="relative">
                  <Input
                    id="anonKey"
                    type={showKeys.anonKey ? 'text' : 'password'}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={config.anonKey}
                    onChange={(e) => handleInputChange('anonKey', e.target.value)}
                    className="pr-20"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowKeys(prev => ({ ...prev, anonKey: !prev.anonKey }))}
                    >
                      {showKeys.anonKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(config.anonKey)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceKey">Service Role Key (Optional)</Label>
                <div className="relative">
                  <Input
                    id="serviceKey"
                    type={showKeys.serviceKey ? 'text' : 'password'}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={config.serviceKey}
                    onChange={(e) => handleInputChange('serviceKey', e.target.value)}
                    className="pr-20"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowKeys(prev => ({ ...prev, serviceKey: !prev.serviceKey }))}
                    >
                      {showKeys.serviceKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(config.serviceKey)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Required for admin operations and migrations
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {connectionStatus === 'success' && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Connection successful! You can now save the configuration.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-3">
                <Button
                  onClick={testConnection}
                  disabled={isConnecting || !config.url || !config.anonKey}
                  variant="outline"
                  className="flex-1"
                >
                  {isConnecting && connectionStatus === 'testing' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4 mr-2" />
                  )}
                  Test Connection
                </Button>

                <Button
                  onClick={saveConfiguration}
                  disabled={isConnecting || connectionStatus !== 'success'}
                  className="flex-1"
                >
                  {isConnecting && connectionStatus === 'success' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Save & Connect
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}