'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Calendar, 
  Mic, 
  Video, 
  Clock, 
  Target, 
  Users, 
  Play,
  Plus,
  Settings,
  Bell,
  Award
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SessionCard } from '@/components/dashboard/SessionCard';
import { CoachCard } from '@/components/dashboard/CoachCard';
import { GoalCard } from '@/components/dashboard/GoalCard';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState({
    name: 'Alex Johnson',
    email: 'alex@example.com',
    plan: 'Coaching Starter',
    creditsRemaining: 156,
    totalCredits: 250
  });

  const recentSessions = [
    {
      id: '1',
      type: 'AI Specialist',
      coach: 'Career Coach',
      date: '2024-01-15',
      duration: 25,
      summary: 'Discussed career transition strategies and networking approaches.',
      goals: ['Update LinkedIn profile', 'Apply to 5 jobs this week']
    },
    {
      id: '2',
      type: 'Human Coach',
      coach: 'Sarah Thompson',
      date: '2024-01-12',
      duration: 45,
      summary: 'Deep dive into confidence building and public speaking techniques.',
      goals: ['Practice elevator pitch', 'Join Toastmasters club']
    }
  ];

  const availableCoaches = [
    {
      id: '1',
      name: 'Dr. Michael Chen',
      specialty: 'Executive Leadership',
      rating: 4.9,
      sessions: 127,
      price: 150,
      avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
    },
    {
      id: '2',
      name: 'Sarah Thompson',
      specialty: 'Confidence & Mindset',
      rating: 4.8,
      sessions: 89,
      price: 120,
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
    }
  ];

  const goals = [
    {
      id: '1',
      title: 'Land New Job',
      progress: 75,
      dueDate: '2024-02-15',
      status: 'in_progress' as const
    },
    {
      id: '2',
      title: 'Build Public Speaking Skills',
      progress: 40,
      dueDate: '2024-03-01',
      status: 'in_progress' as const
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Continue your coaching journey and achieve your goals.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-1/2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="coaches">Coaches</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.creditsRemaining}</div>
                  <p className="text-xs text-muted-foreground">
                    of {user.totalCredits} total credits
                  </p>
                  <Progress 
                    value={(user.creditsRemaining / user.totalCredits) * 100} 
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sessions This Month</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">
                    +2 from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">
                    2 in progress, 1 completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                  <p className="text-xs text-muted-foreground">
                    Next: Tomorrow 2:00 PM
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="h-20 flex flex-col items-center justify-center space-y-2">
                    <Mic className="h-6 w-6" />
                    <span>Start AI Session</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                    <Users className="h-6 w-6" />
                    <span>Book Human Coach</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                    <Video className="h-6 w-6" />
                    <span>Watch Coach Previews</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Sessions</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Session
              </Button>
            </div>
            
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <SessionCard key={session.id} session={session} detailed />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="coaches" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Available Coaches</h2>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableCoaches.map((coach) => (
                <CoachCard key={coach.id} coach={coach} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Goals</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}