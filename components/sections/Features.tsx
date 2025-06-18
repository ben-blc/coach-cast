'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Video, Calendar, BarChart3, Clock, Shield } from 'lucide-react';

const features = [
  {
    icon: Mic,
    title: 'AI Voice Coaching',
    description: 'Engage in natural conversations with AI coaches powered by ElevenLabs technology.',
    badge: 'AI Powered',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    icon: Video,
    title: 'Personalized Video Previews',
    description: 'Get customized video introductions from coaches using Tavus AI technology.',
    badge: 'Video AI',
    color: 'bg-green-100 text-green-600'
  },
  {
    icon: Calendar,
    title: 'Seamless Scheduling',
    description: 'Book coaching sessions easily with integrated Cal.com scheduling system.',
    badge: 'Integration',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Monitor your coaching journey with detailed analytics and goal tracking.',
    badge: 'Analytics',
    color: 'bg-orange-100 text-orange-600'
  },
  {
    icon: Clock,
    title: '24/7 Availability',
    description: 'Access AI coaching support anytime, anywhere, whenever you need guidance.',
    badge: 'Always On',
    color: 'bg-teal-100 text-teal-600'
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your coaching sessions and data are protected with enterprise-grade security.',
    badge: 'Security',
    color: 'bg-red-100 text-red-600'
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for{' '}
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Effective Coaching
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover powerful features that make coaching accessible, personalized, and transformative.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white hover:shadow-lg transition-shadow duration-300 border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.color}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}