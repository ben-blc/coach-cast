import { Suspense } from 'react';
import CoachDetailClient from './CoachDetailClient';

// This is a server component that renders the client component
// No generateStaticParams - paths are generated dynamically at runtime
export default function CoachDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading coach details...</p>
        </div>
      </div>
    }>
      <CoachDetailClient />
    </Suspense>
  );
}