'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Home, Play } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { Navbar } from '@/components/sections/Navbar';
import Link from 'next/link';

export default function SuccessPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const planName = searchParams?.get('plan') || 'Your Plan';

  useEffect(() => {
    async function loadUserData() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (!currentUser) {
          router.push('/auth');
          return;
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Coach Bridge!
          </h1>
          
          <p className="text-xl text-gray-600 mb-6">
            Your subscription has been successfully activated.
          </p>

          <Badge className="bg-green-100 text-green-800 px-4 py-2 text-lg">
            {planName}
          </Badge>
        </div>

        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-center">What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg text-center">
                <Play className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Start Your First Session</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Explore our coaching studio and begin your transformation journey.
                </p>
                <Button asChild className="w-full">
                  <Link href="/coaching-studio">
                    <Play className="w-4 h-4 mr-2" />
                    Explore Coaches
                  </Link>
                </Button>
              </div>

              <div className="bg-green-50 p-6 rounded-lg text-center">
                <Home className="w-8 h-8 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Visit Your Dashboard</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Track your progress, manage goals, and view your session history.
                </p>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-gray-600 mb-4">
            This is a demo version. In production, this would integrate with real Stripe payments.
          </p>
          <Badge variant="outline" className="text-blue-600 border-blue-300">
            Demo Mode Active
          </Badge>
        </div>
      </div>
    </div>
  );
}