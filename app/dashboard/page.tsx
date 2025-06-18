'use client';

import { useState } from 'react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Error
        </h1>
        <p className="text-gray-700 mb-2">
          Failed to collect page data for <span className="font-mono text-sm text-gray-900">/dashboard</span>
        </p>
        <p className="text-gray-500 text-sm">
          Please try refreshing the page or contact support if the problem persists.
        </p>
      </div>
    </div>
  );
}