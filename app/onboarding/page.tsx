'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Video, Users, Play, Sparkles, ArrowRight } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getAICoaches, getHumanCoaches, completeOnboarding } from '@/lib/database';
import type { AICoach, HumanCoach } from '@/lib/database';

const sessionOptions = [
  {
    id: 'ai_specialist',
    title: 'Try a Specialist AI Coach',
    subtitle: 'Instant Voice Coaching',
    description: 'Get immediate coaching from specialized AI agents trained in different areas',
    icon: Mic,
    color: 'bg-blue-100 text-blue-600',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    id: 'digital_chemistry',
    title: 'Experience Digital Chemistry',
    subtitle: 'Interactive Video Previews',
    description: 'See personalized video previews from human coaches to find your match',
    icon: Video,
    color: 'bg-green-100 text-green-600',
    gradient: 'from-green-500 to-green-600',
  },
  {
    id: 'human_voice_ai',
    title: 'Try a Human\'s Voice AI',
    subtitle: 'Best of Both Worlds',
    description: 'Audio coaching with the voice of a real human coach',
    icon: Users,
    color: 'bg-purple-100 text-purple-600',
    gradient: 'from-purple-500 to-purple-600',
  }
];

export default function OnboardingPage() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [aiCoaches, setAICoaches] = useState<AICoach[]>([]);
  const [humanCoaches, setHumanCoaches] = useState<HumanCoach[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth');
          return;
        }

        const [coaches, humans] = await Promise.all([
          getAICoaches(),
          getHumanCoaches()
        ]);

        setAICoaches(coaches);
        setHumanCoaches(humans);
      } catch (error) {
        console.error('Error loading onboarding data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleStartSession = async (optionId: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Complete onboarding
      await completeOnboarding(user.id);

      // Redirect to session based on option
      if (optionId === 'ai_specialist') {
        router.push('/session/ai-specialist');
      } else if (optionId === 'digital_chemistry') {
        router.push('/session/digital-chemistry');
      } else if (optionId === 'human_voice_ai') {
        router.push('/session/human-voice-ai');
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your coaching options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Badge className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Welcome to Coach Cast!
            </Badge>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Choose Your First{' '}
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Coaching Experience
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            You have 7 minutes of free coaching to explore our platform. 
            Choose how you'd like to start your journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {sessionOptions.map((option) => (
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

                {option.id === 'ai_specialist' && (
                  <div className="space-y-3 mb-6">
                    {aiCoaches.slice(0, 3).map((coach) => (
                      <div key={coach.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{coach.name}</p>
                          <p className="text-xs text-gray-600">{coach.specialty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {option.id === 'digital_chemistry' && (
                  <div className="space-y-3 mb-6">
                    {humanCoaches.map((coach) => (
                      <div key={coach.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0"></div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{coach.name}</p>
                          <p className="text-xs text-gray-600">{coach.specialty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {option.id === 'human_voice_ai' && (
                  <div className="space-y-3 mb-6">
                    {humanCoaches.map((coach) => (
                      <div key={coach.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{coach.name} AI</p>
                          <p className="text-xs text-gray-600">Voice clone of {coach.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button 
                  className={`w-full bg-gradient-to-r ${option.gradient} hover:opacity-90 text-white`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartSession(option.id);
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
              Ready to Begin?
            </h3>
            <p className="text-gray-600 mb-6">
              Your 7-minute free trial starts as soon as you choose an option above. 
              No credit card required, and you can try different coaching styles anytime.
            </p>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Skip to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}