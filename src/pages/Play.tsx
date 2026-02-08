import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTrip } from '@/contexts/TripContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Play as PlayIcon, 
  Calendar, 
  Lock,
  Swords,
  Zap,
  Trophy,
  Users,
  Plus,
  ArrowRight
} from 'lucide-react';
import { GameScoreboardDialog, StrokeTableData } from '@/components/play/GameScoreboardDialog';
import { GameSetupDialog } from '@/components/play/GameSetupDialog';
import { FixtureDay, Match, GameFormat, ScoringType } from '@/types/golf';

interface DisplayMatch extends Match {
  fixtureDayId: string;
  fixtureDayNumber: number;
  courseName: string;
  gameFormat: GameFormat;
  scoringType?: ScoringType;
}

interface QuickMatch {
  id: string;
  teamAPlayers: string[];
  teamBPlayers: string[];
  courseName: string;
  gameFormat: GameFormat;
  scoringType: ScoringType;
  isQuickPlay: true;
}

export default function Play() {
  const location = useLocation();
  const { players, teams, fixtureDays, games } = useTrip();
  const [selectedMatch, setSelectedMatch] = useState<DisplayMatch | QuickMatch | null>(null);
  const [scoreboardOpen, setScoreboardOpen] = useState(false);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [matchTeeColor, setMatchTeeColor] = useState<'yellow' | 'white'>('yellow');
  const [matchStrokeTable, setMatchStrokeTable] = useState<StrokeTableData | undefined>(undefined);
  const [mode, setMode] = useState<'organized' | 'quick'>('organized');
  
  // Quick play setup
  const [quickFormat, setQuickFormat] = useState<GameFormat>('singles');
  const [quickScoring, setQuickScoring] = useState<ScoringType>('stableford');
  const [quickCourse, setQuickCourse] = useState('');
  const [showQuickSetup, setShowQuickSetup] = useState(false);

  const teamA = teams.find(t => t.id === 'team-a');
  const teamB = teams.find(t => t.id === 'team-b');

  // Check if coming from Quick Play button
  useEffect(() => {
    const state = location.state as { mode?: string } | null;
    if (state?.mode === 'quick') {
      setMode('quick');
      setShowQuickSetup(true);
    }
  }, [location.state]);

  // Helper to check if a match is in progress
  const isMatchInProgress = (matchId: string) => {
    return games.some(g => g.id === matchId && !g.completed);
  };

  // Helper to check if a match is completed
  const isMatchCompleted = (matchId: string) => {
    return games.some(g => g.id === matchId && g.completed);
  };

  // Check if match already has setup data
  const hasMatchSetup = (matchId: string) => {
    try {
      const stored = localStorage.getItem(`golf-match-setup-${matchId}`);
      return !!stored;
    } catch {
      return false;
    }
  };

  const handleStartGame = (match: DisplayMatch | QuickMatch) => {
    setSelectedMatch(match);
    
    // If game is already in progress, go directly to scoreboard
    if (isMatchInProgress(match.id) || hasMatchSetup(match.id)) {
      // Load existing setup
      try {
        const stored = localStorage.getItem(`golf-match-setup-${match.id}`);
        if (stored) {
          const setup = JSON.parse(stored);
          setMatchTeeColor(setup.teeColor || 'yellow');
          setMatchStrokeTable(setup.strokeTableData);
        }
      } catch {
        // Use defaults
      }
      setScoreboardOpen(true);
    } else {
      // Show setup dialog for new games
      setSetupDialogOpen(true);
    }
  };

  const handleSetupComplete = (teeColor: 'yellow' | 'white', strokeTableData?: StrokeTableData) => {
    setMatchTeeColor(teeColor);
    setMatchStrokeTable(strokeTableData);
    setSetupDialogOpen(false);
    setScoreboardOpen(true);
  };

  const handleStartQuickPlay = () => {
    // Create a quick match with selected players
    const teamAPlayers = teamA?.players.slice(0, quickFormat === 'singles' ? 1 : 2) || [];
    const teamBPlayers = teamB?.players.slice(0, quickFormat === 'singles' ? 1 : 2) || [];
    
    if (teamAPlayers.length === 0 || teamBPlayers.length === 0) {
      alert('Need players on both teams to start!');
      return;
    }

    const quickMatch: QuickMatch = {
      id: `quick-${Date.now()}`,
      teamAPlayers,
      teamBPlayers,
      courseName: quickCourse || 'Quick Game',
      gameFormat: quickFormat,
      scoringType: quickScoring,
      isQuickPlay: true,
    };

    setSelectedMatch(quickMatch);
    setSetupDialogOpen(true);
    setShowQuickSetup(false);
  };

  // Get all finalized fixture days with their matches
  const finalizedFixtureDays = fixtureDays.filter(fd => fd.teamALockedIn && fd.teamBLockedIn);

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 md:mb-8 animate-fade-up">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
              Play Games
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Start scoring matches or create a quick game
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button 
              variant={mode === 'organized' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('organized')}
            >
              <Trophy className="w-4 h-4 mr-1.5" />
              Organized
            </Button>
            <Button 
              variant={mode === 'quick' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setMode('quick');
                setShowQuickSetup(true);
              }}
            >
              <Zap className="w-4 h-4 mr-1.5" />
              Quick Play
            </Button>
          </div>
        </div>

        {/* QUICK PLAY MODE */}
        {mode === 'quick' && (
          <div className="animate-fade-up space-y-4 sm:space-y-6">
            {/* Quick Play Setup Card */}
            <Card className="border-warning/50 bg-warning/5">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Zap className="w-5 h-5 text-warning" />
                  Quick Game Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Label className="text-xs sm:text-sm">Format</Label>
                    <Select value={quickFormat} onValueChange={(v) => setQuickFormat(v as GameFormat)}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="singles">Singles (1v1)</SelectItem>
                        <SelectItem value="four-ball">Four-Ball (2v2)</SelectItem>
                        <SelectItem value="high-low">High-Low (2v2)</SelectItem>
                        <SelectItem value="foursomes">Foursomes (2v2)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs sm:text-sm">Scoring</Label>
                    <Select value={quickScoring} onValueChange={(v) => setQuickScoring(v as ScoringType)}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stableford">Stableford</SelectItem>
                        <SelectItem value="strokeplay">Stroke Play</SelectItem>
                        <SelectItem value="matchplay">Match Play</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-2">
                    <Label className="text-xs sm:text-sm">Course Name (optional)</Label>
                    <input
                      type="text"
                      placeholder="e.g., St Andrews"
                      className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm"
                      value={quickCourse}
                      onChange={(e) => setQuickCourse(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="hero" 
                    className="flex-1"
                    onClick={handleStartQuickPlay}
                    disabled={!teamA?.players.length || !teamB?.players.length}
                  >
                    <PlayIcon className="w-4 h-4 mr-2" />
                    Start Quick Game
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setMode('organized')}
                  >
                    Back to Organized
                  </Button>
                </div>

                {(!teamA?.players.length || !teamB?.players.length) && (
                  <p className="mt-3 text-xs sm:text-sm text-warning flex items-center gap-1">
                    <Lock className="w-4 h-4" />
                    Need players on both teams. Go to Players page to add some.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Quick Games */}
            {games.filter(g => g.id.startsWith('quick-')).length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Recent Quick Games</h3>
                <div className="grid gap-3">
                  {games
                    .filter(g => g.id.startsWith('quick-'))
                    .slice(-5)
                    .reverse()
                    .map(game => (
                      <Card key={game.id} className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          const quickMatch: QuickMatch = {
                            id: game.id,
                            teamAPlayers: game.players.filter(p => teamA?.players.includes(p)),
                            teamBPlayers: game.players.filter(p => teamB?.players.includes(p)),
                            courseName: game.courseName,
                            gameFormat: (game as any).gameFormat || 'singles',
                            scoringType: (game as any).scoringType || 'stableford',
                            isQuickPlay: true,
                          };
                          handleStartGame(quickMatch);
                        }}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm sm:text-base">{game.courseName}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(game.date).toLocaleDateString()} • 
                                {game.completed ? ' Completed' : ' In Progress'}
                              </p>
                            </div>
                            <Badge variant={game.completed ? "default" : "outline"}>
                              {game.completed ? 'Done' : 'Resume'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        )}

        {/* ORGANIZED MODE */}
        {mode === 'organized' && (
          <div className="animate-fade-up">
            {finalizedFixtureDays.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {finalizedFixtureDays.map((fixtureDay) => {
                  const isSingles = fixtureDay.gameFormat === 'singles';
                  
                  // Generate matches for display
                  const displayMatches: DisplayMatch[] = isSingles 
                    ? fixtureDay.matches.map(m => ({
                        ...m,
                        fixtureDayId: fixtureDay.id,
                        fixtureDayNumber: fixtureDay.dayNumber,
                        courseName: fixtureDay.courseName || `Day ${fixtureDay.dayNumber}`,
                        gameFormat: fixtureDay.gameFormat,
                        scoringType: fixtureDay.scoringType,
                      }))
                    : (fixtureDay.teamAPairings || []).map((teamAPlayers, idx) => ({
                        id: `match-${fixtureDay.id}-${idx}`,
                        teamAPlayers: teamAPlayers || [],
                        teamBPlayers: fixtureDay.teamBPairings?.[idx] || [],
                        fixtureDayId: fixtureDay.id,
                        fixtureDayNumber: fixtureDay.dayNumber,
                        courseName: fixtureDay.courseName || `Day ${fixtureDay.dayNumber}`,
                        gameFormat: fixtureDay.gameFormat,
                        scoringType: fixtureDay.scoringType,
                      }));
                  
                  return (
                    <Card key={fixtureDay.id} className="overflow-hidden">
                      <CardHeader className="p-4 sm:p-6 bg-muted/30">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="font-bold text-primary">{fixtureDay.dayNumber}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base sm:text-lg truncate">
                              {fixtureDay.courseName || `Day ${fixtureDay.dayNumber}`}
                            </CardTitle>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                              {new Date(fixtureDay.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                              <span className="mx-1 sm:mx-2">•</span>
                              <span className="capitalize">{fixtureDay.gameFormat.replace('-', ' ')}</span>
                            </p>
                          </div>
                          <Badge variant="default" className="w-fit">
                            <Lock className="w-3 h-3 mr-1" />
                            Ready
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 pt-3 sm:pt-4">
                        <div className="space-y-2 sm:space-y-3">
                          {displayMatches.map((match, matchIdx) => {
                            const inProgress = isMatchInProgress(match.id);
                            const completed = isMatchCompleted(match.id);
                            
                            return (
                              <div 
                                key={match.id} 
                                className={`p-3 sm:p-4 rounded-lg border ${inProgress ? 'bg-primary/5 border-primary/30' : 'bg-muted/30'}`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-3">
                                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
                                    <Swords className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    {isSingles ? `Match ${matchIdx + 1}` : `Flight ${matchIdx + 1}`}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {completed && (
                                      <Badge variant="default" className="bg-green-600 text-xs">Completed</Badge>
                                    )}
                                    {inProgress && !completed && (
                                      <Badge variant="outline" className="border-primary text-primary text-xs">In Progress</Badge>
                                    )}
                                    <Button 
                                      variant={inProgress ? "outline" : "hero"}
                                      size="sm"
                                      className="text-xs"
                                      onClick={() => handleStartGame(match)}
                                    >
                                      <PlayIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                      {inProgress ? 'Continue' : 'Play'}
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4 items-center">
                                  {/* Team A players */}
                                  <div className="space-y-1">
                                    {match.teamAPlayers.map(playerId => {
                                      const player = players.find(p => p.id === playerId);
                                      return player ? (
                                        <div 
                                          key={playerId}
                                          className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded bg-card text-xs sm:text-sm"
                                        >
                                          <div 
                                            className="w-2 h-2 sm:w-3 sm:h-3 rounded-full shrink-0"
                                            style={{ backgroundColor: teamA?.color }}
                                          />
                                          <span className="truncate">{player.name}</span>
                                        </div>
                                      ) : null;
                                    })}
                                  </div>
                                  
                                  {/* VS */}
                                  <div className="text-center">
                                    <span className="text-xs sm:text-sm font-bold text-muted-foreground">VS</span>
                                  </div>
                                  
                                  {/* Team B players */}
                                  <div className="space-y-1">
                                    {match.teamBPlayers.map(playerId => {
                                      const player = players.find(p => p.id === playerId);
                                      return player ? (
                                        <div 
                                          key={playerId}
                                          className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded bg-card text-xs sm:text-sm"
                                        >
                                          <div 
                                            className="w-2 h-2 sm:w-3 sm:h-3 rounded-full shrink-0"
                                            style={{ backgroundColor: teamB?.color }}
                                          />
                                          <span className="truncate">{player.name}</span>
                                        </div>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 sm:py-12 text-center">
                  <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-30" />
                  <p className="text-base sm:text-lg font-medium text-foreground mb-2">No Organized Games Ready</p>
                  <p className="text-sm text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto">
                    Create a Golf Day in the Sessions page and have both captains lock in their selections.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      variant="hero" 
                      size="sm"
                      className="sm:h-10"
                      onClick={() => setMode('quick')}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Play Quick Game Instead
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Scoreboard Dialog */}
      {selectedMatch && (
        <>
          <GameSetupDialog
            open={setupDialogOpen}
            onOpenChange={setSetupDialogOpen}
            match={selectedMatch}
            onStartGame={handleSetupComplete}
          />
          <GameScoreboardDialog 
            open={scoreboardOpen} 
            onOpenChange={setScoreboardOpen}
            match={selectedMatch}
            teeColor={matchTeeColor}
            strokeTableData={matchStrokeTable}
          />
        </>
      )}
    </AppLayout>
  );
}
