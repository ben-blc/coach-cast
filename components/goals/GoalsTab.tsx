'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Target, 
  CheckCircle, 
  Circle, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  RefreshCw,
  AlertCircle,
  Mic,
  Clock,
  Loader2
} from 'lucide-react';
import { 
  getUserSessions, 
  getSessionGoals, 
  createSessionGoals, 
  updateSessionGoal, 
  deleteSessionGoal, 
  addSessionGoal,
  type CoachingSession,
  type CoachingSessionGoal 
} from '@/lib/database';
import { getConversationTranscript } from '@/lib/elevenlabs';
import { extractGoalsFromTranscript } from '@/lib/openai';
import { getCurrentUser } from '@/lib/auth';

interface SessionWithGoals extends CoachingSession {
  goals: CoachingSessionGoal[];
  coach_name?: string;
  coach_specialty?: string;
  goals_loading?: boolean;
  goals_error?: string;
}

export function GoalsTab() {
  const [sessions, setSessions] = useState<SessionWithGoals[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [newGoalText, setNewGoalText] = useState<{ [sessionId: string]: string }>({});
  const [extractingGoals, setExtractingGoals] = useState<{ [sessionId: string]: boolean }>({});

  useEffect(() => {
    loadSessionsWithGoals();
  }, []);

  const loadSessionsWithGoals = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const userSessions = await getUserSessions(user.id);
      
      // Load goals for each session
      const sessionsWithGoals: SessionWithGoals[] = await Promise.all(
        userSessions.map(async (session) => {
          const goals = await getSessionGoals(session.id);
          return {
            ...session,
            goals,
            coach_name: session.coaches?.name || 'Unknown Coach',
            coach_specialty: session.coaches?.specialty || 'General Coaching'
          };
        })
      );

      setSessions(sessionsWithGoals);
    } catch (error) {
      console.error('Error loading sessions with goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractGoalsForSession = async (session: SessionWithGoals) => {
    if (!session.conversation_id) {
      console.log('No conversation ID for session:', session.id);
      return;
    }

    setExtractingGoals(prev => ({ ...prev, [session.id]: true }));
    
    try {
      // Update session state to show loading
      setSessions(prev => prev.map(s => 
        s.id === session.id 
          ? { ...s, goals_loading: true, goals_error: undefined }
          : s
      ));

      // Get transcript from ElevenLabs
      const transcript = await getConversationTranscript(session.conversation_id);
      
      if (!transcript) {
        setSessions(prev => prev.map(s => 
          s.id === session.id 
            ? { ...s, goals_loading: false, goals_error: 'Transcript not available yet, please retry later.' }
            : s
        ));
        return;
      }

      // Extract goals using OpenAI
      const result = await extractGoalsFromTranscript(transcript);
      
      if (!result.success) {
        setSessions(prev => prev.map(s => 
          s.id === session.id 
            ? { ...s, goals_loading: false, goals_error: result.error || 'Failed to extract goals' }
            : s
        ));
        return;
      }

      if (result.goals.length === 0) {
        setSessions(prev => prev.map(s => 
          s.id === session.id 
            ? { ...s, goals_loading: false, goals_error: 'No goals found in the conversation transcript.' }
            : s
        ));
        return;
      }

      // Save goals to database
      const createdGoals = await createSessionGoals(session.id, result.goals);
      
      // Update session state with new goals
      setSessions(prev => prev.map(s => 
        s.id === session.id 
          ? { ...s, goals: createdGoals, goals_loading: false, goals_error: undefined }
          : s
      ));

    } catch (error) {
      console.error('Error extracting goals:', error);
      setSessions(prev => prev.map(s => 
        s.id === session.id 
          ? { ...s, goals_loading: false, goals_error: 'Failed to extract goals from transcript.' }
          : s
      ));
    } finally {
      setExtractingGoals(prev => ({ ...prev, [session.id]: false }));
    }
  };

  const toggleGoalCompletion = async (goal: CoachingSessionGoal) => {
    try {
      const updatedGoal = await updateSessionGoal(goal.id, {
        is_completed: !goal.is_completed
      });

      if (updatedGoal) {
        setSessions(prev => prev.map(session => ({
          ...session,
          goals: session.goals.map(g => 
            g.id === goal.id ? updatedGoal : g
          )
        })));
      }
    } catch (error) {
      console.error('Error updating goal completion:', error);
    }
  };

  const startEditingGoal = (goal: CoachingSessionGoal) => {
    setEditingGoal(goal.id);
    setEditingText(goal.goal_text);
  };

  const saveGoalEdit = async (goal: CoachingSessionGoal) => {
    if (editingText.trim() === '') return;

    try {
      const updatedGoal = await updateSessionGoal(goal.id, {
        goal_text: editingText.trim()
      });

      if (updatedGoal) {
        setSessions(prev => prev.map(session => ({
          ...session,
          goals: session.goals.map(g => 
            g.id === goal.id ? updatedGoal : g
          )
        })));
        setEditingGoal(null);
        setEditingText('');
      }
    } catch (error) {
      console.error('Error updating goal text:', error);
    }
  };

  const cancelGoalEdit = () => {
    setEditingGoal(null);
    setEditingText('');
  };

  const deleteGoal = async (goal: CoachingSessionGoal) => {
    try {
      const success = await deleteSessionGoal(goal.id);
      
      if (success) {
        setSessions(prev => prev.map(session => ({
          ...session,
          goals: session.goals.filter(g => g.id !== goal.id)
        })));
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const addNewGoal = async (sessionId: string) => {
    const goalText = newGoalText[sessionId]?.trim();
    if (!goalText) return;

    try {
      const newGoal = await addSessionGoal(sessionId, goalText);
      
      if (newGoal) {
        setSessions(prev => prev.map(session => 
          session.id === sessionId 
            ? { ...session, goals: [...session.goals, newGoal] }
            : session
        ));
        setNewGoalText(prev => ({ ...prev, [sessionId]: '' }));
      }
    } catch (error) {
      console.error('Error adding new goal:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionTypeDisplay = (type: string) => {
    switch (type) {
      case 'ai_specialist': return 'AI Specialist';
      case 'digital_chemistry': return 'Digital Chemistry';
      case 'human_voice_ai': return 'Human Voice AI';
      case 'live_human': return 'Live Human';
      default: return 'Coaching Session';
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'ai_specialist': return 'bg-blue-100 text-blue-800';
      case 'digital_chemistry': return 'bg-green-100 text-green-800';
      case 'human_voice_ai': return 'bg-purple-100 text-purple-800';
      case 'live_human': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your goals...</p>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Yet</h3>
        <p className="text-gray-600 mb-6">
          Start your first coaching session to begin tracking your goals.
        </p>
        <Button asChild>
          <a href="/coaching-studio">
            <Mic className="h-4 w-4 mr-2" />
            Start First Session
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Session Goals</h2>
          <p className="text-gray-600">Track and manage your coaching goals across all sessions</p>
        </div>
        <Button onClick={loadSessionsWithGoals} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-6">
        {sessions.map((session) => (
          <Card key={session.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{session.coach_name}</CardTitle>
                    <div className="flex items-center space-x-4 mt-1">
                      <Badge className={getSessionTypeColor(session.session_type)}>
                        {getSessionTypeDisplay(session.session_type)}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDuration(session.duration_seconds)}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(session.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {session.goals.length === 0 && session.conversation_id && (
                  <Button
                    onClick={() => extractGoalsForSession(session)}
                    disabled={extractingGoals[session.id] || session.goals_loading}
                    size="sm"
                    variant="outline"
                  >
                    {extractingGoals[session.id] || session.goals_loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 mr-2" />
                        Extract Goals
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {/* Goals Loading State */}
              {session.goals_loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Extracting goals from transcript...</p>
                  </div>
                </div>
              )}

              {/* Goals Error State */}
              {session.goals_error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{session.goals_error}</AlertDescription>
                </Alert>
              )}

              {/* Goals List */}
              {!session.goals_loading && session.goals.length > 0 && (
                <div className="space-y-3 mb-4">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Goals ({session.goals.filter(g => g.is_completed).length}/{session.goals.length} completed)
                  </h4>
                  
                  {session.goals.map((goal) => (
                    <div key={goal.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <button
                        onClick={() => toggleGoalCompletion(goal)}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {goal.is_completed ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                      
                      <div className="flex-1">
                        {editingGoal === goal.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="min-h-[60px]"
                              placeholder="Enter goal description..."
                            />
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => saveGoalEdit(goal)}
                                size="sm"
                                disabled={editingText.trim() === ''}
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                onClick={cancelGoalEdit}
                                size="sm"
                                variant="outline"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="group">
                            <p className={`text-sm ${goal.is_completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                              {goal.goal_text}
                            </p>
                            {goal.completed_at && (
                              <p className="text-xs text-green-600 mt-1">
                                Completed on {formatDate(goal.completed_at)}
                              </p>
                            )}
                            <div className="flex items-center space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                onClick={() => startEditingGoal(goal)}
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => deleteGoal(goal)}
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No Goals State */}
              {!session.goals_loading && session.goals.length === 0 && !session.goals_error && (
                <div className="text-center py-6 text-gray-500">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No goals found for this session</p>
                  {session.conversation_id ? (
                    <p className="text-xs mt-1">Click "Extract Goals" to analyze the transcript</p>
                  ) : (
                    <p className="text-xs mt-1">No transcript available for goal extraction</p>
                  )}
                </div>
              )}

              {/* Add New Goal */}
              <div className="border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Add a new goal for this session..."
                    value={newGoalText[session.id] || ''}
                    onChange={(e) => setNewGoalText(prev => ({ 
                      ...prev, 
                      [session.id]: e.target.value 
                    }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addNewGoal(session.id);
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => addNewGoal(session.id)}
                    disabled={!newGoalText[session.id]?.trim()}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Goal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}