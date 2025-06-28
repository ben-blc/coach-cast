'use client';

import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-light via-content-background to-brand-accent min-h-[85vh] flex items-center py-12">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-brand-secondary/20 rounded-full blur-xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-semantic-positive/20 rounded-full blur-xl animate-pulse-slow delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-semantic-warning/20 rounded-full blur-xl animate-pulse-slow delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Top badge */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2 bg-brand-primary/10 px-4 py-2 rounded-full border border-brand-primary/20">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <span className="text-sm font-medium text-brand-primary">Powered by AI, Guided by Humanity</span>
            </div>
          </div>
          
          {/* Main heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-content-dark mb-6 leading-tight max-w-4xl mx-auto">
            Unlock Your Full Potential with{' '}
            <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              Human Guidance & AI Innovation
            </span>
          </h1>
          
          {/* Hero Image - reduced to half size */}
          <div className="flex justify-center mb-6">
            <div className="relative w-32 h-32 lg:w-56 lg:h-56 flex items-center justify-center">
              <img 
                src="/Videochat.png" 
                alt="Video coaching session illustration" 
                className="w-full h-full object-contain animate-float"
              />
              
              {/* Floating elements around the image - scaled down proportionally */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-semantic-warning rounded-xl shadow-lg animate-float delay-300 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-semantic-positive rounded-xl shadow-lg animate-float delay-700 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
          
          {/* Description text */}
          <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
            At CoachBridge, it all starts with people. We believe that powerful human connections—the kind that 
            inspire, challenge, and transform—are the foundation of all meaningful growth. Our AI doesn't replace 
            the human touch; it amplifies it, ensuring that every interaction feels personal, insightful, and inspiring.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              asChild
            >
              <Link href="/auth?mode=signup">
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
              asChild
            >
              <Link href="#features">
                Watch Demo
              </Link>
            </Button>
          </div>

          {/* Three feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center mb-3 mx-auto">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                </div>
              </div>
              <h3 className="text-base font-semibold mb-2 text-content-dark">Human-Centric AI</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Experience the best of both worlds – the limitless potential of AI combined with 
                the nuanced understanding and ethical framework provided by human coaching principles.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-10 h-10 bg-semantic-positive rounded-xl flex items-center justify-center mb-3 mx-auto">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-semantic-positive rounded-full"></div>
                </div>
              </div>
              <h3 className="text-base font-semibold mb-2 text-content-dark">Always There for You</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Access coaching insights 24/7 through AI-powered digital twins, ensuring consistent 
                support that truly understands your journey, because it's built on human wisdom.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-10 h-10 bg-semantic-warning rounded-xl flex items-center justify-center mb-3 mx-auto">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-semantic-warning rounded-full"></div>
                </div>
              </div>
              <h3 className="text-base font-semibold mb-2 text-content-dark">Empathetic Technology</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Our AI coaches are designed not just for efficiency, but to support you with 
                understanding and encouragement, reflecting the "guided by humanity" ethos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}