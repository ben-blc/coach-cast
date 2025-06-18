'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Calendar, Play, MessageCircle } from 'lucide-react';

interface CoachCardProps {
  coach: {
    id: string;
    name: string;
    specialty: string;
    rating: number;
    sessions: number;
    price: number;
    avatar: string;
  };
}

export function CoachCard({ coach }: CoachCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={coach.avatar} alt={coach.name} />
            <AvatarFallback>{coach.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">{coach.name}</CardTitle>
            <Badge variant="secondary" className="mt-1">
              {coach.specialty}
            </Badge>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                {coach.rating}
              </div>
              <div>{coach.sessions} sessions</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">${coach.price}</div>
            <div className="text-sm text-gray-600">per session</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="flex items-center">
            <Play className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Book Session
          </Button>
        </div>
        <Button variant="ghost" className="w-full mt-2 flex items-center">
          <MessageCircle className="h-4 w-4 mr-2" />
          Send Message
        </Button>
      </CardContent>
    </Card>
  );
}