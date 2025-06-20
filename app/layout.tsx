import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { AuthGuard } from '@/components/AuthGuard';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Coach Cast - AI & Human Coaching Platform',
  description: 'Transform your life with personalized AI and human coaching',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthGuard>
          {children}
        </AuthGuard>
        <Toaster />
      </body>
    </html>
  );
}