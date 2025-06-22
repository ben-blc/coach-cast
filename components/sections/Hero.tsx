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
              <span className="text-sm font-medium text-blue-800">Powered by AI, Guided by Humanity</span>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Unlock Your Full Potential with{' '}
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Human Guidance & AI Innovation
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto">
            At CoachCast, we bridge the gap between cutting-edge technology and profound human connection. 
            Our unique platform offers you unparalleled access to personalized coaching that fits your life and your goals. 
            Whether you seek the deep empathy of a human coach, the continuous availability of an AI digital twin, 
            or the specialized wisdom of a CoachCast AI, you'll find guidance that resonates and empowers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700" asChild>
              <Link href="/discovery">
                <Play className="w-5 h-5 mr-2" />
                Start Your Journey
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/demo">
                <Users className="w-5 h-5 mr-2" />
                Watch Demo
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Human-Centric AI</h3>
              <p className="text-gray-600 text-sm">
                Experience the best of both worlds – the limitless potential of AI combined with 
                the nuanced understanding and ethical framework provided by human coaching principles.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Play className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Always There for You</h3>
              <p className="text-gray-600 text-sm">
                Access coaching insights 24/7 through AI-powered digital twins, ensuring consistent 
                support that truly understands your journey, because it's built on human wisdom.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Empathetic Technology</h3>
              <p className="text-gray-600 text-sm">
                Our AI coaches are designed not just for efficiency, but to support you with 
                understanding and encouragement, reflecting the "guided by humanity" ethos.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-lg text-gray-700 italic max-w-3xl mx-auto mb-6">
              "The future belongs to those who can imagine it, design it, and execute it. 
              It isn't something you await, but rather create."
            </p>
            <p className="text-sm text-gray-500">— Sheikh Mohammed bin Rashid Al Maktoum</p>
          </div>
        </div>
      </div>
    </section>
  );
}