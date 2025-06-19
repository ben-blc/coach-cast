'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, ArrowRight, Mic, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export function CoachCTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Are You a Coach?
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Transform your coaching practice with AI technology. Create your digital twin, 
            serve clients 24/7, and grow your business like never before.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Voice Clone</h3>
              <p className="text-blue-100 text-sm">
                Create an AI version of your voice to serve clients around the clock
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Client Management</h3>
              <p className="text-blue-100 text-sm">
                Integrated scheduling, payments, and client relationship tools
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Revenue Growth</h3>
              <p className="text-blue-100 text-sm">
                Earn from both live sessions and AI clone usage with transparent pricing
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4"
            asChild
          >
            <Link href="/coaches">
              <ArrowRight className="w-5 h-5 mr-2" />
              Join as a Coach
            </Link>
          </Button>
          <p className="text-blue-100 mt-4 text-sm">
            Start with CoachCast Pro at $79/month
          </p>
        </div>
      </div>
    </section>
  );
}