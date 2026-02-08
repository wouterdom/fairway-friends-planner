import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTrip } from '@/contexts/TripContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Trophy, 
  Plus,
  Calendar,
  Crown,
  Lock,
  Unlock,
  Swords,
  Play
} from 'lucide-react';
import { CaptainFixtureManager } from '@/components/fixtures/CaptainFixtureManager';
import { CreateFixtureDayDialog } from '@/components/fixtures/CreateFixtureDayDialog';
import { LeaderboardView } from '@/components/leaderboard/LeaderboardView';

export default function Fixtures() {
  const navigate = useNavigate();
  const { games, players, teams, fixtureDays, setCaptain } = useTrip();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCaptainTeam, setSelectedCaptainTeam] = useState<'team-a' | 'team-b' | null>(null);
  const [selectedFixtureDay, setSelectedFixtureDay] = useState<string | null>(null);

  // Helper to check if a match is in progress from games array
  const isMatchInProgress = (matchId: string) => {
    return games.some(g => g.id === matchId && !g.completed);
  };

  // Helper to check if a match is completed
  const isMatchCompleted = (matchId: string) => {
    return games.some(g => g.id === matchId && g.completed);
  };

  const getTeamName = (teamId?: string) => {
    if (!teamId) return 'All Players';
    return teams.find(t => t.id === teamId)?.name || 'Unknown';
  };

  const getTeamColor = (teamId?: string) => {
    if (!teamId) return '#888';
    return teams.find(t => t.id === teamId)?.color || '#888';
  };

  const getPlayerName = (playerId: string) => {
    return players.find(p => p.id === playerId)?.name || 'Unknown';
  };

  const calculateLeaderboard = () => {
    const playerScores = new Map<string, { total: number; gamesPlayed: number }>();

    games.forEach(game => {
      Object.entries(game.scores).forEach(([playerId, scores]) => {
        const total = scores.reduce((a, b) => a + b, 0);
        const existing = playerScores.get(playerId) || { total: 0, gamesPlayed: 0 };
        playerScores.set(playerId, {
          total: existing.total + total,
          gamesPlayed: existing.gamesPlayed + 1,
        });
      });
    });

    return Array.from(playerScores.entries())
      .map(([playerId, data]) => ({
        player: players.find(p => p.id === playerId),
        ...data,
        average: data.total / data.gamesPlayed,
      }))
      .filter(entry => entry.player)
      .sort((a, b) => a.total - b.total);
  };

  const leaderboard = calculateLeaderboard();
  const selectedDay = fixtureDays.find(fd => fd.id === selectedFixtureDay);

  const teamA = teams.find(t => t.id === 'team-a');
  const teamB = teams.find(t => t.id === 'team-b');

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-fade-up">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Golf Days (Sessions)
            </h1>
            <p className="text-muted-foreground">
              Create and manage competition days. Each day is a separate session with matches.
            </p>
          </div>

          <Button variant="hero" size="lg" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Add Golf Day
          </Button>
        </div>

        {/* What are Golf Days? */}
        <Card className="mb-6 border-accent/50 bg-accent/5 animate-fade-up">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">What are Golf Days?</h3>
                <p className="text-sm text-muted-foreground">
                  Each "Golf Day" represents one day of your competition trip. For example:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li><strong>Day 1:</strong> Friday at St Andrews - Playing Four-Ball</li>
                  <li><strong>Day 2:</strong> Saturday at Carnoustie - Playing Singles</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  You can create multiple days, each with different formats and pairings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="captain" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="captain" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Captain View
            </TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="games">All Games</TabsTrigger>
          </TabsList>

          {/* Captain View Tab */}
          <TabsContent value="captain" className="space-y-6">
            {/* Team & Day Selection */}
            <Card className="animate-fade-up">
              <CardContent className="pt-6">
                <Accordion type="single" collapsible defaultValue="selection">
                  <AccordionItem value="selection" className="border-none">
                    <AccordionTrigger className="hover:no-underline py-0 mb-4">
                      <div className="flex items-center gap-2">
                        <Swords className="w-5 h-5" />
                        <span className="font-display text-lg">Captain Fixture Management</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Select your team to manage fixture matchups. Both captains must lock in their selections.
                      </p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Select Your Team</label>
                          <Select
                            value={selectedCaptainTeam || ''}
                            onValueChange={(value) => setSelectedCaptainTeam(value as 'team-a' | 'team-b')}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose team..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="team-a">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: teamA?.color }}
                                  />
                                  <Crown className="w-4 h-4" />
                                  {teamA?.name || 'Team A'} Captain
                                </div>
                              </SelectItem>
                              <SelectItem value="team-b">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: teamB?.color }}
                                  />
                                  <Crown className="w-4 h-4" />
                                  {teamB?.name || 'Team B'} Captain
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">Select Fixture Day</label>
                          <Select
                            value={selectedFixtureDay || ''}
                            onValueChange={setSelectedFixtureDay}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose day..." />
                            </SelectTrigger>
                            <SelectContent>
                              {fixtureDays.length > 0 ? (
                                fixtureDays.map(fd => (
                                  <SelectItem key={fd.id} value={fd.id}>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4" />
                                      Day {fd.dayNumber} - {new Date(fd.date).toLocaleDateString()}
                                      {fd.isFinalized && <Badge variant="secondary" className="ml-2">Finalized</Badge>}
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                  No fixture days created yet
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Fixture Day Summary */}
                  {fixtureDays.length > 0 && (
                    <AccordionItem value="fixture-days" className="border-none">
                      <AccordionTrigger className="hover:no-underline py-0 mt-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5" />
                          <span className="font-medium">Fixture Days Overview</span>
                          <Badge variant="secondary" className="ml-2">{fixtureDays.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-3 pt-2">
                          {fixtureDays.map(fd => (
                            <div 
                              key={fd.id}
                              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                selectedFixtureDay === fd.id 
                                  ? 'border-primary bg-primary/5' 
                                  : 'hover:border-primary/50'
                              }`}
                              onClick={() => setSelectedFixtureDay(fd.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                    <span className="font-bold text-foreground">{fd.dayNumber}</span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">
                                      {fd.courseName || `Day ${fd.dayNumber}`}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(fd.date).toLocaleDateString('en-US', { 
                                        weekday: 'short', 
                                        month: 'short', 
                                        day: 'numeric' 
                                      })} • {fd.gameFormat.replace('-', ' ')}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={fd.teamALockedIn ? "default" : "outline"}
                                    className="text-xs"
                                  >
                                    {fd.teamALockedIn ? <Lock className="w-3 h-3 mr-1" /> : <Unlock className="w-3 h-3 mr-1" />}
                                    A
                                  </Badge>
                                  <Badge 
                                    variant={fd.teamBLockedIn ? "default" : "outline"}
                                    className="text-xs"
                                  >
                                    {fd.teamBLockedIn ? <Lock className="w-3 h-3 mr-1" /> : <Unlock className="w-3 h-3 mr-1" />}
                                    B
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </CardContent>
            </Card>

            {/* Captain Fixture Manager */}
            {selectedCaptainTeam && selectedDay && (
              <CaptainFixtureManager
                fixtureDay={selectedDay}
                captainTeam={selectedCaptainTeam}
              />
            )}

            {/* Empty State */}
            {!selectedCaptainTeam && fixtureDays.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Crown className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <p className="text-lg font-medium text-foreground mb-2">No Fixture Days Yet</p>
                  <p className="text-muted-foreground mb-6">
                    Create a fixture day to start managing team matchups
                  </p>
                  <Button variant="hero" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Fixture Day
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            <LeaderboardView />
          </TabsContent>

          {/* Games Tab - Shows finalized fixture day matches */}
          <TabsContent value="games" className="space-y-6">
            {fixtureDays.filter(fd => fd.teamALockedIn && fd.teamBLockedIn).length > 0 ? (
              <Card className="animate-fade-up">
                <CardContent className="pt-6">
                  <Accordion type="multiple" defaultValue={fixtureDays.filter(fd => fd.teamALockedIn && fd.teamBLockedIn).map(fd => fd.id)}>
                    {fixtureDays
                      .filter(fd => fd.teamALockedIn && fd.teamBLockedIn)
                      .map((fixtureDay) => {
                        const isSingles = fixtureDay.gameFormat === 'singles';
                        
                        // Generate matches for display
                        const displayMatches = isSingles 
                          ? fixtureDay.matches 
                          : (fixtureDay.teamAPairings || []).map((teamAPlayers, idx) => ({
                              id: `match-${fixtureDay.id}-${idx}`,
                              teamAPlayers: teamAPlayers || [],
                              teamBPlayers: fixtureDay.teamBPairings?.[idx] || [],
                            }));
                        
                        return (
                          <AccordionItem key={fixtureDay.id} value={fixtureDay.id} className="border-none mb-4">
                            <AccordionTrigger className="hover:no-underline p-4 rounded-lg bg-muted/30 border">
                              <div className="flex items-center gap-3 w-full pr-4">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <span className="font-bold text-primary">{fixtureDay.dayNumber}</span>
                                </div>
                                <div className="text-left flex-1">
                                  <p className="font-display text-base font-semibold">
                                    {fixtureDay.courseName || `Day ${fixtureDay.dayNumber}`}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(fixtureDay.date).toLocaleDateString('en-US', { 
                                      weekday: 'short', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                    <span>•</span>
                                    <span className="capitalize">{fixtureDay.gameFormat.replace('-', ' ')}</span>
                                  </div>
                                </div>
                                <Badge variant="default" className="gap-1">
                                  <Lock className="w-3 h-3" />
                                  Finalized
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-4">
                              <div className="space-y-3">
                                {displayMatches.map((match, matchIdx) => {
                                  const inProgress = isMatchInProgress(match.id);
                                  const completed = isMatchCompleted(match.id);
                                  
                                  // Try to load match scores from localStorage
                                  let matchStatus = { teamA: 'TIED', teamB: 'TIED', hasScores: false, validatedCount: 0 };
                                  try {
                                    const stored = localStorage.getItem(`golf-match-scores-${match.id}`);
                                    if (stored) {
                                      const data = JSON.parse(stored);
                                      const validatedHoles = data.validatedHoles || [];
                                      const scores = data.scores || {};
                                      const validatedCount = validatedHoles.filter((v: boolean) => v).length;
                                      
                                      if (validatedHoles.some((v: boolean) => v)) {
                                        // Calculate team scores for validated holes only
                                        let teamATotal = 0;
                                        let teamBTotal = 0;
                                        
                                        for (let hole = 0; hole < 18; hole++) {
                                          if (!validatedHoles[hole]) continue;
                                          
                                          // Simple net score calculation
                                          const teamANets = match.teamAPlayers.map((pid: string) => {
                                            const gross = scores[pid]?.[hole] || 0;
                                            return gross > 0 ? gross : null;
                                          }).filter((n: number | null): n is number => n !== null);
                                          
                                          const teamBNets = match.teamBPlayers.map((pid: string) => {
                                            const gross = scores[pid]?.[hole] || 0;
                                            return gross > 0 ? gross : null;
                                          }).filter((n: number | null): n is number => n !== null);
                                          
                                          if (teamANets.length > 0) teamATotal += Math.min(...teamANets);
                                          if (teamBNets.length > 0) teamBTotal += Math.min(...teamBNets);
                                        }
                                        
                                        const diff = teamBTotal - teamATotal; // Lower is better in stroke play
                                        if (diff > 0) {
                                          matchStatus = { teamA: `${diff} UP`, teamB: `${diff} DOWN`, hasScores: true, validatedCount };
                                        } else if (diff < 0) {
                                          matchStatus = { teamA: `${Math.abs(diff)} DOWN`, teamB: `${Math.abs(diff)} UP`, hasScores: true, validatedCount };
                                        } else {
                                          matchStatus = { teamA: 'TIED', teamB: 'TIED', hasScores: true, validatedCount };
                                        }
                                      }
                                    }
                                  } catch (e) {
                                    console.error('Failed to load match scores:', e);
                                  }
                                  
                                  return (
                                    <div 
                                      key={match.id} 
                                      className={`p-4 rounded-lg border ${inProgress ? 'bg-primary/5 border-primary/30' : 'bg-muted/50'}`}
                                    >
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                          <Swords className="w-4 h-4" />
                                          {isSingles ? `Match ${matchIdx + 1}` : `Flight ${matchIdx + 1}`}
                                          {matchStatus.hasScores && matchStatus.validatedCount > 0 && (
                                            <Badge variant="secondary" className="ml-2">
                                              {matchStatus.validatedCount}/18 holes
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {completed && (
                                            <Badge variant="default" className="bg-green-600">Completed</Badge>
                                          )}
                                          {inProgress && !completed && (
                                            <Badge variant="outline" className="border-primary text-primary">In Progress</Badge>
                                          )}
                                          <Button 
                                            variant={inProgress ? "outline" : "hero"}
                                            size="sm"
                                            onClick={() => navigate('/play')}
                                          >
                                            <Play className="w-4 h-4 mr-2" />
                                            {inProgress ? 'Continue' : 'Play'}
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                                        {/* Team A players with status */}
                                        <div className="space-y-2">
                                          {matchStatus.hasScores && (
                                            <div className={`text-center font-bold text-lg mb-2 ${
                                              matchStatus.teamA.includes('UP') ? 'text-green-600' : 
                                              matchStatus.teamA.includes('DOWN') ? 'text-red-500' : 'text-foreground'
                                            }`}>
                                              {matchStatus.teamA}
                                            </div>
                                          )}
                                          {match.teamAPlayers.map(playerId => {
                                            const player = players.find(p => p.id === playerId);
                                            return player ? (
                                              <div 
                                                key={playerId}
                                                className="flex items-center gap-2 p-2 rounded bg-card"
                                              >
                                                <div 
                                                  className="w-3 h-3 rounded-full"
                                                  style={{ backgroundColor: teamA?.color }}
                                                />
                                                <span className="text-sm font-medium">{player.name}</span>
                                                <span className="text-xs text-muted-foreground ml-auto">
                                                  ({player.handicap})
                                                </span>
                                              </div>
                                            ) : null;
                                          })}
                                        </div>
                                        
                                        {/* VS */}
                                        <div className="text-center">
                                          <span className="text-sm font-bold text-muted-foreground">VS</span>
                                        </div>
                                        
                                        {/* Team B players with status */}
                                        <div className="space-y-2">
                                          {matchStatus.hasScores && (
                                            <div className={`text-center font-bold text-lg mb-2 ${
                                              matchStatus.teamB.includes('UP') ? 'text-green-600' : 
                                              matchStatus.teamB.includes('DOWN') ? 'text-red-500' : 'text-foreground'
                                            }`}>
                                              {matchStatus.teamB}
                                            </div>
                                          )}
                                          {match.teamBPlayers.map(playerId => {
                                            const player = players.find(p => p.id === playerId);
                                            return player ? (
                                              <div 
                                                key={playerId}
                                                className="flex items-center gap-2 p-2 rounded bg-card"
                                              >
                                                <div 
                                                  className="w-3 h-3 rounded-full"
                                                  style={{ backgroundColor: teamB?.color }}
                                                />
                                                <span className="text-sm font-medium">{player.name}</span>
                                                <span className="text-xs text-muted-foreground ml-auto">
                                                  ({player.handicap})
                                                </span>
                                              </div>
                                            ) : null;
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                  </Accordion>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <p className="text-lg font-medium text-foreground mb-2">No games scheduled</p>
                  <p className="text-muted-foreground mb-6">
                    Both captains must lock in their selections to finalize games
                  </p>
                  <Button variant="hero" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Fixture Day
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateFixtureDayDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </AppLayout>
  );
}