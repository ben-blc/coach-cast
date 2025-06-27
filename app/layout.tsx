import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { AuthGuard } from '@/components/AuthGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Coach Bridge - AI & Human Coaching Platform',
  description: 'Transform your life with personalized AI and human coaching',
};

// Disable dynamic rendering for static export
export const dynamic = 'force-static';
export const revalidate = false;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <AuthGuard>
            {children}
          </AuthGuard>
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}