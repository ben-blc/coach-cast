'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { Menu, X, User, Settings, LogOut, CreditCard, Home, Users } from 'lucide-react';
import { getCurrentUser, signOut, onAuthStateChange } from '@/lib/auth';
import { getUserProfile, getUserSubscription } from '@/lib/database';
import { useRouter, usePathname } from 'next/navigation';
import type { Profile, Subscription } from '@/lib/database';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Use refs to prevent unnecessary re-renders
  const lastRefreshTime = useRef<number>(0);
  const refreshInProgress = useRef<boolean>(false);
  const mounted = useRef<boolean>(true);

  // Check if we're on the landing page
  const isLandingPage = pathname === '/' && !user;
  // Check if we should show credits (not on landing page and user is authenticated)
  const shouldShowCredits = !isLandingPage && user && profile && subscription;

  // Memoized function to load user data with debouncing
  const loadUserData = useCallback(async (showRefreshIndicator = false) => {
    // Prevent multiple simultaneous refreshes
    if (refreshInProgress.current) return;
    
    // Debounce rapid refresh calls (minimum 5 seconds between refreshes)
    const now = Date.now();
    if (now - lastRefreshTime.current < 5000 && !showRefreshIndicator) {
      return;
    }

    try {
      refreshInProgress.current = true;
      lastRefreshTime.current = now;

      const currentUser = await getCurrentUser();
      if (!mounted.current) return;

      if (currentUser) {
        setUser(currentUser);
        
        const [userProfile, userSubscription] = await Promise.all([
          getUserProfile(currentUser.id),
          getUserSubscription(currentUser.id)
        ]);
        
        if (!mounted.current) return;
        
        setProfile(userProfile);
        setSubscription(userSubscription);
      } else {
        // Clear user data if no current user
        setUser(null);
        setProfile(null);
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error loading user data in navbar:', error);
    } finally {
      if (mounted.current) {
        setLoading(false);
        refreshInProgress.current = false;
      }
    }
  }, []);

  // Initial load and auth state listener
  useEffect(() => {
    mounted.current = true;

    // Initial load
    loadUserData();

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      if (!mounted.current) return;
      
      console.log('Auth state changed in Navbar:', user?.id);
      
      if (user) {
        // User signed in, load their data
        loadUserData();
      } else {
        // User signed out, clear data immediately
        setUser(null);
        setProfile(null);
        setSubscription(null);
        setLoading(false);
      }
    });

    return () => {
      mounted.current = false;
      subscription?.unsubscribe();
    };
  }, [loadUserData]);

  // Controlled refresh on visibility change (less aggressive)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && !loading && mounted.current) {
        // Only refresh if it's been more than 30 seconds since last refresh
        const timeSinceLastRefresh = Date.now() - lastRefreshTime.current;
        if (timeSinceLastRefresh > 30000) {
          console.log('Page became visible, refreshing navbar data...');
          loadUserData(true);
        }
      }
    };

    const handleFocus = () => {
      if (user && !loading && mounted.current) {
        // Only refresh if it's been more than 30 seconds since last refresh
        const timeSinceLastRefresh = Date.now() - lastRefreshTime.current;
        if (timeSinceLastRefresh > 30000) {
          console.log('Window focused, refreshing navbar data...');
          loadUserData(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, loading, loadUserData]);

  // Controlled refresh on navigation (only for specific routes)
  useEffect(() => {
    if (user && !loading && mounted.current) {
      // Only refresh data when navigating from session pages (where credits might have changed)
      if (pathname.includes('/session/') || pathname.includes('/coaching-studio')) {
        const timeSinceLastRefresh = Date.now() - lastRefreshTime.current;
        if (timeSinceLastRefresh > 10000) { // 10 seconds minimum
          console.log('Navigation from session detected, refreshing navbar data...');
          loadUserData(true);
        }
      }
    }
  }, [pathname, user, loading, loadUserData]);

  // Reduced frequency periodic refresh (every 2 minutes instead of 30 seconds)
  useEffect(() => {
    if (user && !loading && !isLandingPage && mounted.current) {
      const interval = setInterval(() => {
        if (!document.hidden && mounted.current) {
          loadUserData(false); // Silent refresh
        }
      }, 120000); // 2 minutes instead of 30 seconds

      return () => clearInterval(interval);
    }
  }, [user, loading, isLandingPage, loadUserData]);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      console.log('Starting sign out process...');
      
      await signOut();
      
      // Clear local state immediately
      setUser(null);
      setProfile(null);
      setSubscription(null);
      
      console.log('Sign out successful, redirecting to home...');
      
      // Force redirect to home page
      router.push('/');
      
      // Also force a page reload to ensure clean state
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
    } catch (error) {
      console.error('Error signing out:', error);
      
      // Even if there's an error, clear local state and redirect
      setUser(null);
      setProfile(null);
      setSubscription(null);
      
      // Force redirect to home
      window.location.href = '/';
    } finally {
      setSigningOut(false);
    }
  };

  const getPlanDisplayName = useCallback((planType: string) => {
    switch (planType) {
      case 'free': return 'Free Trial';
      case 'ai_explorer': return 'AI Explorer';
      case 'coaching_starter': return 'Coaching Starter';
      case 'coaching_accelerator': return 'Coaching Accelerator';
      default: return 'Free Trial';
    }
  }, []);

  const calculateCreditsRemaining = useCallback(() => {
    if (!subscription) return 0;
    return Math.max(0, subscription.credits_remaining);
  }, [subscription]);

  // Function to handle navigation to sections
  const handleSectionNavigation = useCallback((sectionId: string) => {
    if (isLandingPage) {
      // If on landing page, scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If not on landing page, navigate to home page with hash
      router.push(`/#${sectionId}`);
    }
  }, [isLandingPage, router]);

  // Function to handle home navigation
  const handleHomeNavigation = useCallback(() => {
    if (user) {
      // If user is logged in, go to home (which is now the dashboard)
      router.push('/');
    } else if (isLandingPage) {
      // If on landing page, scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // If not on landing page, navigate to home
      router.push('/');
    }
  }, [user, isLandingPage, router]);

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
                <button 
                  onClick={handleHomeNavigation}
                  className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1"
                >
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </button>
                <Link href="/coaching-studio" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>Coach Studio</span>
                </Link>
              </nav>

              {/* Only show credits if not on landing page */}
              {shouldShowCredits && (
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                  <span>Credits:</span>
                  <Badge variant="secondary">
                    {calculateCreditsRemaining()}/{subscription?.monthly_limit || 0}
                  </Badge>
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
                    <Link href="/">
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
                  <DropdownMenuItem onClick={handleSignOut} disabled={signingOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{signingOut ? 'Signing out...' : 'Log out'}</span>
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
                <button 
                  onClick={handleHomeNavigation}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Home
                </button>
                <button 
                  onClick={() => handleSectionNavigation('features')}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Features
                </button>
                <button 
                  onClick={() => handleSectionNavigation('pricing')}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Pricing
                </button>
                <button 
                  onClick={() => handleSectionNavigation('coaches')}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  For Coaches
                </button>
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
                <button 
                  onClick={() => {
                    handleHomeNavigation();
                    setIsMenuOpen(false);
                  }}
                  className="text-gray-600 hover:text-gray-900 transition-colors text-left flex items-center space-x-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </button>
                <Link href="/coaching-studio" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Coach Studio</span>
                </Link>
                <button 
                  onClick={() => {
                    handleSectionNavigation('coaches');
                    setIsMenuOpen(false);
                  }}
                  className="text-gray-600 hover:text-gray-900 transition-colors text-left"
                >
                  For Coaches
                </button>
                {/* Only show credits in mobile menu if not on landing page */}
                {shouldShowCredits && (
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>Credits:</span>
                      <Badge variant="secondary">
                        {calculateCreditsRemaining()}/{subscription?.monthly_limit || 0}
                      </Badge>
                    </div>
                  </div>
                )}
                <div className="pt-4">
                  <Button 
                    variant="outline" 
                    onClick={handleSignOut} 
                    className="w-full"
                    disabled={signingOut}
                  >
                    {signingOut ? 'Signing out...' : 'Sign Out'}
                  </Button>
                </div>
              </nav>
            ) : (
              <nav className="flex flex-col space-y-4">
                <button 
                  onClick={() => {
                    handleHomeNavigation();
                    setIsMenuOpen(false);
                  }}
                  className="text-gray-600 hover:text-gray-900 transition-colors text-left"
                >
                  Home
                </button>
                <button 
                  onClick={() => {
                    handleSectionNavigation('features');
                    setIsMenuOpen(false);
                  }}
                  className="text-gray-600 hover:text-gray-900 transition-colors text-left"
                >
                  Features
                </button>
                <button 
                  onClick={() => {
                    handleSectionNavigation('pricing');
                    setIsMenuOpen(false);
                  }}
                  className="text-gray-600 hover:text-gray-900 transition-colors text-left"
                >
                  Pricing
                </button>
                <button 
                  onClick={() => {
                    handleSectionNavigation('coaches');
                    setIsMenuOpen(false);
                  }}
                  className="text-gray-600 hover:text-gray-900 transition-colors text-left"
                >
                  For Coaches
                </button>
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