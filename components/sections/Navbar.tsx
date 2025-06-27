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
import { Menu, X, User, Settings, LogOut, Home, Users } from 'lucide-react';
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

  const isLandingPage = pathname === '/' && !user;
  const shouldShowCredits = !isLandingPage && user && profile && subscription;

  const loadUserData = useCallback(async () => {
    try {
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
        setUser(null);
        setProfile(null);
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    const { data: { subscription } } = onAuthStateChange((user) => {
      if (user) {
        loadUserData();
      } else {
        setUser(null);
        setProfile(null);
        setSubscription(null);
        setLoading(false);
      }
    });
    return () => subscription?.unsubscribe();
  }, [loadUserData]);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
      setUser(null);
      setProfile(null);
      setSubscription(null);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.href = '/';
    } finally {
      setSigningOut(false);
    }
  };

  const calculateCreditsRemaining = useCallback(() => {
    if (!subscription) return 0;
    return Math.max(0, subscription.credits_remaining);
  }, [subscription]);

  const handleSectionNavigation = useCallback((sectionId: string) => {
    if (isLandingPage) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      router.push(`/#${sectionId}`);
    }
  }, [isLandingPage, router]);

  const handleHomeNavigation = useCallback(() => {
    if (user) {
      router.push('/');
    } else if (isLandingPage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
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
                src="/logo_square.png" 
                alt="Coach Bridge" 
                className="w-10 h-10 rounded-xl object-cover"
              />
            </Link>
            
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
                            Free Trial
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
                <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Pricing
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
                <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors text-left">
                  Pricing
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