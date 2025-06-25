'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Calendar,
  Download,
  MoreHorizontal,
  Play,
  Clock,
  CheckCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SessionManagerProps {
  sessions: CoachingSession[];
  onSessionSelect: (session: CoachingSession) => void;
}

export function SessionManager({ sessions, onSessionSelect }: SessionManagerProps) {
  const [filteredSessions, setFilteredSessions] = useState(sessions);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'active'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'coach'>('date');

  useEffect(() => {
    let filtered = sessions;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.coaches?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.session_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(session => session.status === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'duration':
          return b.duration_seconds - a.duration_seconds;
        case 'coach':
          return (a.coaches?.name || '').localeCompare(b.coaches?.name || '');
        default:
          return 0;
      }
    });

    setFilteredSessions(filtered);
  }, [sessions, searchTerm, filterStatus, sortBy]);

  const exportSessions = () => {
    const csvContent = [
      ['Date', 'Coach', 'Type', 'Duration', 'Credits', 'Status'],
      ...filteredSessions.map(session => [
        new Date(session.created_at).toLocaleDateString(),
        session.coaches?.name || 'Unknown',
        session.session_type,
        `${Math.floor(session.duration_seconds / 60)}:${(session.duration_seconds % 60).toString().padStart(2, '0')}`,
        session.credits_used.toString(),
        session.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'coaching-sessions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex-1 flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                All Sessions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('completed')}>
                Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('active')}>
                Active
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button onClick={exportSessions} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {filteredSessions.map((session) => (
          <Card key={session.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    {session.session_type === 'ai_specialist' ? (
                      <Play className="w-6 h-6 text-blue-600" />
                    ) : (
                      <Calendar className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg">{session.coaches?.name || 'Unknown Coach'}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary">
                        {session.session_type.replace('_', ' ')}
                      </Badge>
                      <Badge 
                        variant={session.status === 'completed' ? 'default' : 'outline'}
                        className={session.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {session.status === 'completed' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {new Date(session.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-medium">
                    {Math.floor(session.duration_seconds / 60)}:{(session.duration_seconds % 60).toString().padStart(2, '0')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session.credits_used} credits
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onSessionSelect(session)}>
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Download Transcript
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Share Session
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSessions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No sessions found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}