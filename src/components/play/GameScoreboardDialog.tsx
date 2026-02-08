import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTrip } from '@/contexts/TripContext';
import { useLeaderboard } from '@/contexts/LeaderboardContext';
import { Match, GameFormat, ScoringType } from '@/types/golf';
import { Trophy, Flag, Info, CheckCircle2 } from 'lucide-react';
import {
  calculateStrokesPerHole,
  calculateStablefordPoints,
  calculateHighLowHole,
  HOLE_PARS,
  STROKE_INDEX,
  FORMAT_DESCRIPTIONS,
  SCORING_DESCRIPTIONS,
} from '@/lib/scoring';
import { getPlayingHandicap, getCourseInfo } from '@/lib/strokeTable';
import {
  calculateHoleByHoleStatus,
  checkGameWon,
  getHoleStatusDisplay,
  TEAM_COLORS,
  HoleStatus,
  GameWonStatus,
} from '@/lib/gameStatus';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { GameWonDialog } from './GameWonDialog';

interface DisplayMatch extends Match {
  fixtureDayId: string;
  fixtureDayNumber: number;
  courseName: string;
  gameFormat: GameFormat;
  scoringType?: ScoringType;
}

export interface StrokeTableData {
  fileName: string;
  fileType: string;
  courseRating?: number;
  slopeRating?: number;
  holePars?: number[];
  strokeIndexes?: number[];
}

interface GameScoreboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: DisplayMatch;
  teeColor?: 'yellow' | 'white';
  strokeTableData?: StrokeTableData;
}

interface PlayerHoleScore {
  grossScore: number;
  strokes: number;
  netScore: number;
  stablefordPoints: number;
}

interface StoredMatchScores {
  scores: Record<string, number[]>;
  validatedHoles: boolean[];
  lastUpdated: string;
  gameWonStatus?: GameWonStatus;
}

const STORAGE_KEY_PREFIX = 'golf-match-scores-';

