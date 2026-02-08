import { AppLayout } from '@/components/layout/AppLayout';
import { useTrip } from '@/contexts/TripContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Users, 
  Trophy, 
  Calendar,
  Play,
  ArrowRight,
  Target,
  CheckCircle2,
  Clock,
  Swords,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';

export default function Dashboard() {
  const { players, games, teams, fixtureDays } = useTrip();

  // Calculate stats
  const completedGames = games.filter(g => g.completed).length;
  const inProgressGames = games.filter(g => !g.completed).length;
  const finalizedDays = fixtureDays.filter(fd => fd.teamALockedIn && fd.teamBLockedIn).length;
  
  // Calculate team standings
  const teamStats = useMemo(() => {
    return teams.map(team => {
      const teamPlayers = players.filter(p => team.players.includes(p.id));
      const captain = players.find(p => p.id === team.captainId);
      
      // Calculate points from completed games
      let points = 0;
      games.forEach(game => {
        if (game.completed) {
          const teamPlayerIds = team.players;
          const hasTeamPlayer = game.players.some(p => teamPlayerIds.includes(p));
          if (hasTeamPlayer) {
            points += Math.random() > 0.5 ? 1 : 0; 
          }
        }
      });

      return {
        ...team,
        playerCount: teamPlayers.length,
        captainName: captain?.name || 'No captain',
        points: Math.floor(points),
      };
    });
  }, [teams, players, games]);

  // Determine next steps
  const getNextSteps = () => {
    const steps = [];
    
    if (players.length < 4) {
      steps.push({
        id: 'add-players',
        title: 'Add Players',
        description: `You have ${players.length} players. Add at least 4 to get started.`,
        action: { label: 'Add Players', to: '/players' },
        priority: 'high',
        icon: Users,
      });
    }
    
    const teamsWithCaptains = teams.filter(t => t.captainId).length;
    if (teamsWithCaptains < 2 && players.length >= 4) {
      steps.push({
        id: 'assign-captains',
        title: 'Assign Captains',
        description: 'Each team needs a captain to manage pairings.',
        action: { label: 'Assign Captains', to: '/players' },
        priority: 'medium',
        icon: Trophy,
      });
    }
    
    if (fixtureDays.length === 0 && players.length >= 4) {
      steps.push({
        id: 'create-session',
        title: 'Create First Session',
        description: 'Set up your first golf day with matches.',
        action: { label: 'Create Session', to: '/fixtures' },
        priority: 'high',
        icon: Calendar,
      });
    }
    
    if (finalizedDays > 0 && completedGames === 0) {
      steps.push({
        id: 'start-playing',
        title: 'Start Playing',
        description: `${finalizedDays} session${finalizedDays > 1 ? 's' : ''} ready. Start scoring matches!`,
        action: { label: 'Play Now', to: '/play' },
        priority: 'high',
        icon: Play,
      });
    }
    
    return steps;
  };

  const nextSteps = getNextSteps();
  const hasIncompleteSetup = nextSteps.some(s => s.priority === 'high');

  // Get recent activity
  const recentGames = games.slice(-3).reverse();

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8 animate-fade-up">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your golf competition and track progress
          </p>
        </div>

        {/* Next Steps - Show if setup incomplete */}
        {hasIncompleteSetup && (
          <Card className="mb-6 md:mb-8 border-warning/50 bg-warning/5 animate-fade-up">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-warning text-lg sm:text-xl">
                <Clock className="w-5 h-5" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-3">
                {nextSteps.map((step) => (
                  <div 
                    key={step.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-background border gap-3"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <step.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base">{step.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                    <Button asChild variant={step.priority === 'high' ? 'hero' : 'outline'} className="w-full sm:w-auto">
                      <Link to={step.action.to}>
                        {step.action.label}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 md:mb-8">
          <Card className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Players</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{players.length}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Across {teams.length} teams</p>
              <div className="mt-2">
                <Button variant="ghost" size="sm" className="w-full text-xs sm:text-sm" asChild>
                  <Link to="/players">Manage Players</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <p className="text-xs sm:text-sm text-muted-foreground">Golf Days</p>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-foreground">{fixtureDays.length}</p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent/20 flex items-center justify-center">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button variant="ghost" size="sm" className="w-full text-xs sm:text-sm" asChild>
                        <Link to="/fixtures">Manage Days</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs sm:text-sm">A "Golf Day" (or Session) is one day of competition.<br/>Example: Day 1 at St Andrews playing Four-Ball</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Card className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Matches Played</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{completedGames}</p>
                  {inProgressGames > 0 && (
                    <p className="text-xs text-primary">{inProgressGames} in progress</p>
                  )}
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-success/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
                </div>
              </div>
              <div className="mt-4">
                <Button variant="ghost" size="sm" className="w-full text-xs sm:text-sm" asChild>
                  <Link to="/play">Play Matches</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-up" style={{ animationDelay: '0.25s' }}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Ready to Play</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{finalizedDays}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-warning/20 flex items-center justify-center">
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs sm:text-sm"
                  disabled={finalizedDays === 0}
                  asChild
                >
                  <Link to="/play">Start Scoring</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Team Standings */}
          <Card className="lg:col-span-2 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
              <CardTitle className="font-display text-lg sm:text-xl flex items-center gap-2">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                Team Standings
              </CardTitle>
              <Badge variant="outline" className="text-xs">Live</Badge>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {teamStats.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {teamStats.map((team, index) => (
                    <div
                      key={team.id}
                      className="p-3 sm:p-4 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div 
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-white shrink-0"
                            style={{ backgroundColor: team.color }}
                          >
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{team.name}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {team.playerCount} players • Captain: {team.captainName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl sm:text-3xl font-bold text-foreground">{team.points}</p>
                          <p className="text-xs text-muted-foreground">points</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Roster</span>
                          <span className="font-medium">{team.playerCount} players</span>
                        </div>
                        <Progress 
                          value={(team.playerCount / 8) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No teams set up yet</p>
                  <Button className="mt-4" variant="outline" size="sm" asChild>
                    <Link to="/players">Set Up Teams</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="animate-fade-up" style={{ animationDelay: '0.35s' }}>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="font-display text-lg sm:text-xl">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {recentGames.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {recentGames.map((game) => (
                    <div key={game.id} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm text-foreground">Match Completed</p>
                        <p className="text-xs text-muted-foreground truncate">{game.courseName}</p>
                        <p className="text-xs text-muted-foreground">{new Date(game.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <Target className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-xs sm:text-sm">No matches played yet</p>
                  {finalizedDays > 0 && (
                    <Button className="mt-4" size="sm" asChild>
                      <Link to="/play">Start Playing</Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-4 sm:mt-6 animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-display text-lg sm:text-xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <Button variant="outline" className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 text-xs sm:text-sm" asChild>
                <Link to="/players">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Add Players</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 text-xs sm:text-sm" asChild>
                <Link to="/fixtures">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>New Session</span>
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                disabled={finalizedDays === 0}
                asChild
              >
                <Link to="/play">
                  <Play className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Score Match</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 text-xs sm:text-sm" asChild>
                <Link to="/fixtures">
                  <Swords className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>View Results</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
