'use client';

import { PricingSimple } from '@/components/sections/PricingSimple';
import { Navbar } from '@/components/sections/Navbar';
import { Footer } from '@/components/sections/Footer';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      <main>
        <PricingSimple />
      </main>
      <Footer />
    </div>
  );
}