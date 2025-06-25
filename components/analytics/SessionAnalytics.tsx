'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Calendar,
  Users,
  Zap
} from 'lucide-react';

interface SessionAnalyticsProps {
  userId: string;
}

interface AnalyticsData {
  totalSessions: number;
  totalMinutes: number;
  creditsUsed: number;
  goalsCompleted: number;
  averageSessionLength: number;
  weeklyTrend: number;
  favoriteCoachType: 'ai' | 'human';
  streakDays: number;
}

export function SessionAnalytics({ userId }: SessionAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated analytics data - replace with real API call
    const fetchAnalytics = async () => {
      try {
        // This would be a real API call to get analytics
        const mockData: AnalyticsData = {
          totalSessions: 24,
          totalMinutes: 480,
          creditsUsed: 156,
          goalsCompleted: 18,
          averageSessionLength: 20,
          weeklyTrend: 15,
          favoriteCoachType: 'ai',
          streakDays: 7
        };
        
        setAnalytics(mockData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const progressPercentage = (analytics.goalsCompleted / (analytics.totalSessions * 2)) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.totalSessions}</div>
          <p className="text-xs text-muted-foreground">
            <span className="inline-flex items-center text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{analytics.weeklyTrend}%
            </span>{' '}
            from last week
          </p>
        </CardContent>
      </Card>

      {/* Time Invested */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Time Invested</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.floor(analytics.totalMinutes / 60)}h {analytics.totalMinutes % 60}m</div>
          <p className="text-xs text-muted-foreground">
            Avg {analytics.averageSessionLength} min per session
          </p>
        </CardContent>
      </Card>

      {/* Goals Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Goals Completed</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.goalsCompleted}</div>
          <Progress value={progressPercentage} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(progressPercentage)}% completion rate
          </p>
        </CardContent>
      </Card>

      {/* Streak */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.streakDays} days</div>
          <div className="flex items-center mt-2">
            <Badge variant={analytics.favoriteCoachType === 'ai' ? 'default' : 'secondary'}>
              Prefers {analytics.favoriteCoachType.toUpperCase()} coaching
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}