'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Target, Edit, Trash2 } from 'lucide-react';

interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    progress: number;
    dueDate: string;
    status: 'in_progress' | 'completed' | 'overdue';
  };
}

export function GoalCard({ goal }: GoalCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'overdue':
        return 'Overdue';
      default:
        return 'In Progress';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{goal.title}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getStatusColor(goal.status)}>
                  {getStatusText(goal.status)}
                </Badge>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(goal.dueDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm">
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{goal.progress}%</span>
            </div>
            <Progress value={goal.progress} className="h-2" />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="flex-1">
              Update Progress
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              Add Note
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}