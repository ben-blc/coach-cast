'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Video, Users, ArrowRight, Play, Sparkles } from 'lucide-react';
import Link from 'next/link';

const coachingOptions = [
  {
    id: 'ai_specialist',
    title: 'AI Specialist Coach',
    subtitle: 'Audio Coaching Experience',
    description: 'Choose from 4 specialized AI coaches trained in different areas',
    icon: Mic,
    color: 'bg-blue-100 text-blue-600',
    gradient: 'from-blue-500 to-blue-600',
    coaches: [
      { name: 'Career Coach', specialty: 'Professional Growth' },
      { name: 'Confidence Coach', specialty: 'Self-Esteem & Mindset' },
      { name: 'Wellness Coach', specialty: 'Health & Lifestyle' },
      { name: 'Relationship Coach', specialty: 'Communication & Bonds' }
    ]
  },
  {
    id: 'digital_chemistry',
    title: 'Digital Chemistry',
    subtitle: 'Interactive Video Previews',
    description: 'Experience personalized video previews from human coaches',
    icon: Video,
    color: 'bg-green-100 text-green-600',
    gradient: 'from-green-500 to-green-600',
    features: ['Personalized introductions', 'Coach matching', 'Interactive previews']
  },
  {
    id: 'human_voice_ai',
    title: 'Human Voice AI Clone',
    subtitle: 'Best of Both Worlds',
    description: 'Audio coaching with the voice of a real human coach like Natalie AI',
    icon: Users,
    color: 'bg-purple-100 text-purple-600',
    gradient: 'from-purple-500 to-purple-600',
    features: ['Human-like voices', 'Personality-matched', 'Real coach insights']
  }
];

export default function DiscoveryPage() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Badge className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Free 7-Minute Trial
            </Badge>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Discover Your Perfect{' '}
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Coaching Experience
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose your coaching journey. Each option offers a unique way to get personalized 
            guidance and support for your goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {coachingOptions.map((option) => (
            <Card 
              key={option.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                selectedOption === option.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
              }`}
              onClick={() => setSelectedOption(option.id)}
            >
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${option.color}`}>
                    <option.icon className="w-8 h-8" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  {option.title}
                </CardTitle>
                <p className="text-sm text-gray-600 font-medium">
                  {option.subtitle}
                </p>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-gray-600 mb-6 text-center">
                  {option.description}
                </p>

                {option.coaches && (
                  <div className="space-y-3">
                    {option.coaches.map((coach, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{coach.name}</p>
                          <p className="text-xs text-gray-600">{coach.specialty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {option.features && (
                  <div className="space-y-2">
                    {option.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Button 
                  className={`w-full mt-6 bg-gradient-to-r ${option.gradient} hover:opacity-90 text-white`}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle start session
                  }}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Free Session
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              New to Coach Cast?
            </h3>
            <p className="text-gray-600 mb-6">
              Get your first coaching session completely free. No credit card required, 
              no commitment needed. Experience the power of personalized coaching today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" size="lg" asChild>
                <Link href="/auth?mode=signup">
                  Create Free Account
                </Link>
              </Button>
              <Button size="lg" asChild>
                <Link href="/auth">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Sign In to Continue
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}