'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Play, ArrowLeft, Star, Calendar } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getHumanCoaches, createCoachingSession, updateCoachingSession } from '@/lib/database';
import type { HumanCoach } from '@/lib/database';

export default function DigitalChemistryPage() {
  const [humanCoaches, setHumanCoaches] = useState<HumanCoach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<HumanCoach | null>(null);
  const [showingPreview, setShowingPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadCoaches() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth');
          return;
        }

        const coaches = await getHumanCoaches();
        setHumanCoaches(coaches);
      } catch (error) {
        console.error('Error loading human coaches:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCoaches();
  }, [router]);

  const startPreview = async (coach: HumanCoach) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Create a session record for the preview
      const session = await createCoachingSession({
        user_id: user.id,
        session_type: 'digital_chemistry',
        human_coach_id: coach.id,
        status: 'active'
      });

      if (session) {
        setSelectedCoach(coach);
        setShowingPreview(true);
        
        // Simulate preview completion after 2 minutes
        setTimeout(async () => {
          await updateCoachingSession(session.id, {
            duration_seconds: 120,
            status: 'completed',
            completed_at: new Date().toISOString(),
            summary: `Watched personalized video preview from ${coach.name}.`,
          });
          
          setShowingPreview(false);
          router.push('/dashboard?tab=sessions');
        }, 120000); // 2 minutes
      }
    } catch (error) {
      console.error('Error starting preview:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading coaches...</p>
        </div>
      </div>
    );
  }

  if (showingPreview && selectedCoach) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <Badge className="bg-green-100 text-green-800 mb-4">
              <Video className="w-4 h-4 mr-2" />
              Video Preview
            </Badge>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Meet {selectedCoach.name}
            </h1>
            <p className="text-gray-600">{selectedCoach.specialty}</p>
          </div>

          <Card className="max-w-3xl mx-auto">
            <CardContent className="p-8">
              <div className="aspect-video bg-gray-900 rounded-lg mb-6 flex items-center justify-center">
                <div className="text-center text-white">
                  <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Personalized Video Preview</p>
                  <p className="text-sm opacity-75">
                    This is where the Tavus AI-generated personalized video would play,
                    featuring {selectedCoach.name} speaking directly to you by name.
                  </p>
                </div>
              </div>

              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Hi there! I'm {selectedCoach.name}
                </h3>
                <p className="text-gray-600">
                  {selectedCoach.bio || `I specialize in ${selectedCoach.specialty} and I'm excited to potentially work with you on your coaching journey.`}
                </p>

                <div className="flex justify-center space-x-6 py-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="font-medium">4.9</span>
                    </div>
                    <p className="text-xs text-gray-600">Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">${(selectedCoach.hourly_rate || 15000) / 100}</p>
                    <p className="text-xs text-gray-600">per session</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">50+</p>
                    <p className="text-xs text-gray-600">sessions</p>
                  </div>
                </div>

                <div className="flex justify-center space-x-4 pt-4">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Session
                  </Button>
                  <Button variant="outline">
                    View Full Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Experience Digital Chemistry
          </h1>
          <p className="text-xl text-gray-600">
            Watch personalized video previews from our human coaches to find your perfect match.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {humanCoaches.map((coach) => (
            <Card key={coach.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-xl">
                    {coach.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{coach.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">{coach.specialty}</Badge>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        4.9
                      </div>
                      <div>50+ sessions</div>
                      <div>${(coach.hourly_rate || 15000) / 100}/session</div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm">
                  {coach.bio || `Experienced ${coach.specialty.toLowerCase()} coach dedicated to helping clients achieve their goals through personalized guidance and support.`}
                </p>

                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-800 font-medium text-sm mb-1">
                    Personalized Video Preview
                  </p>
                  <p className="text-green-700 text-xs">
                    Get a custom video introduction where {coach.name} speaks directly to you by name
                  </p>
                </div>

                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => startPreview(coach)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Watch Preview
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}