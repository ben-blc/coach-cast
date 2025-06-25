'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser, onAuthStateChange } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Define public routes that don't require authentication
  const publicRoutes = ['/', '/auth', '/pricing', '/coaches', '/verify-email', '/privacy', '/terms'];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth') || pathname.startsWith('/verify-email');

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const currentUser = await getCurrentUser();
        
        if (!mounted) return;
        
        setUser(currentUser);
        setIsAuthenticated(!!currentUser);
        
        // If user is not authenticated and trying to access a protected route
        if (!currentUser && !isPublicRoute) {
          console.log('User not authenticated, redirecting to sign in...');
          router.push('/auth?redirect=' + encodeURIComponent(pathname));
          return;
        }
        
        // If user is authenticated and trying to access auth page, redirect to home
        if (currentUser && pathname === '/auth') {
          router.push('/');
          return;
        }
        
        // If user is authenticated but email not confirmed and trying to access protected routes
        if (currentUser && !currentUser.email_confirmed_at && !isPublicRoute && pathname !== '/verify-email') {
          console.log('User email not confirmed, redirecting to verification...');
          router.push(`/verify-email?email=${encodeURIComponent(currentUser.email || '')}`);
          return;
        }
        
        // If user is authenticated with confirmed email and on verify-email page, redirect to home
        if (currentUser && currentUser.email_confirmed_at && pathname === '/verify-email') {
          router.push('/');
          return;
        }
        
      } catch (error) {
        console.error('Error checking authentication:', error);
        if (!mounted) return;
        
        // On error, redirect to auth if not on public route
        if (!isPublicRoute) {
          router.push('/auth?redirect=' + encodeURIComponent(pathname));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    // Initial auth check
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      if (!mounted) return;
      
      console.log('Auth state changed in AuthGuard:', user?.id);
      setUser(user);
      setIsAuthenticated(!!user);
      
      // If user logged out and on protected route, redirect to home
      if (!user && !isPublicRoute) {
        console.log('User logged out, redirecting to home...');
        router.push('/');
      }
      
      // If user logged in and on auth page, redirect to home
      if (user && pathname === '/auth') {
        router.push('/');
      }
      
      // Handle email verification flow
      if (user && !user.email_confirmed_at && !isPublicRoute && pathname !== '/verify-email') {
        console.log('User email not confirmed, redirecting to verification...');
        router.push(`/verify-email?email=${encodeURIComponent(user.email || '')}`);
      }
      
      // If user verified email and on verify page, redirect to home
      if (user && user.email_confirmed_at && pathname === '/verify-email') {
        router.push('/');
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [pathname, router, isPublicRoute]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // For protected routes, only render if authenticated
  if (!isPublicRoute && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}