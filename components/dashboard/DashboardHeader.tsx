'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, LogOut, User, CreditCard } from 'lucide-react';
import { signOut, getCurrentUser, onAuthStateChange } from '@/lib/auth';
import { getUserSubscription } from '@/lib/database';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardHeaderProps {
  user: {
    name: string;
    email: string;
    plan: string;
    creditsRemaining: number;
    totalCredits: number;
  };
}

export function DashboardHeader({ user: initialUser }: DashboardHeaderProps) {
  const [user, setUser] = useState(initialUser);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  // Function to refresh credits data
  const refreshCredits = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const subscription = await getUserSubscription(currentUser.id);
        if (subscription) {
          setUser(prev => ({
            ...prev,
            creditsRemaining: Math.max(0, subscription.credits_remaining),
            totalCredits: subscription.monthly_limit
          }));
        }
      }
    } catch (error) {
      console.error('Error refreshing credits:', error);
    }
  };

  // Auto-refresh credits when page becomes visible
  useEffect(() => {
    let mounted = true;

    const handleVisibilityChange = () => {
      if (!document.hidden && mounted) {
        refreshCredits();
      }
    };

    const handleFocus = () => {
      if (mounted) {
        refreshCredits();
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange((authUser) => {
      if (!mounted) return;
      
      if (!authUser) {
        // User signed out, redirect to home
        router.push('/');
      }
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      subscription?.unsubscribe();
    };
  }, [router]);

  // Periodic refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        refreshCredits();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      console.log('Starting sign out from dashboard...');
      
      await signOut();
      
      console.log('Sign out successful, redirecting to home...');
      
      // Force redirect to home page
      router.push('/');
      
      // Also force a page reload to ensure clean state
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
    } catch (error) {
      console.error('Error signing out from dashboard:', error);
      
      // Even if there's an error, force redirect to home
      window.location.href = '/';
    } finally {
      setSigningOut(false);
    }
  };

  const getPlanDisplayName = (planType: string) => {
    switch (planType) {
      case 'free': return 'Free Trial';
      case 'ai_explorer': return 'AI Explorer';
      case 'coaching_starter': return 'Coaching Starter';
      case 'coaching_accelerator': return 'Coaching Accelerator';
      default: return 'Free Trial';
    }
  };

  const calculateCreditsRemaining = () => {
    if (!user) return 0;
    return Math.max(0, user.creditsRemaining);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center">
              <img 
                src="/coachcast-logo.jpeg" 
                alt="Coach Cast" 
                className="w-8 h-8 rounded-lg object-cover"
              />
            </Link>
            
            {/* Bolt.new Hackathon Badge */}
            <a 
              href="https://bolt.new" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-black text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-gray-800 transition-colors"
            >
              <img 
                src="/bolt-badge.png" 
                alt="Bolt.new" 
                className="w-4 h-4"
              />
              <span>Bolt hackathon</span>
            </a>
            
            <Badge variant="outline" className="text-xs">
              {user.plan}
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
              <span>Credits:</span>
              <Badge variant="secondary">
                {calculateCreditsRemaining()}/{user.totalCredits}
              </Badge>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-900 text-white">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs w-fit">
                        {user.plan}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {calculateCreditsRemaining()}/{user.totalCredits} credits
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} disabled={signingOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{signingOut ? 'Signing out...' : 'Log out'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}