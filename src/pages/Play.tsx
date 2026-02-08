import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTrip } from '@/contexts/TripContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Play as PlayIcon, 
  Calendar, 
  Lock,
  Swords
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

export default function Play() {
  const { players, teams, fixtureDays, games } = useTrip();
  const [selectedMatch, setSelectedMatch] = useState<DisplayMatch | null>(null);
  const [scoreboardOpen, setScoreboardOpen] = useState(false);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [matchTeeColor, setMatchTeeColor] = useState<'yellow' | 'white'>('yellow');
  const [matchStrokeTable, setMatchStrokeTable] = useState<StrokeTableData | undefined>(undefined);

  const teamA = teams.find(t => t.id === 'team-a');
  const teamB = teams.find(t => t.id === 'team-b');

  // Helper to check if a match is in progress
  const isMatchInProgress = (matchId: string) => {
    return games.some(g => g.id === matchId && !g.completed);
  };

  // Helper to check if a match is completed
  const isMatchCompleted = (matchId: string) => {
    return games.some(g => g.id === matchId && g.completed);
  };

  // Helper to get match status from localStorage
  const getMatchStatus = (matchId: string) => {
    try {
      const stored = localStorage.getItem(`golf-match-scores-${matchId}`);
      if (stored) {
        const data = JSON.parse(stored);
        const validatedHoles = data.validatedHoles || [];
        const validatedCount = validatedHoles.filter((v: boolean) => v).length;
        const scores = data.scores || {};
        
        if (validatedCount > 0) {
          // Calculate team scores
          let teamATotal = 0;
          let teamBTotal = 0;
          
          for (let hole = 0; hole < 18; hole++) {
            if (!validatedHoles[hole]) continue;
            
            // Simple net score comparison for status display
            const teamAHoleScores = Object.keys(scores)
              .filter(id => teams.find(t => t.id === 'team-a')?.players.includes(id))
              .map(id => scores[id]?.[hole] || 0)
              .filter(s => s > 0);
            const teamBHoleScores = Object.keys(scores)
              .filter(id => teams.find(t => t.id === 'team-b')?.players.includes(id))
              .map(id => scores[id]?.[hole] || 0)
              .filter(s => s > 0);
            
            if (teamAHoleScores.length > 0 && teamBHoleScores.length > 0) {
              const teamABest = Math.min(...teamAHoleScores);
              const teamBBest = Math.min(...teamBHoleScores);
              if (teamABest < teamBBest) teamATotal++;
              else if (teamBBest < teamABest) teamBTotal++;
            }
          }
          
          const diff = teamATotal - teamBTotal;
          return {
            validatedCount,
            teamAStatus: diff > 0 ? `${diff} UP` : diff < 0 ? `${Math.abs(diff)} DOWN` : 'TIED',
            teamBStatus: diff < 0 ? `${Math.abs(diff)} UP` : diff > 0 ? `${diff} DOWN` : 'TIED',
            isLeadingA: diff > 0,
            isLeadingB: diff < 0,
          };
        }
        return { validatedCount: 0 };
      }
    } catch (e) {
      console.error('Failed to get match status:', e);
    }
    return null;
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

  const handleStartGame = (match: DisplayMatch) => {
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

  // Get all finalized fixture days with their matches
  const finalizedFixtureDays = fixtureDays.filter(fd => fd.teamALockedIn && fd.teamBLockedIn);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-fade-up">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Play Game
            </h1>
            <p className="text-muted-foreground">
              Start a game and track scores in real-time
            </p>
          </div>
        </div>

        {/* Games List */}
        {finalizedFixtureDays.length > 0 ? (
          <Card className="animate-fade-up">
            <CardContent className="pt-6">
              <Accordion type="multiple" defaultValue={finalizedFixtureDays.map(fd => fd.id)}>
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
                      }))
                    : (fixtureDay.teamAPairings || []).map((teamAPlayers, idx) => ({
                        id: `match-${fixtureDay.id}-${idx}`,
                        teamAPlayers: teamAPlayers || [],
                        teamBPlayers: fixtureDay.teamBPairings?.[idx] || [],
                        fixtureDayId: fixtureDay.id,
                        fixtureDayNumber: fixtureDay.dayNumber,
                        courseName: fixtureDay.courseName || `Day ${fixtureDay.dayNumber}`,
                        gameFormat: fixtureDay.gameFormat,
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
                            const matchStatus = getMatchStatus(match.id);
                            
                            return (
                            <div 
                              key={match.id} 
                              className={`p-4 rounded-lg border ${inProgress ? 'bg-primary/5 border-primary/30' : 'bg-muted/50'}`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                  <Swords className="w-4 h-4" />
                                  {isSingles ? `Match ${matchIdx + 1}` : `Flight ${matchIdx + 1}`}
                                  {inProgress && matchStatus?.validatedCount != null && matchStatus.validatedCount > 0 && (
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
                                    onClick={() => handleStartGame(match)}
                                  >
                                    <PlayIcon className="w-4 h-4 mr-2" />
                                    {inProgress ? 'Continue' : 'Start Game'}
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Show match status if in progress */}
                              {inProgress && matchStatus?.validatedCount != null && matchStatus.validatedCount > 0 && (
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                  <div className={`p-3 rounded-lg border-2 text-center font-bold ${
                                    matchStatus.isLeadingA 
                                      ? 'bg-blue-100 border-blue-400 text-blue-700' 
                                      : matchStatus.isLeadingB 
                                        ? 'bg-red-100 border-red-400 text-red-600' 
                                        : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                                  }`}>
                                    <div className="text-xs uppercase tracking-wide mb-1 opacity-70">{teamA?.name}</div>
                                    <div className="text-lg">{matchStatus.teamAStatus}</div>
                                  </div>
                                  <div className={`p-3 rounded-lg border-2 text-center font-bold ${
                                    matchStatus.isLeadingB 
                                      ? 'bg-blue-100 border-blue-400 text-blue-700' 
                                      : matchStatus.isLeadingA 
                                        ? 'bg-red-100 border-red-400 text-red-600' 
                                        : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                                  }`}>
                                    <div className="text-xs uppercase tracking-wide mb-1 opacity-70">{teamB?.name}</div>
                                    <div className="text-lg">{matchStatus.teamBStatus}</div>
                                  </div>
                                </div>
                              )}
                              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                                {/* Team A players */}
                                <div className="space-y-2">
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
                                
                                {/* Team B players */}
                                <div className="space-y-2">
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
                          )})}
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
              <PlayIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-lg font-medium text-foreground mb-2">No games ready to play</p>
              <p className="text-muted-foreground">
                Both captains must lock in their selections to finalize games before playing
              </p>
            </CardContent>
          </Card>
        )}
      </div>

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
