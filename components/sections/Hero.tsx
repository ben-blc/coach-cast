'use client';

import { Button } from '@/components/ui/button';
import { Play, Sparkles, Users, Zap } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2 bg-blue-100 px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">AI + Human Coaching</span>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Transform Your Life with{' '}
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Personalized Coaching
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Experience the perfect blend of AI-powered insights and human expertise. 
            Get instant coaching support 24/7 with our AI specialists, or connect with 
            certified human coaches for deeper transformation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700" asChild>
              <Link href="/discovery">
                <Play className="w-5 h-5 mr-2" />
                Start Free Trial
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/demo">
                <Users className="w-5 h-5 mr-2" />
                Watch Demo
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Specialist Coaches</h3>
              <p className="text-gray-600 text-sm">
                Get instant coaching from specialized AI agents trained in career, confidence, 
                and personal development.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Play className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Digital Chemistry</h3>
              <p className="text-gray-600 text-sm">
                Experience personalized video previews from human coaches to find 
                your perfect coaching match.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Live Human Coaching</h3>
              <p className="text-gray-600 text-sm">
                Book one-on-one sessions with certified human coaches for deep, 
                personalized transformation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}