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
import { Menu, X, Mic, User, Settings, LogOut, CreditCard } from 'lucide-react';
import { getCurrentUser, signOut } from '@/lib/auth';
import { getUserProfile, getUserSubscription } from '@/lib/database';
import { useRouter } from 'next/navigation';
import type { Profile, Subscription } from '@/lib/database';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUserData() {
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
        }
      } catch (error) {
        console.error('Error loading user data in header:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, []);

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
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Coach Cast</span>
          </Link>

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

              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <span>Credits:</span>
                <Badge variant="secondary">
                  {calculateCreditsRemaining()}/{subscription?.monthly_limit || 0}
                </Badge>
              </div>

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
                      <Badge variant="outline" className="text-xs w-fit mt-1">
                        {subscription ? getPlanDisplayName(subscription.plan_type) : 'Free Trial'}
                      </Badge>
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
                <div className="flex items-center space-x-2 text-sm text-gray-600 pt-2">
                  <span>Credits:</span>
                  <Badge variant="secondary">
                    {calculateCreditsRemaining()}/{subscription?.monthly_limit || 0}
                  </Badge>
                </div>
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