'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Settings, LogOut, User, Home, Users, CreditCard } from 'lucide-react';
import { signOut, getCurrentUser, onAuthStateChange } from '@/lib/auth';
import { getUserProfile } from '@/lib/database';
import { useRouter } from 'next/navigation';
import { useUserTokens } from '@/hooks/use-tokens';
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
  const { tokens, refreshTokens } = useUserTokens();

  const refreshUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      const userProfile = await getUserProfile(currentUser.id);
      if (!userProfile) return;

      // Update user data from tokens
      if (tokens) {
        setUser(prev => ({
          ...prev,
          name: userProfile.full_name,
          email: userProfile.email,
          plan: tokens.plan_name,
          creditsRemaining: tokens.tokens_remaining,
          totalCredits: tokens.total_tokens
        }));
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const handleVisibilityChange = () => {
      if (!document.hidden && mounted) {
        refreshTokens();
        refreshUserData();
      }
    };

    const { data: { subscription } } = onAuthStateChange((authUser) => {
      if (!mounted) return;
      if (!authUser) {
        router.push('/');
      }
    });

    refreshTokens();
    refreshUserData();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      subscription?.unsubscribe();
    };
  }, [router, refreshTokens]);

  // Update user data when tokens change
  useEffect(() => {
    if (tokens) {
      setUser(prev => ({
        ...prev,
        plan: tokens.plan_name,
        creditsRemaining: tokens.tokens_remaining,
        totalCredits: tokens.total_tokens
      }));
    }
  }, [tokens]);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
      router.push('/');
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.href = '/';
    } finally {
      setSigningOut(false);
    }
  };

  const calculateCreditsRemaining = () => {
    if (tokens) {
      return Math.max(0, tokens.tokens_remaining);
    }
    return Math.max(0, user.creditsRemaining);
  };

  const calculateTotalCredits = () => {
    if (tokens) {
      return tokens.total_tokens;
    }
    return user.totalCredits;
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center">
              <img 
                src="/logo_long.png" 
                alt="Coach Bridge" 
                className="h-8 w-auto object-contain"
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
            
            <Badge variant="outline" className="text-xs">
              {user.plan}
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-600 hover:text-brand-primary transition-colors flex items-center space-x-1 font-medium">
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <Link href="/coaching-studio" className="text-gray-600 hover:text-brand-primary transition-colors flex items-center space-x-1 font-medium">
                <Users className="w-4 h-4" />
                <span>Coach Studio</span>
              </Link>
            </nav>

            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
              <span>Tokens:</span>
              <Badge variant="secondary">
                {calculateCreditsRemaining()}/{calculateTotalCredits()}
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
                        {calculateCreditsRemaining()}/{calculateTotalCredits()} tokens
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/billing">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
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
          </div>
        </div>
      </div>
    </header>
  );
}