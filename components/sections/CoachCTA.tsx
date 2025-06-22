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
            Are you a Coach? Amplify Your Impact
          </h2>
          <p className="text-xl text-blue-100 max-w-4xl mx-auto">
            CoachCast is your partner in expanding your reach and deepening your impact. 
            We empower you to leverage the immense power of AI, not to replace your expertise, 
            but to augment it. By creating your digital twin, you extend your guidance beyond 
            traditional limits, knowing that your unique coaching philosophy remains the guiding force. 
            This is coaching reimagined: <strong>Powered by AI, Guided by your Humanity.</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Extend Your Human Touch</h3>
              <p className="text-blue-100 text-sm">
                Your AI Digital Twin embodies your unique coaching style and knowledge, 
                allowing your expertise to be accessible 24/7 without burning you out. 
                Your humanity guides the AI.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ethical AI Integration</h3>
              <p className="text-blue-100 text-sm">
                We provide tools that ensure your AI coaching is aligned with your professional 
                standards and values, upholding the 'guided by humanity' principle.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Focus on What Matters</h3>
              <p className="text-blue-100 text-sm">
                Let AI handle scheduling, initial queries, and consistent support, 
                freeing you to focus on the deep, transformative human connections 
                that only you can provide.
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
              Embrace the Future of Coaching
            </Link>
          </Button>
          <p className="text-blue-100 mt-4 text-sm">
            Partner with CoachCast and let your humanity guide the power of AI
          </p>
        </div>
      </div>
    </section>
  );
}