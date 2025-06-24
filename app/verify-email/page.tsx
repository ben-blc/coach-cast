'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle, RefreshCw, ArrowLeft, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [email, setEmail] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Get email from URL params or localStorage
    const emailParam = searchParams.get('email');
    const storedEmail = localStorage.getItem('pendingVerificationEmail');
    
    if (emailParam) {
      setEmail(emailParam);
      localStorage.setItem('pendingVerificationEmail', emailParam);
    } else if (storedEmail) {
      setEmail(storedEmail);
    }

    // Check if user is already verified
    const checkVerification = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        // User is already verified, redirect to home
        localStorage.removeItem('pendingVerificationEmail');
        router.push('/');
      }
    };

    checkVerification();

    // Listen for auth state changes (email verification)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        localStorage.removeItem('pendingVerificationEmail');
        toast({
          title: 'Email verified successfully!',
          description: 'Welcome to Coach Cast. Let\'s start your coaching journey!',
        });
        router.push('/');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, searchParams, toast]);

  // Cooldown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (!email || resendCooldown > 0) return;

    try {
      setIsResending(true);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Verification email sent!',
        description: 'Please check your inbox and spam folder.',
      });

      // Start 60-second cooldown
      setResendCooldown(60);
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      toast({
        title: 'Failed to resend email',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/coachcast-logo.jpeg" 
              alt="Coach Cast" 
              className="w-12 h-12 rounded-xl object-cover"
            />
          </div>
          <p className="text-gray-600 mt-2">Transform your life with personalized coaching</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <p className="text-gray-600">
              We've sent a verification link to your email address.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {email && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Verification email sent to:</p>
                <p className="font-medium text-gray-900">{email}</p>
              </div>
            )}

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Next steps:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>Check your email inbox</li>
                  <li>Look for an email from Coach Cast</li>
                  <li>Click the verification link in the email</li>
                  <li>You'll be redirected to start your coaching journey</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-yellow-800 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Can't find the email?</span>
              </div>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• Check your spam/junk folder</li>
                <li>• Make sure you entered the correct email address</li>
                <li>• The email may take a few minutes to arrive</li>
                <li>• Try resending the verification email below</li>
              </ul>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleResendEmail}
                disabled={isResending || resendCooldown > 0 || !email}
                className="w-full"
                variant="outline"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Resend in {formatTime(resendCooldown)}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>

              <div className="text-center">
                <Button variant="ghost" asChild>
                  <Link href="/auth">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign In
                  </Link>
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-blue-800 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Already verified?</span>
              </div>
              <p className="text-blue-700 text-sm mb-3">
                If you've already clicked the verification link, you can sign in directly.
              </p>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href="/auth">
                  Sign In to Your Account
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <Link href="/contact" className="text-blue-600 hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}