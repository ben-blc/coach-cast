'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { Menu, X, User, Settings, LogOut, CreditCard, RefreshCw } from 'lucide-react';
import { getCurrentUser, signOut } from '@/lib/auth';
import { getUserProfile, getUserSubscription } from '@/lib/database';
import { useRouter, usePathname } from 'next/navigation';
import type { Profile, Subscription } from '@/lib/database';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're on the landing page
  const isLandingPage = pathname === '/';
  // Check if we should show credits (not on landing page and user is authenticated)
  const shouldShowCredits = !isLandingPage && user && profile && subscription;

  // Function to load user data
  const loadUserData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      }

      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        
        const [userProfile, userSubscription] = await Promise.all([
          getUserProfile(currentUser.id),
          getUserSubscription(currentUser.id)
        ]);
        
        setProfile(userProfile);
        setSubscription(userSubscription);
      } else {
        // Clear user data if no current user
        setUser(null);
        setProfile(null);
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error loading user data in header:', error);
    } finally {
      setLoading(false);
      if (showRefreshIndicator) {
        setRefreshing(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    loadUserData();
  }, []);

  // Auto-refresh when returning from sessions or when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && !loading) {
        console.log('Page became visible, refreshing header data...');
        loadUserData(true);
      }
    };

    const handleFocus = () => {
      if (user && !loading) {
        console.log('Window focused, refreshing header data...');
        loadUserData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, loading]);

  // Refresh data when navigating between pages (especially from sessions)
  useEffect(() => {
    if (user && !loading) {
      // Refresh data when pathname changes, especially from session pages
      if (pathname.includes('/session/') || pathname.includes('/dashboard')) {
        console.log('Navigation detected, refreshing header data...');
        loadUserData(true);
      }
    }
  }, [pathname, user, loading]);

  // Periodic refresh every 30 seconds when user is active (but not on landing page)
  useEffect(() => {
    if (user && !loading && !isLandingPage) {
      const interval = setInterval(() => {
        if (!document.hidden) {
          loadUserData(false); // Silent refresh
        }
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [user, loading, isLandingPage]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setProfile(null);
      setSubscription(null);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleRefresh = () => {
    loadUserData(true);
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
    if (!subscription) return 0;
    return Math.max(0, subscription.credits_remaining);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center">
              <img 
                src="/coachcast-logo.jpeg" 
                alt="Coach Cast" 
                className="w-10 h-10 rounded-xl object-cover"
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
          </div>

          {!loading && user && profile ? (
            // Authenticated user navigation
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex items-center space-x-6">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Dashboard
                </Link>
                <Link href="/discovery" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Start Session
                </Link>
                <Link href="/coaches" className="text-gray-600 hover:text-gray-900 transition-colors">
                  For Coaches
                </Link>
              </nav>

              {/* Only show credits if not on landing page */}
              {shouldShowCredits && (
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                  <span>Credits:</span>
                  <Badge variant="secondary" className="relative">
                    {calculateCreditsRemaining()}/{subscription?.monthly_limit || 0}
                    {refreshing && (
                      <div className="absolute -top-1 -right-1 w-3 h-3">
                        <div className="w-2 h-2 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gray-900 text-white">
                        {profile.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile.full_name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile.email}
                      </p>
                      {subscription && (
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-xs w-fit">
                            {getPlanDisplayName(subscription.plan_type)}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {calculateCreditsRemaining()}/{subscription.monthly_limit} credits
                          </div>
                        </div>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
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
                  <DropdownMenuItem onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          ) : !loading ? (
            // Non-authenticated user navigation
            <>
              <nav className="hidden md:flex items-center space-x-8">
                <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Features
                </Link>
                <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Pricing
                </Link>
                <Link href="/coaches" className="text-gray-600 hover:text-gray-900 transition-colors">
                  For Coaches
                </Link>
              </nav>

              <div className="hidden md:flex items-center space-x-4">
                <Button variant="ghost" asChild>
                  <Link href="/auth">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth?mode=signup">Get Started</Link>
                </Button>
              </div>

              <button
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </>
          ) : (
            // Loading state
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {user && profile ? (
              <nav className="flex flex-col space-y-4">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Dashboard
                </Link>
                <Link href="/discovery" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Start Session
                </Link>
                <Link href="/coaches" className="text-gray-600 hover:text-gray-900 transition-colors">
                  For Coaches
                </Link>
                {/* Only show credits in mobile menu if not on landing page */}
                {shouldShowCredits && (
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>Credits:</span>
                      <Badge variant="secondary">
                        {calculateCreditsRemaining()}/{subscription?.monthly_limit || 0}
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleRefresh}
                      disabled={refreshing}
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                )}
                <div className="pt-4">
                  <Button variant="outline" onClick={handleSignOut} className="w-full">
                    Sign Out
                  </Button>
                </div>
              </nav>
            ) : (
              <nav className="flex flex-col space-y-4">
                <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Features
                </Link>
                <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Pricing
                </Link>
                <Link href="/coaches" className="text-gray-600 hover:text-gray-900 transition-colors">
                  For Coaches
                </Link>
                <div className="flex flex-col space-y-2 pt-4">
                  <Button variant="ghost" asChild>
                    <Link href="/auth">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth?mode=signup">Get Started</Link>
                  </Button>
                </div>
              </nav>
            )}
          </div>
        )}
      </div>
    </header>
  );
}