'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mic, 
  Video, 
  Users, 
  ArrowLeft, 
  Search,
  Filter,
  Star,
  Clock,
  Sparkles,
  DollarSign,
  ExternalLink
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getAICoaches, getUserSubscription } from '@/lib/database';
import { Navbar } from '@/components/sections/Navbar';
import { useUserSubscription } from '@/hooks/use-subscription';
import type { AICoach, Subscription } from '@/lib/database';

// Extended coach type to include all coach data
interface Coach extends AICoach {
  coach_type: 'ai' | 'human';
  session_types: string[];
  years_experience?: string;
  bio?: string;
}

type CoachFilter = 'all' | 'ai' | 'human';
type SessionFilter = 'all' | 'audio_ai' | 'video_ai' | 'human_coaching';

export default function CoachingStudioPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [filteredCoaches, setFilteredCoaches] = useState<Coach[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [coachFilter, setCoachFilter] = useState<CoachFilter>('all');
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>('all');
  const router = useRouter();
  const { activeSubscription } = useUserSubscription();

  useEffect(() => {
    async function loadData() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth');
          return;
        }

        const [coachData, userSubscription] = await Promise.all([
          getAICoaches(),
          getUserSubscription(user.id)
        ]);
        
        setCoaches(coachData as Coach[]);
        setSubscription(userSubscription);
      } catch (error) {
        console.error('Error loading coaching studio data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // Filter coaches based on search and filters
  useEffect(() => {
    let filtered = coaches;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(coach =>
        coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coach.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coach.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply coach type filter
    if (coachFilter !== 'all') {
      filtered = filtered.filter(coach => coach.coach_type === coachFilter);
    }

    // Apply session type filter
    if (sessionFilter !== 'all') {
      filtered = filtered.filter(coach => 
        coach.session_types && coach.session_types.includes(sessionFilter)
      );
    }

    setFilteredCoaches(filtered);
  }, [coaches, searchTerm, coachFilter, sessionFilter]);

  const formatPrice = (priceInDollars: number) => {
    return `$${priceInDollars.toLocaleString()}`;
  };

  const getAvailableSessionsText = (sessionTypes: string[]) => {
    const types = sessionTypes.map(type => {
      switch (type) {
        case 'audio_ai': return 'Audio AI';
        case 'video_ai': return 'Video AI';
        case 'human_coaching': return 'Live Coaching';
        default: return type;
      }
    });
    return types.join(', ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Coaching Studio...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push('/')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Badge className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                Coaching Studio
              </Badge>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Find Your Perfect{' '}
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Coaching Match
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from AI-powered coaches available 24/7 or connect with experienced human coaches 
              for personalized guidance and support.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Coach Type Filter */}
            <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">Coach Type:</span>
              <Tabs value={coachFilter} onValueChange={(value) => setCoachFilter(value as CoachFilter)}>
                <TabsList className="bg-gray-50">
                  <TabsTrigger value="all">All Coaches</TabsTrigger>
                  <TabsTrigger value="ai">AI Coaches</TabsTrigger>
                  <TabsTrigger value="human">Human Coaches</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {/* Session Type Filter */}
            <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">Session Type:</span>
              <Tabs value={sessionFilter} onValueChange={(value) => setSessionFilter(value as SessionFilter)}>
                <TabsList className="bg-gray-50">
                  <TabsTrigger value="all">All Sessions</TabsTrigger>
                  <TabsTrigger value="audio_ai">Audio AI</TabsTrigger>
                  <TabsTrigger value="video_ai">Video AI</TabsTrigger>
                  <TabsTrigger value="human_coaching">Live Coaching</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Active Filters Display */}
          {(coachFilter !== 'all' || sessionFilter !== 'all') && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Active filters:</span>
              {coachFilter !== 'all' && (
                <Badge variant="outline">Coach: {coachFilter}</Badge>
              )}
              {sessionFilter !== 'all' && (
                <Badge variant="outline">Session: {sessionFilter.replace('_', ' ')}</Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setCoachFilter('all');
                  setSessionFilter('all');
                }}
                className="text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredCoaches.length} of {coaches.length} coaches
          </p>
        </div>

        {/* Coaches Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredCoaches.map((coach) => (
            <Card key={coach.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-blue-400 to-green-600 flex items-center justify-center">
                      {coach.avatar_url ? (
                        <img 
                          src={coach.avatar_url} 
                          alt={coach.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-xl">
                          {coach.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{coach.name}</CardTitle>
                      <Badge 
                        variant={coach.coach_type === 'human' ? 'default' : 'secondary'} 
                        className="mt-1"
                      >
                        {coach.coach_type === 'human' ? 'Human Coach' : 'AI Coach'}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">{coach.specialty}</p>
                      {/* Updated: Use flex-row with gap-3 for even spacing */}
                      <div className="flex flex-row items-center gap-3 mt-2">
                        {coach.years_experience && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500">{coach.years_experience} years</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-500">5</span>
                        </div>
                        {coach.hourly_rate && coach.hourly_rate > 0 && coach.coach_type === 'human' && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs font-medium text-green-600">
                              {formatPrice(coach.hourly_rate)}/hr
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div
                  className="min-h-[3.75em] max-h-[3.75em] flex items-start"
                  style={{
                    minHeight: '3.75em',
                    maxHeight: '3.75em',
                  }}
                >
                  <p
                    className="text-gray-600 text-sm line-clamp-3 w-full"
                    style={{
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {coach.bio || coach.description}
                  </p>
                </div>

                {/* Available Sessions Summary */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 text-sm mb-1">Available Sessions:</h4>
                  <p className="text-xs text-gray-600">
                    {getAvailableSessionsText(coach.session_types || [])}
                  </p>
                </div>

                {/* Call to Action */}
                <Button
                  onClick={() => router.push(`/coach/${coach.id}`)}
                  className="w-full bg-black hover:bg-gray-800 text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Explore Coach
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredCoaches.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No coaches found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters to find the perfect coach for you.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setCoachFilter('all');
                setSessionFilter('all');
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}