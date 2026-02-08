import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTrip } from '@/contexts/TripContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Trophy, 
  Plus,
  Calendar,
  Crown,
  Lock,
  Unlock,
  Play,
  Users,
  Swords,
  Zap,
  ChevronRight,
  Info,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { CaptainFixtureManager } from '@/components/fixtures/CaptainFixtureManager';
import { GameFormat, ScoringType } from '@/types/golf';

// Status types for a golf day
 type DayStatus = 'draft' | 'pairing' | 'ready' | 'playing' | 'completed';

interface GolfDay {
  id: string;
  name: string;
  date: string;
  courseName: string;
  gameFormat: GameFormat;
  scoringType: ScoringType;
  status: DayStatus;
  teamALockedIn: boolean;
  teamBLockedIn: boolean;
  matchesCount: number;
  completedMatches: number;
}

export default function Sessions() {
  const navigate = useNavigate();
  const { games, players, teams, fixtureDays } = useTrip();
  const [mode, setMode] = useState<'list' | 'quick' | 'organized'>('list');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [captainViewOpen, setCaptainViewOpen] = useState(false);
  const [captainTeam, setCaptainTeam] = useState<'team-a' | 'team-b'>('team-a');

  // Convert fixtureDays to GolfDays with status
  const golfDays: GolfDay[] = fixtureDays.map(fd => {
    const matchesInDay = fd.matches?.length || 0;
    const completedMatches = games.filter(g => 
      g.id.includes(fd.id) && g.completed
    ).length;
    
    let status: DayStatus = 'draft';
    if (fd.teamALockedIn && fd.teamBLockedIn) {
      status = completedMatches > 0 ? 'playing' : 'ready';
      if (completedMatches === matchesInDay && matchesInDay > 0) {
        status = 'completed';
      }
    } else if (fd.teamALockedIn || fd.teamBLockedIn) {
      status = 'pairing';
    }

    return {
      id: fd.id,
      name: fd.courseName || `Day ${fd.dayNumber}`,
      date: fd.date,
      courseName: fd.courseName || '',
      gameFormat: fd.gameFormat,
      scoringType: fd.scoringType,
      status,
      teamALockedIn: fd.teamALockedIn,
      teamBLockedIn: fd.teamBLockedIn,
      matchesCount: matchesInDay,
      completedMatches,
    };
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getStatusConfig = (status: DayStatus) => {
    switch (status) {
      case 'draft':
        return { 
          label: 'Setup', 
          color: 'bg-muted text-muted-foreground',
          icon: Clock,
          action: 'Setup Matches',
          description: 'Captains need to set pairings'
        };
      case 'pairing':
        return { 
          label: 'Pairing', 
          color: 'bg-warning/20 text-warning border-warning',
          icon: Users,
          action: 'Continue Setup',
          description: 'One captain done, waiting for other'
        };
      case 'ready':
        return { 
          label: 'Ready', 
          color: 'bg-success/20 text-success border-success',
          icon: CheckCircle2,
          action: 'Start Playing',
          description: 'All set! Ready to play'
        };
      case 'playing':
        return { 
          label: 'In Progress', 
          color: 'bg-primary/20 text-primary border-primary',
          icon: Play,
          action: 'Continue',
          description: 'Games in progress'
        };
      case 'completed':
        return { 
          label: 'Complete', 
          color: 'bg-accent/20 text-accent border-accent',
          icon: Trophy,
          action: 'View Results',
          description: 'All matches completed'
        };
    }
  };

  const handleQuickPlay = () => {
    // Navigate to play with quick game mode
    navigate('/play', { state: { mode: 'quick' } });
  };

  const handleSetupMatches = (dayId: string) => {
    setSelectedDay(dayId);
    setCaptainViewOpen(true);
  };

  const handleCreateDay = () => {
    setShowCreateDialog(true);
  };

  const teamA = teams.find(t => t.id === 'team-a');
  const teamB = teams.find(t => t.id === 'team-b');
  const selectedDayData = fixtureDays.find(fd => fd.id === selectedDay);

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 md:mb-8 animate-fade-up">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
              Golf Days
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {golfDays.length > 0 
                ? `${golfDays.length} day${golfDays.length > 1 ? 's' : ''} scheduled`
                : 'Create your first golf day to get started'
              }
            </p>
          </div>
          <Button variant="hero" size="sm" className="sm:h-11 sm:px-6" onClick={handleCreateDay}>
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">New Golf Day</span>
            <span className="sm:hidden">New Day</span>
          </Button>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 md:mb-8 animate-fade-up">
          {/* Quick Play Card */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50 group"
            onClick={handleQuickPlay}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-warning/20 flex items-center justify-center shrink-0 group-hover:bg-warning/30 transition-colors">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-base sm:text-lg mb-1">Quick Play</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                    Start playing immediately with casual matches. No setup needed.
                  </p>
                  <div className="flex items-center text-xs sm:text-sm text-primary font-medium">
                    Play Now
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organized Day Card */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50 group"
            onClick={handleCreateDay}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-base sm:text-lg mb-1">Organized Day</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                    Full competition setup with captains, pairings, and structured matches.
                  </p>
                  <div className="flex items-center text-xs sm:text-sm text-primary font-medium">
                    Create Day
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        {golfDays.length === 0 && (
          <Card className="mb-6 border-accent/50 bg-accent/5 animate-fade-up">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base">How Golf Days Work</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                    Each day represents one session of your competition:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-[10px] sm:text-xs font-medium">1</div>
                      <span className="text-muted-foreground">Create a day (select course, format, date)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-[10px] sm:text-xs font-medium">2</div>
                      <span className="text-muted-foreground">Captains set player pairings</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-[10px] sm:text-xs font-medium">3</div>
                      <span className="text-muted-foreground">Both captains lock in selections</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-[10px] sm:text-xs font-medium">4</div>
                      <span className="text-muted-foreground">Start playing and scoring!</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Golf Days List */}
        {golfDays.length > 0 && (
          <div className="space-y-3 sm:space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground">
                Your Golf Days
              </h2>
              <Badge variant="outline" className="text-xs sm:text-sm">
                {golfDays.filter(d => d.status === 'ready' || d.status === 'playing').length} active
              </Badge>
            </div>

            <div className="space-y-3">
              {golfDays.map((day, index) => {
                const statusConfig = getStatusConfig(day.status);
                const StatusIcon = statusConfig.icon;
                const progress = day.matchesCount > 0 
                  ? (day.completedMatches / day.matchesCount) * 100 
                  : 0;

                return (
                  <Card 
                    key={day.id} 
                    className="overflow-hidden hover:shadow-md transition-shadow"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-0">
                      <div className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                          {/* Day Number & Info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <span className="font-bold text-foreground text-sm sm:text-base">{index + 1}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                                {day.name}
                              </h3>
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span>{new Date(day.date).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="capitalize">{day.gameFormat.replace('-', ' ')}</span>
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center gap-2 sm:gap-3 sm:ml-auto">
                            <Badge 
                              variant="outline" 
                              className={`${statusConfig.color} border text-xs sm:text-sm whitespace-nowrap`}
                            >
                              <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
                              <span className="hidden sm:inline">{statusConfig.label}</span>
                              <span className="sm:hidden">{statusConfig.label.slice(0, 4)}</span>
                            </Badge>

                            {/* Action Button */}
                            {day.status === 'ready' && (
                              <Button 
                                size="sm" 
                                onClick={() => navigate('/play')}
                                className="text-xs sm:text-sm whitespace-nowrap"
                              >
                                <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                Play
                              </Button>
                            )}
                            {day.status === 'playing' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate('/play')}
                                className="text-xs sm:text-sm whitespace-nowrap"
                              >
                                Continue
                              </Button>
                            )}
                            {(day.status === 'draft' || day.status === 'pairing') && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleSetupMatches(day.id)}
                                className="text-xs sm:text-sm whitespace-nowrap"
                              >
                                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                <span className="hidden sm:inline">Setup</span>
                                <span className="sm:hidden">Set</span>
                              </Button>
                            )}
                            {day.status === 'completed' && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => navigate('/play')}
                                className="text-xs sm:text-sm"
                              >
                                View
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar (if playing or completed) */}
                        {(day.status === 'playing' || day.status === 'completed') && day.matchesCount > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{day.completedMatches}/{day.matchesCount} matches</span>
                            </div>
                            <Progress value={progress} className="h-1.5 sm:h-2" />
                          </div>
                        )}

                        {/* Setup Progress (if draft/pairing) */}
                        {(day.status === 'draft' || day.status === 'pairing') && (
                          <div className="mt-3 pt-3 border-t flex items-center gap-3 text-xs sm:text-sm">
                            <div className="flex items-center gap-1">
                              {day.teamALockedIn ? (
                                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                              )}
                              <span className={day.teamALockedIn ? 'text-success' : 'text-muted-foreground'}>
                                {teamA?.name || 'Team A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {day.teamBLockedIn ? (
                                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                              )}
                              <span className={day.teamBLockedIn ? 'text-success' : 'text-muted-foreground'}>
                                {teamB?.name || 'Team B'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {golfDays.length === 0 && (
          <Card className="animate-fade-up">
            <CardContent className="py-8 sm:py-12 text-center">
              <Calendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-30" />
              <p className="text-base sm:text-lg font-medium text-foreground mb-2">No Golf Days Yet</p>
              <p className="text-sm text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto">
                Create your first golf day to start tracking matches and scores
              </p>
              <Button variant="hero" size="sm" className="sm:h-10 sm:px-6" onClick={handleCreateDay}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Day
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Day Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg sm:text-xl">Create New Golf Day</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-sm">Day Name</Label>
              <Input 
                placeholder="e.g., St Andrews" 
                className="mt-1.5"
                defaultValue={`Day ${golfDays.length + 1}`}
              />
            </div>
            <div>
              <Label className="text-sm">Date</Label>
              <Input 
                type="date" 
                className="mt-1.5"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label className="text-sm">Game Format</Label>
              <Select defaultValue="singles">
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="singles">Singles (1v1)</SelectItem>
                  <SelectItem value="four-ball">Four-Ball (Better Ball)</SelectItem>
                  <SelectItem value="high-low">High-Low</SelectItem>
                  <SelectItem value="foursomes">Foursomes (Alternate Shot)</SelectItem>
                  <SelectItem value="texas-scramble">Texas Scramble</SelectItem>
                  <SelectItem value="chapman">Chapman</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Scoring Type</Label>
              <Select defaultValue="stableford">
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stableford">Stableford (Points)</SelectItem>
                  <SelectItem value="strokeplay">Stroke Play (Strokes)</SelectItem>
                  <SelectItem value="matchplay">Match Play (Holes)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => {
                // TODO: Actually create the day
                setShowCreateDialog(false);
              }}>
                Create Day
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Captain Setup Dialog */}
      {selectedDayData && (
        <Dialog open={captainViewOpen} onOpenChange={setCaptainViewOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-lg sm:text-xl flex items-center gap-2">
                <Crown className="w-5 h-5 text-warning" />
                Setup Matches: {selectedDayData.courseName || `Day ${selectedDayData.dayNumber}`}
              </DialogTitle>
            </DialogHeader>
            <div className="pt-4">
              {/* Captain Selection */}
              <div className="mb-4 p-3 sm:p-4 rounded-lg bg-muted/50">
                <Label className="text-sm mb-2 block">Select Your Team</Label>
                <div className="flex gap-2">
                  <Button
                    variant={captainTeam === 'team-a' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setCaptainTeam('team-a')}
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: teamA?.color }}
                    />
                    {teamA?.name || 'Team A'}
                  </Button>
                  <Button
                    variant={captainTeam === 'team-b' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setCaptainTeam('team-b')}
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: teamB?.color }}
                    />
                    {teamB?.name || 'Team B'}
                  </Button>
                </div>
              </div>

              <CaptainFixtureManager
                fixtureDay={selectedDayData}
                captainTeam={captainTeam}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