export function GameScoreboardDialog({ open, onOpenChange, match, teeColor = 'yellow', strokeTableData }: GameScoreboardDialogProps) {
  const { players, teams, markGameStarted, markGameComplete } = useTrip();
  const { updateMatchScore } = useLeaderboard();
  
  const allPlayerIds = [...match.teamAPlayers, ...match.teamBPlayers];
  const gameFormat = match.gameFormat;
  const scoringType = match.scoringType || 'strokeplay';
  const storageKey = `${STORAGE_KEY_PREFIX}${match.id}`;
  
  // Mark game as started when dialog opens
  useEffect(() => {
    if (open) {
      markGameStarted(match.id, allPlayerIds, match.courseName);
    }
  }, [open, match.id, match.courseName]);
  
  // Calculate playing handicaps based on handicap index and tee color
  const playerPlayingHandicaps = useMemo(() => {
    const handicaps: Record<string, { index: number; playing: number }> = {};
    allPlayerIds.forEach(id => {
      const player = players.find(p => p.id === id);
      const handicapIndex = player?.handicap || 0;
      const playingHandicap = getPlayingHandicap(handicapIndex, teeColor);
      handicaps[id] = { index: handicapIndex, playing: playingHandicap };
    });
    return handicaps;
  }, [allPlayerIds, players, teeColor]);

  // Get player strokes per hole based on PLAYING handicap (not index)
  const playerStrokes = useMemo(() => {
    const strokes: Record<string, number[]> = {};
    allPlayerIds.forEach(id => {
      const playingHcp = playerPlayingHandicaps[id]?.playing || 0;
      strokes[id] = calculateStrokesPerHole(playingHcp);
    });
    return strokes;
  }, [allPlayerIds, playerPlayingHandicaps]);

  // Load scores from localStorage
  const loadStoredScores = (): StoredMatchScores | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load stored scores:', e);
    }
    return null;
  };

  // Initialize scores state - 18 holes per player (gross scores)
  const [scores, setScores] = useState<Record<string, number[]>>(() => {
    const stored = loadStoredScores();
    if (stored?.scores) {
      return stored.scores;
    }
    const initial: Record<string, number[]> = {};
    allPlayerIds.forEach(id => {
      initial[id] = Array(18).fill(0);
    });
    return initial;
  });

  // Track which holes are validated (only validated holes count for points)
  const [validatedHoles, setValidatedHoles] = useState<boolean[]>(() => {
    const stored = loadStoredScores();
    if (stored?.validatedHoles) {
      return stored.validatedHoles;
    }
    return Array(18).fill(false);
  });

  const [currentHole, setCurrentHole] = useState(1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showGameWonDialog, setShowGameWonDialog] = useState(false);
  const [gameWonTriggered, setGameWonTriggered] = useState(false);

  // Reset state when match changes (different flight/match opened)
  useEffect(() => {
    const stored = loadStoredScores();
    if (stored?.scores) {
      setScores(stored.scores);
    } else {
      const initial: Record<string, number[]> = {};
      allPlayerIds.forEach(id => {
        initial[id] = Array(18).fill(0);
      });
      setScores(initial);
    }
    
    if (stored?.validatedHoles) {
      setValidatedHoles(stored.validatedHoles);
    } else {
      setValidatedHoles(Array(18).fill(false));
    }
    
    // Always start at hole 1 for a new match
    setCurrentHole(1);
    setHasUnsavedChanges(false);
    setGameWonTriggered(stored?.gameWonStatus?.isWon || false);
  }, [match.id]);

  const teamA = teams.find(t => t.id === 'team-a');
  const teamB = teams.find(t => t.id === 'team-b');
  
  // Get team player names for display
  const teamANames = match.teamAPlayers.map(id => players.find(p => p.id === id)?.name.split(' ')[0]).join(' / ');
  const teamBNames = match.teamBPlayers.map(id => players.find(p => p.id === id)?.name.split(' ')[0]).join(' / ');

  const getPlayerHoleScore = (playerId: string, hole: number, includeUnvalidated = false): PlayerHoleScore => {
    const grossScore = scores[playerId]?.[hole] || 0;
    const strokes = playerStrokes[playerId]?.[hole] || 0;
    
    // Only count validated holes for team scores
    if (!includeUnvalidated && !validatedHoles[hole]) {
      return { grossScore: 0, strokes: 0, netScore: 0, stablefordPoints: 0 };
    }
    
    const netScore = grossScore > 0 ? grossScore - strokes : 0;
    const stablefordPoints = grossScore > 0 
      ? calculateStablefordPoints(grossScore, HOLE_PARS[hole], strokes)
      : 0;
    
    return { grossScore, strokes, netScore, stablefordPoints };
  };

  // Calculate points per hole for high-low format
  const holePoints = useMemo(() => {
    const points: { teamA: number; teamB: number }[] = [];
    
    for (let hole = 0; hole < 18; hole++) {
      if (!validatedHoles[hole]) {
        points.push({ teamA: 0, teamB: 0 });
        continue;
      }

      if (gameFormat === 'high-low') {
        const teamAScores = match.teamAPlayers.map(id => ({
          playerId: id,
          grossScore: scores[id]?.[hole] || 0,
          strokes: playerStrokes[id]?.[hole] || 0,
        })).filter(s => s.grossScore > 0);

        const teamBScores = match.teamBPlayers.map(id => ({
          playerId: id,
          grossScore: scores[id]?.[hole] || 0,
          strokes: playerStrokes[id]?.[hole] || 0,
        })).filter(s => s.grossScore > 0);

        if (teamAScores.length >= 2 && teamBScores.length >= 2) {
          const result = calculateHighLowHole(teamAScores, teamBScores);
          points.push({ teamA: result.teamAPoints, teamB: result.teamBPoints });
        } else {
          points.push({ teamA: 0, teamB: 0 });
        }
      } else {
        // For other formats, use net score comparison per hole
        const teamANets = match.teamAPlayers.map(id => getPlayerHoleScore(id, hole).netScore).filter(n => n !== 0);
        const teamBNets = match.teamBPlayers.map(id => getPlayerHoleScore(id, hole).netScore).filter(n => n !== 0);
        
        if (teamANets.length > 0 && teamBNets.length > 0) {
          const teamABest = Math.min(...teamANets);
          const teamBBest = Math.min(...teamBNets);
          if (teamABest < teamBBest) {
            points.push({ teamA: 1, teamB: 0 });
          } else if (teamBBest < teamABest) {
            points.push({ teamA: 0, teamB: 1 });
          } else {
            points.push({ teamA: 0.5, teamB: 0.5 });
          }
        } else {
          points.push({ teamA: 0, teamB: 0 });
        }
      }
    }
    
    return points;
  }, [scores, validatedHoles, gameFormat, match.teamAPlayers, match.teamBPlayers, playerStrokes]);

  // Calculate hole-by-hole status
  const holeStatuses = useMemo(() => {
    return calculateHoleByHoleStatus(holePoints, validatedHoles);
  }, [holePoints, validatedHoles]);

  // Check if game is won
  const gameWonStatus = useMemo(() => {
    const pointsPerHole = gameFormat === 'high-low' ? 3 : 1;
    return checkGameWon(holeStatuses, validatedHoles, pointsPerHole);
  }, [holeStatuses, validatedHoles, gameFormat]);

  // Auto-save scores to localStorage whenever validated holes change
  const autoSaveScores = () => {
    try {
      const data: StoredMatchScores = {
        scores,
        validatedHoles,
        lastUpdated: new Date().toISOString(),
        gameWonStatus,
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
      
      const completedHoles = validatedHoles.filter(v => v).length;
      
      // Update leaderboard context with the scores
      allPlayerIds.forEach(playerId => {
        const totalGross = scores[playerId]?.reduce((sum, s, i) => 
          validatedHoles[i] ? sum + s : sum, 0) || 0;
        const totalNet = scores[playerId]?.reduce((sum, s, i) => {
          if (!validatedHoles[i] || s === 0) return sum;
          return sum + (s - (playerStrokes[playerId]?.[i] || 0));
        }, 0) || 0;
        
        updateMatchScore({
          matchId: match.id,
          fixtureDayId: match.fixtureDayId,
          playerId,
          grossScore: totalGross,
          netScore: totalNet,
          thruHole: completedHoles,
          isComplete: gameWonStatus.isWon || completedHoles === 18,
        });
      });
      
      setHasUnsavedChanges(false);
    } catch (e) {
      console.error('Failed to auto-save scores:', e);
    }
  };

  // Trigger game won dialog when game is decided
  useEffect(() => {
    if (gameWonStatus.isWon && !gameWonTriggered && open) {
      setGameWonTriggered(true);
      setShowGameWonDialog(true);
      markGameComplete(match.id);
    }
  }, [gameWonStatus.isWon, gameWonTriggered, open]);

  // Auto-save when validatedHoles changes
  useEffect(() => {
    if (open) {
      autoSaveScores();
    }
  }, [validatedHoles]);

  const handleScoreChange = (playerId: string, hole: number, value: string) => {
    const numValue = parseInt(value) || 0;
    const newScores = {
      ...scores,
      [playerId]: scores[playerId].map((s, i) => i === hole ? numValue : s)
    };
    setScores(newScores);
    setHasUnsavedChanges(true);
    
    // Auto-validate when all players have scores for this hole
    if (numValue > 0) {
      const allScoresEntered = allPlayerIds.every(id => {
        if (id === playerId) return numValue > 0;
        return newScores[id]?.[hole] > 0;
      });
      
      if (allScoresEntered && !validatedHoles[hole]) {
        setValidatedHoles(prev => {
          const updated = [...prev];
          updated[hole] = true;
          return updated;
        });
        
        // Auto-jump to next hole if not at hole 18
        if (hole < 17) {
          setTimeout(() => setCurrentHole(hole + 2), 300);
        }
      }
    }
  };

  const toggleHoleValidation = (hole: number) => {
    setValidatedHoles(prev => {
      const updated = [...prev];
      updated[hole] = !updated[hole];
      return updated;
    });
  };

  const getTotalGrossScore = (playerId: string, validatedOnly = false) => {
    return scores[playerId]?.reduce((sum, s, i) => {
      if (validatedOnly && !validatedHoles[i]) return sum;
      return sum + s;
    }, 0) || 0;
  };

  const getTotalNetScore = (playerId: string, validatedOnly = false) => {
    return scores[playerId]?.reduce((sum, gross, hole) => {
      if (validatedOnly && !validatedHoles[hole]) return sum;
      if (gross === 0) return sum;
      return sum + (gross - (playerStrokes[playerId]?.[hole] || 0));
    }, 0) || 0;
  };

  const getTotalStablefordPoints = (playerId: string, validatedOnly = false) => {
    return scores[playerId]?.reduce((sum, gross, hole) => {
      if (validatedOnly && !validatedHoles[hole]) return sum;
      if (gross === 0) return sum;
      return sum + calculateStablefordPoints(gross, HOLE_PARS[hole], playerStrokes[playerId]?.[hole] || 0);
    }, 0) || 0;
  };

  const getFrontNine = (playerId: string, type: 'gross' | 'net' | 'stableford', validatedOnly = false) => {
    return scores[playerId]?.slice(0, 9).reduce((sum, gross, hole) => {
      if (validatedOnly && !validatedHoles[hole]) return sum;
      if (gross === 0) return sum;
      if (type === 'gross') return sum + gross;
      if (type === 'net') return sum + (gross - (playerStrokes[playerId]?.[hole] || 0));
      return sum + calculateStablefordPoints(gross, HOLE_PARS[hole], playerStrokes[playerId]?.[hole] || 0);
    }, 0) || 0;
  };

  const getBackNine = (playerId: string, type: 'gross' | 'net' | 'stableford', validatedOnly = false) => {
    return scores[playerId]?.slice(9, 18).reduce((sum, gross, hole) => {
      if (validatedOnly && !validatedHoles[hole + 9]) return sum;
      if (gross === 0) return sum;
      if (type === 'gross') return sum + gross;
      if (type === 'net') return sum + (gross - (playerStrokes[playerId]?.[hole + 9] || 0));
      return sum + calculateStablefordPoints(gross, HOLE_PARS[hole + 9], playerStrokes[playerId]?.[hole + 9] || 0);
    }, 0) || 0;
  };

  const getScoreClass = (score: number, par: number, strokes: number) => {
    if (score === 0) return 'text-muted-foreground';
    const netScore = score - strokes;
    if (netScore < par) return 'text-green-500 font-bold';
    if (netScore === par) return 'text-foreground';
    if (netScore === par + 1) return 'text-orange-500';
    return 'text-red-500';
  };

  // Current display score
  const displayScore = useMemo(() => {
    // Find last validated hole status (ES5 compatible)
    let lastStatus: HoleStatus | undefined;
    for (let i = holeStatuses.length - 1; i >= 0; i--) {
      if (validatedHoles[i]) {
        lastStatus = holeStatuses[i];
        break;
      }
    }
    if (!lastStatus) {
      return { teamA: 0, teamB: 0 };
    }
    return {
      teamA: lastStatus.cumulativeTeamAPoints,
      teamB: lastStatus.cumulativeTeamBPoints,
    };
  }, [holeStatuses, validatedHoles]);

  const validatedCount = validatedHoles.filter(v => v).length;
  const isCurrentHoleValidated = validatedHoles[currentHole - 1];

  // Calculate overall standings for the game won dialog
  const overallStandings = useMemo(() => {
    // Calculate total points for each team from all completed games
    // For now, just use the current match points
    return [
      {
        teamId: 'team-a' as const,
        teamName: teamA?.name || 'Team A',
        previousPoints: 0,
        newPoints: displayScore.teamA,
        change: displayScore.teamA,
      },
      {
        teamId: 'team-b' as const,
        teamName: teamB?.name || 'Team B',
        previousPoints: 0,
        newPoints: displayScore.teamB,
        change: displayScore.teamB,
      },
    ];
  }, [displayScore, teamA, teamB]);

  // Finalize round - mark game as complete
  const finalizeRound = () => {
    if (validatedCount < 18 && !gameWonStatus.isWon) {
      toast.error('Please validate all 18 holes or wait for game to be decided');
      return;
    }
    markGameComplete(match.id);
    toast.success('Round finalized! Points added to team totals.');
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-primary" />
              <span className="font-display">
                {match.courseName} - {match.gameFormat.replace('-', ' ')}
              </span>
              <Badge variant="secondary">Day {match.fixtureDayNumber}</Badge>
              <Badge 
                variant="outline" 
                className={`gap-1 ${teeColor === 'yellow' ? 'border-yellow-500 text-yellow-600' : 'border-gray-400 text-gray-600'}`}
              >
                <div className={`w-3 h-3 rounded-full ${teeColor === 'yellow' ? 'bg-yellow-400' : 'bg-white border border-gray-400'}`} />
                {teeColor === 'yellow' ? 'Yellow' : 'White'} Tees
              </Badge>
              {gameWonStatus.isWon && (
                <Badge className={`${TEAM_COLORS[gameWonStatus.winningTeam!].bg} text-white`}>
                  Won {gameWonStatus.displayText}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Enter scores and validate each hole to update the leaderboard. {validatedCount}/18 holes validated.
              {strokeTableData && (
                <span className="ml-2 text-primary">• Stroke table: {strokeTableData.fileName}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Course & Tee Info */}
            {(() => {
              const courseInfo = getCourseInfo(teeColor);
              return (
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  <span><strong>{teeColor === 'yellow' ? 'Yellow' : 'White'} Tees:</strong> {courseInfo.length}</span>
                  <span>CR: {courseInfo.courseRating}</span>
                  <span>SR: {courseInfo.slopeRating}</span>
                </div>
              );
            })()}

            {/* Format Info */}
            <div className="flex flex-wrap gap-2 items-center text-sm">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="cursor-help">
                      <Info className="w-3 h-3 mr-1" />
                      {gameFormat.replace('-', ' ')}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{FORMAT_DESCRIPTIONS[gameFormat]}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="cursor-help">
                      {scoringType}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{SCORING_DESCRIPTIONS[scoringType]}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Badge variant={validatedCount === 18 || gameWonStatus.isWon ? "default" : "secondary"}>
                {gameWonStatus.isWon ? 'Game Decided' : `${validatedCount}/18 Validated`}
              </Badge>
              {hasUnsavedChanges && (
                <Badge variant="destructive">Unsaved changes</Badge>
              )}
            </div>

            {/* Current Hole Navigation */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentHole(Math.max(1, currentHole - 1))}
                disabled={currentHole === 1}
              >
                Previous Hole
              </Button>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-primary" />
                  <span className="text-lg font-bold">Hole {currentHole}</span>
                  <span className="text-muted-foreground">Par {HOLE_PARS[currentHole - 1]}</span>
                  <span className="text-xs text-muted-foreground">(SI: {STROKE_INDEX[currentHole - 1]})</span>
                </div>
                {isCurrentHoleValidated && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Validated
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentHole(Math.min(18, currentHole + 1))}
                disabled={currentHole === 18}
              >
                Next Hole
              </Button>
            </div>

            {/* Game Points Summary with consistent team colors */}
            {(() => {
              const diff = displayScore.teamA - displayScore.teamB;
              const teamAStatus = diff > 0 ? `${diff} UP` : diff < 0 ? `${Math.abs(diff)} DOWN` : 'TIED';
              const teamBStatus = diff < 0 ? `${Math.abs(diff)} UP` : diff > 0 ? `${diff} DOWN` : 'TIED';
              const leadingTeam = diff > 0 ? 'team-a' : diff < 0 ? 'team-b' : null;
              
              return (
                <div className="grid grid-cols-2 gap-4">
                  {/* Team A - Always Blue */}
                  <div 
                    className={`p-4 rounded-lg border-2 transition-all ${
                      leadingTeam === 'team-a' 
                        ? `${TEAM_COLORS['team-a'].bgLight} ${TEAM_COLORS['team-a'].border} ring-2 ${TEAM_COLORS['team-a'].ring}` 
                        : `${TEAM_COLORS['team-a'].bgLighter} ${TEAM_COLORS['team-a'].border}`
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-4 h-4 rounded-full ${TEAM_COLORS['team-a'].bg}`} />
                      <span className="font-semibold">{teamANames}</span>
                      {leadingTeam === 'team-a' && (
                        <Badge className={`text-xs ${TEAM_COLORS['team-a'].bg} text-white`}>Leading</Badge>
                      )}
                    </div>
                    <p className={`text-3xl font-bold ${
                      diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-foreground'
                    }`}>
                      {teamAStatus}
                    </p>
                    <p className="text-sm text-muted-foreground">Points (validated holes only)</p>
                    {gameWonStatus.isWon && gameWonStatus.winningTeam === 'team-a' && (
                      <Badge className="mt-2 bg-green-600 text-white">
                        Won {gameWonStatus.displayText}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Team B - Always Red */}
                  <div 
                    className={`p-4 rounded-lg border-2 transition-all ${
                      leadingTeam === 'team-b' 
                        ? `${TEAM_COLORS['team-b'].bgLight} ${TEAM_COLORS['team-b'].border} ring-2 ${TEAM_COLORS['team-b'].ring}` 
                        : `${TEAM_COLORS['team-b'].bgLighter} ${TEAM_COLORS['team-b'].border}`
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-4 h-4 rounded-full ${TEAM_COLORS['team-b'].bg}`} />
                      <span className="font-semibold">{teamBNames}</span>
                      {leadingTeam === 'team-b' && (
                        <Badge className={`text-xs ${TEAM_COLORS['team-b'].bg} text-white`}>Leading</Badge>
                      )}
                    </div>
                    <p className={`text-3xl font-bold ${
                      diff < 0 ? 'text-green-600' : diff > 0 ? 'text-red-600' : 'text-foreground'
                    }`}>
                      {teamBStatus}
                    </p>
                    <p className="text-sm text-muted-foreground">Points (validated holes only)</p>
                    {gameWonStatus.isWon && gameWonStatus.winningTeam === 'team-b' && (
                      <Badge className="mt-2 bg-green-600 text-white">
                        Won {gameWonStatus.displayText}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })()}
            
            {/* Game status note */}
            {!gameWonStatus.isWon && validatedCount < 18 && (
              <p className="text-xs text-muted-foreground text-center italic">
                Game points will be added to team totals ({teamA?.name} vs {teamB?.name}) when game is decided
              </p>
            )}
            {gameWonStatus.isWon && (
              <p className="text-xs text-green-600 text-center font-medium">
                ✓ Game decided on hole {gameWonStatus.decisionHole} - {gameWonStatus.winningTeam === 'team-a' ? teamANames : teamBNames} wins {gameWonStatus.displayText}
              </p>
            )}

            {/* High-Low Explanation */}
            {gameFormat === 'high-low' && (
              <div className="p-3 bg-muted/30 rounded-lg text-sm">
                <p className="font-medium mb-1">High-Low Scoring:</p>
                <p className="text-muted-foreground">
                  Best net score comparison = 2 points • Worst net score comparison = 1 point per hole
                </p>
              </div>
            )}

            {/* Scorecard Table with hole-by-hole status */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  {/* Hole-by-hole leader status row */}
                  <tr className="border-b">
                    <th className="p-1 text-left sticky left-0 bg-background"></th>
                    <th className="p-1"></th>
                    <th className="p-1"></th>
                    {[...Array(9)].map((_, i) => {
                      const status = holeStatuses[i];
                      const display = validatedHoles[i] ? getHoleStatusDisplay(status) : null;
                      const colors = display?.teamId ? TEAM_COLORS[display.teamId] : null;
                      
                      return (
                        <th key={`status-${i}`} className="p-1 text-center min-w-[40px]">
                          {display && (
                            <div className={`text-[10px] font-bold px-1 py-0.5 rounded ${
                              colors 
                                ? `${colors.bgLight} ${colors.textDark}` 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {display.text}
                            </div>
                          )}
                        </th>
                      );
                    })}
                    <th className="p-1"></th>
                    {[...Array(9)].map((_, i) => {
                      const status = holeStatuses[i + 9];
                      const display = validatedHoles[i + 9] ? getHoleStatusDisplay(status) : null;
                      const colors = display?.teamId ? TEAM_COLORS[display.teamId] : null;
                      
                      return (
                        <th key={`status-${i + 9}`} className="p-1 text-center min-w-[40px]">
                          {display && (
                            <div className={`text-[10px] font-bold px-1 py-0.5 rounded ${
                              colors 
                                ? `${colors.bgLight} ${colors.textDark}` 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {display.text}
                            </div>
                          )}
                        </th>
                      );
                    })}
                    <th className="p-1"></th>
                    <th className="p-1"></th>
                    {scoringType === 'stableford' && <th className="p-1"></th>}
                  </tr>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium sticky left-0 bg-background">Player</th>
                    <th className="p-2 text-center text-xs" title="Handicap Index">HI</th>
                    <th className="p-2 text-center text-xs" title="Playing Handicap">PH</th>
                    {[...Array(9)].map((_, i) => (
                      <th 
                        key={i} 
                        className={`p-2 text-center min-w-[40px] ${currentHole === i + 1 ? 'bg-primary/20' : ''} ${validatedHoles[i] ? 'bg-green-500/10' : ''}`}
                      >
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-0.5">
                            {i + 1}
                            {validatedHoles[i] && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                          </div>
                          <div className="text-[10px] text-muted-foreground">SI:{STROKE_INDEX[i]}</div>
                        </div>
                      </th>
                    ))}
                    <th className="p-2 text-center bg-muted font-bold">OUT</th>
                    {[...Array(9)].map((_, i) => (
                      <th 
                        key={i + 9} 
                        className={`p-2 text-center min-w-[40px] ${currentHole === i + 10 ? 'bg-primary/20' : ''} ${validatedHoles[i + 9] ? 'bg-green-500/10' : ''}`}
                      >
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-0.5">
                            {i + 10}
                            {validatedHoles[i + 9] && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                          </div>
                          <div className="text-[10px] text-muted-foreground">SI:{STROKE_INDEX[i + 9]}</div>
                        </div>
                      </th>
                    ))}
                    <th className="p-2 text-center bg-muted font-bold">IN</th>
                    <th className="p-2 text-center bg-primary/20 font-bold">TOT</th>
                    {scoringType === 'stableford' && (
                      <th className="p-2 text-center bg-green-500/20 font-bold">PTS</th>
                    )}
                  </tr>
                  <tr className="border-b bg-muted/30">
                    <td className="p-2 font-medium sticky left-0 bg-muted/30">Par</td>
                    <td className="p-2 text-center"></td>
                    <td className="p-2 text-center"></td>
                    {HOLE_PARS.slice(0, 9).map((par, i) => (
                      <td key={i} className="p-2 text-center text-muted-foreground">{par}</td>
                    ))}
                    <td className="p-2 text-center bg-muted font-medium">
                      {HOLE_PARS.slice(0, 9).reduce((a, b) => a + b, 0)}
                    </td>
                    {HOLE_PARS.slice(9, 18).map((par, i) => (
                      <td key={i + 9} className="p-2 text-center text-muted-foreground">{par}</td>
                    ))}
                    <td className="p-2 text-center bg-muted font-medium">
                      {HOLE_PARS.slice(9, 18).reduce((a, b) => a + b, 0)}
                    </td>
                    <td className="p-2 text-center bg-primary/20 font-medium">
                      {HOLE_PARS.reduce((a, b) => a + b, 0)}
                    </td>
                    {scoringType === 'stableford' && <td></td>}
                  </tr>
                </thead>
                <tbody>
                  {allPlayerIds.map((playerId) => {
                    const player = players.find(p => p.id === playerId);
                    const isTeamA = match.teamAPlayers.includes(playerId);
                    const teamColorKey = isTeamA ? 'team-a' : 'team-b';
                    const teamColors = TEAM_COLORS[teamColorKey];
                    
                    return (
                      <tr key={playerId} className="border-b hover:bg-muted/30">
                        <td className="p-2 sticky left-0 bg-background">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${teamColors.bg}`} />
                            <span className="font-medium">{player?.name}</span>
                          </div>
                        </td>
                        <td className="p-2 text-center text-xs text-muted-foreground" title="Handicap Index">
                          {playerPlayingHandicaps[playerId]?.index}
                        </td>
                        <td className="p-2 text-center text-xs font-medium text-primary" title="Playing Handicap">
                          {playerPlayingHandicaps[playerId]?.playing}
                        </td>
                        {[...Array(9)].map((_, i) => {
                          const strokes = playerStrokes[playerId]?.[i] || 0;
                          const isValidated = validatedHoles[i];
                          const hasScore = scores[playerId]?.[i] > 0;
                          return (
                            <td key={i} className={`p-1 text-center ${currentHole === i + 1 ? 'bg-primary/20' : ''} ${isValidated ? 'bg-green-500/5' : ''}`}>
                              <div className="relative">
                                {!hasScore && (
                                  <span className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground/40 pointer-events-none z-0">
                                    {HOLE_PARS[i]}
                                  </span>
                                )}
                                <Input
                                  type="number"
                                  min="1"
                                  max="15"
                                  value={scores[playerId]?.[i] || ''}
                                  onChange={(e) => handleScoreChange(playerId, i, e.target.value)}
                                  className={`w-10 h-8 text-center p-0 bg-transparent ${getScoreClass(scores[playerId]?.[i] || 0, HOLE_PARS[i], strokes)} ${isValidated ? 'border-green-500' : ''}`}
                                />
                                {strokes > 0 && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full text-[8px] text-white flex items-center justify-center">
                                    {strokes}
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-2 text-center bg-muted font-bold">
                          {getFrontNine(playerId, 'gross') || '-'}
                          {scoringType === 'strokeplay' && getFrontNine(playerId, 'net') > 0 && (
                            <div className="text-xs text-muted-foreground">({getFrontNine(playerId, 'net')})</div>
                          )}
                        </td>
                        {[...Array(9)].map((_, i) => {
                          const strokes = playerStrokes[playerId]?.[i + 9] || 0;
                          const isValidated = validatedHoles[i + 9];
                          const hasScore = scores[playerId]?.[i + 9] > 0;
                          return (
                            <td key={i + 9} className={`p-1 text-center ${currentHole === i + 10 ? 'bg-primary/20' : ''} ${isValidated ? 'bg-green-500/5' : ''}`}>
                              <div className="relative">
                                {!hasScore && (
                                  <span className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground/40 pointer-events-none z-0">
                                    {HOLE_PARS[i + 9]}
                                  </span>
                                )}
                                <Input
                                  type="number"
                                  min="1"
                                  max="15"
                                  value={scores[playerId]?.[i + 9] || ''}
                                  onChange={(e) => handleScoreChange(playerId, i + 9, e.target.value)}
                                  className={`w-10 h-8 text-center p-0 bg-transparent ${getScoreClass(scores[playerId]?.[i + 9] || 0, HOLE_PARS[i + 9], strokes)} ${isValidated ? 'border-green-500' : ''}`}
                                />
                                {strokes > 0 && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full text-[8px] text-white flex items-center justify-center">
                                    {strokes}
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-2 text-center bg-muted font-bold">
                          {getBackNine(playerId, 'gross') || '-'}
                          {scoringType === 'strokeplay' && getBackNine(playerId, 'net') > 0 && (
                            <div className="text-xs text-muted-foreground">({getBackNine(playerId, 'net')})</div>
                          )}
                        </td>
                        <td className="p-2 text-center bg-primary/20 font-bold text-lg">
                          {getTotalGrossScore(playerId) || '-'}
                          {scoringType === 'strokeplay' && getTotalNetScore(playerId) > 0 && (
                            <div className="text-xs text-muted-foreground">({getTotalNetScore(playerId)})</div>
                          )}
                        </td>
                        {scoringType === 'stableford' && (
                          <td className="p-2 text-center bg-green-500/20 font-bold text-lg text-green-600">
                            {getTotalStablefordPoints(playerId) || '-'}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Handicap stroke</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                <span>Validated hole (counts for points)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-green-500 font-bold">Green</span>
                <span>= Under par</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-orange-500">Orange</span>
                <span>= Bogey</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-red-500">Red</span>
                <span>= Double+</span>
              </div>
              <div className="flex items-center gap-2 ml-4 border-l pl-4">
                <div className={`w-3 h-3 rounded-full ${TEAM_COLORS['team-a'].bg}`}></div>
                <span>Team A (Blue)</span>
                <div className={`w-3 h-3 rounded-full ${TEAM_COLORS['team-b'].bg}`}></div>
                <span>Team B (Red)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {(validatedCount === 18 || gameWonStatus.isWon) && (
                <Button variant="hero" onClick={finalizeRound}>
                  <Trophy className="w-4 h-4 mr-2" />
                  Finalize Round
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Game Won Dialog */}
      <GameWonDialog
        open={showGameWonDialog}
        onOpenChange={setShowGameWonDialog}
        winningTeamId={gameWonStatus.winningTeam || 'team-a'}
        winningTeamName={gameWonStatus.winningTeam === 'team-a' ? teamANames : teamBNames}
        losingTeamName={gameWonStatus.winningTeam === 'team-a' ? teamBNames : teamANames}
        winMargin={gameWonStatus.displayText}
        teamStandings={overallStandings}
      />
    </>
  );
}
