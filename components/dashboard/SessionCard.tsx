'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mic, Video, Users, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface SessionCardProps {
  session: {
    id: string;
    type: string;
    coach: string;
    date: string;
    duration: number;
    summary: string;
    goals: string[];
  };
  detailed?: boolean;
}

export function SessionCard({ session, detailed = false }: SessionCardProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'AI Specialist':
        return <Mic className="h-4 w-4" />;
      case 'Human Coach':
        return <Users className="h-4 w-4" />;
      case 'Video Preview':
        return <Video className="h-4 w-4" />;
      default:
        return <Mic className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'AI Specialist':
        return 'bg-blue-100 text-blue-800';
      case 'Human Coach':
        return 'bg-green-100 text-green-800';
      case 'Video Preview':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getTypeColor(session.type).replace('text-', 'bg-').replace('800', '100')}`}>
              {getIcon(session.type)}
            </div>
            <div>
              <CardTitle className="text-lg">{session.coach}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getTypeColor(session.type)}>
                  {session.type}
                </Badge>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-3 w-3 mr-1" />
                  {session.duration} min
                </div>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {formatDateTime(session.date)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-gray-700 mb-4">{session.summary}</p>
        
        {session.goals.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium text-gray-900">Goals:</h4>
            <ul className="space-y-1">
              {session.goals.map((goal, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                  {goal}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex items-center space-x-2 pt-4 border-t">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/session-detail?id=${session.id}`}>
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}