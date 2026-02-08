import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
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
import { PlayerDropZone } from './PlayerDropZone';
import { PairingZone } from './PairingZone';
import { DraggablePlayerCard } from './DraggablePlayerCard';
import { FixtureDay, Match, Flight, Player, GameFormat } from '@/types/golf';
import { 
  Lock, 
  Unlock, 
  Shuffle, 
  ArrowUpDown, 
  Check, 
  RotateCcw,
  Users,
  Swords,
  Trophy
} from 'lucide-react';
import { toast } from 'sonner';

interface CaptainFixtureManagerProps {
  fixtureDay: FixtureDay;
  captainTeam: 'team-a' | 'team-b';
}

type MatchingMethod = 'handicap' | 'random' | 'manual';

export function CaptainFixtureManager({ fixtureDay, captainTeam }: CaptainFixtureManagerProps) {
  const { 
    players, 
    teams, 
    updateFixtureDay, 
    lockInTeam, 
    resetFixtureDay 
  } = useTrip();
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [matchingMethod, setMatchingMethod] = useState<MatchingMethod | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const teamA = teams.find(t => t.id === 'team-a');
  const teamB = teams.find(t => t.id === 'team-b');
  const myTeam = captainTeam === 'team-a' ? teamA : teamB;
  const otherTeam = captainTeam === 'team-a' ? teamB : teamA;

  const myPlayers = useMemo(() => 
    players.filter(p => myTeam?.players.includes(p.id)),
    [players, myTeam]
  );

  const otherPlayers = useMemo(() =>
    players.filter(p => otherTeam?.players.includes(p.id)),
    [players, otherTeam]
  );

  const isSingles = fixtureDay.gameFormat === 'singles';
  const isMyTeamLocked = captainTeam === 'team-a' ? fixtureDay.teamALockedIn : fixtureDay.teamBLockedIn;
  const isOtherTeamLocked = captainTeam === 'team-a' ? fixtureDay.teamBLockedIn : fixtureDay.teamALockedIn;
  const bothTeamsLocked = fixtureDay.teamALockedIn && fixtureDay.teamBLockedIn;

  // Get the correct pairings for this captain's team
  const getInitialPairings = useCallback((): string[][] => {
    const savedPairings = captainTeam === 'team-a' 
      ? fixtureDay.teamAPairings 
      : fixtureDay.teamBPairings;
    
    // If saved pairings exist and contain valid player IDs for this team, use them
    if (savedPairings && savedPairings.length > 0) {
      const myTeamPlayerIds = myTeam?.players || [];
      const validPairings = savedPairings.map(pair => 
        pair.filter(id => myTeamPlayerIds.includes(id))
      );
      // Only use if at least one player is assigned
      if (validPairings.some(pair => pair.length > 0)) {
        return validPairings;
      }
    }
    return [[], []];
  }, [captainTeam, fixtureDay.teamAPairings, fixtureDay.teamBPairings, myTeam?.players]);

  // State for manual pairings (2v2 formats)
  const [myPairings, setMyPairings] = useState<string[][]>(getInitialPairings);

  // Reset pairings when captain team or fixture day changes
  useEffect(() => {
    setMyPairings(getInitialPairings());
  }, [captainTeam, fixtureDay.id, getInitialPairings]);

  // State for manual singles order
  const [myPlayerOrder, setMyPlayerOrder] = useState<string[]>(
    myPlayers.map(p => p.id)
  );

  // Reset player order when captain team, fixture day, or players change
  useEffect(() => {
    setMyPlayerOrder(myPlayers.map(p => p.id));
  }, [captainTeam, fixtureDay.id, myPlayers]);

  // Available players (not yet assigned to a pair)
  const availablePlayers = useMemo(() => {
    const assignedPlayerIds = myPairings.flat();
    return myPlayers.filter(p => !assignedPlayerIds.includes(p.id));
  }, [myPlayers, myPairings]);

  const activePlayer = activeId ? players.find(p => p.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activePlayerId = active.id as string;
    const overId = over.id as string;

    if (isSingles) {
      // Reorder player order for singles
      const oldIndex = myPlayerOrder.indexOf(activePlayerId);
      const newIndex = myPlayerOrder.indexOf(overId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        setMyPlayerOrder(arrayMove(myPlayerOrder, oldIndex, newIndex));
      }
    } else {
      // Handle 2v2 pairing drag and drop
      const findPlayerPairIndex = (playerId: string) => {
        for (let i = 0; i < myPairings.length; i++) {
          if (myPairings[i]?.includes(playerId)) return i;
        }
        return -1;
      };

      // Check if dropping on a pair zone
      const isPairZone = overId.startsWith('pair-');
      const isAvailableZone = overId === 'available-players';
      const sourcePairIndex = findPlayerPairIndex(activePlayerId);
      
      if (isPairZone) {
        const targetPairIndex = parseInt(overId.replace('pair-', ''));
        
        // Don't do anything if already in this pair
        if (sourcePairIndex === targetPairIndex) return;
        
        // Check if target pair is full
        if (myPairings[targetPairIndex]?.length >= 2) {
          toast.error('This pair is already full');
          return;
        }
        
        // Remove from source (either available or another pair)
        const newPairings = [...myPairings];
        
        if (sourcePairIndex >= 0) {
          newPairings[sourcePairIndex] = newPairings[sourcePairIndex].filter(id => id !== activePlayerId);
        }
        
        // Add to target pair
        if (!newPairings[targetPairIndex]) {
          newPairings[targetPairIndex] = [];
        }
        newPairings[targetPairIndex] = [...newPairings[targetPairIndex], activePlayerId];
        
        setMyPairings(newPairings);
      } else if (isAvailableZone && sourcePairIndex >= 0) {
        // Move back to available
        const newPairings = [...myPairings];
        newPairings[sourcePairIndex] = newPairings[sourcePairIndex].filter(id => id !== activePlayerId);
        setMyPairings(newPairings);
      }
    }
  };

  const sortByHandicap = useCallback((playerList: Player[]) => {
    return [...playerList].sort((a, b) => a.handicap - b.handicap);
  }, []);

  const shufflePlayers = useCallback((playerList: Player[]) => {
    const shuffled = [...playerList];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  const handleMatchByHandicap = () => {
    setMatchingMethod('handicap');
    const sorted = sortByHandicap(myPlayers);
    
    if (isSingles) {
      setMyPlayerOrder(sorted.map(p => p.id));
    } else {
      // For 2v2: auto-pair by handicap (1+2 in pair 1, 3+4 in pair 2, etc.)
      const pairings: string[][] = [];
      for (let i = 0; i < sorted.length; i += 2) {
        const pair = [sorted[i]?.id].filter(Boolean);
        if (sorted[i + 1]) pair.push(sorted[i + 1].id);
        pairings.push(pair);
      }
      setMyPairings(pairings);
    }
    toast.success('Players sorted by handicap');
  };

  const handleRandomize = () => {
    setMatchingMethod('random');
    const shuffled = shufflePlayers(myPlayers);
    
    if (isSingles) {
      setMyPlayerOrder(shuffled.map(p => p.id));
    } else {
      // For 2v2: auto-pair randomly
      const pairings: string[][] = [];
      for (let i = 0; i < shuffled.length; i += 2) {
        const pair = [shuffled[i]?.id].filter(Boolean);
        if (shuffled[i + 1]) pair.push(shuffled[i + 1].id);
        pairings.push(pair);
      }
      setMyPairings(pairings);
    }
    toast.success('Players randomized');
  };

  const handleManualMode = () => {
    setMatchingMethod('manual');
    toast.info('Drag players to reorder matchups');
  };

  const handleLockIn = () => {
    if (isSingles) {
      // For singles, we need to MERGE player orders, not overwrite
      // Get existing matches and update only this team's players
      const existingMatches = fixtureDay.matches || [];
      const numPlayers = myPlayerOrder.length;
      
      // Create or update matches to include this team's player order
      const newMatches = myPlayerOrder.map((playerId, index) => {
        const existingMatch = existingMatches[index];
        return {
          id: `match-${fixtureDay.id}-${index}`,
          teamAPlayers: captainTeam === 'team-a' 
            ? [playerId] 
            : (existingMatch?.teamAPlayers || []),
          teamBPlayers: captainTeam === 'team-b' 
            ? [playerId] 
            : (existingMatch?.teamBPlayers || []),
        };
      });
      
      updateFixtureDay(fixtureDay.id, {
        matches: newMatches,
        matchingMethod: matchingMethod || 'manual',
      });
    } else {
      updateFixtureDay(fixtureDay.id, {
        teamAPairings: captainTeam === 'team-a' ? myPairings : fixtureDay.teamAPairings,
        teamBPairings: captainTeam === 'team-b' ? myPairings : fixtureDay.teamBPairings,
      });
    }
    
    lockInTeam(fixtureDay.id, captainTeam);
    toast.success(`${myTeam?.name} selections locked in!`);
  };

  const handleReset = () => {
    resetFixtureDay(fixtureDay.id);
    setMyPlayerOrder(myPlayers.map(p => p.id));
    setMyPairings([[], []]);
    setMatchingMethod(null);
    setIsEditing(false);
    toast.info('Fixture day reset - both captains must re-confirm');
  };

  // Generate matches when both teams are locked in (for 2v2 formats)
  const generatedMatches = useMemo(() => {
    if (!bothTeamsLocked) return [];
    
    if (isSingles) {
      // For singles, matches should already be set from handleLockIn
      // But we need to combine both teams' player orders
      const teamAOrder = fixtureDay.matches
        .filter(m => m.teamAPlayers.length > 0)
        .map(m => m.teamAPlayers[0]);
      const teamBOrder = fixtureDay.matches
        .filter(m => m.teamBPlayers.length > 0)
        .map(m => m.teamBPlayers[0]);
      
      // Combine into proper matches
      const matches: Match[] = [];
      const maxLength = Math.max(teamAOrder.length, teamBOrder.length);
      for (let i = 0; i < maxLength; i++) {
        matches.push({
          id: `match-${fixtureDay.id}-${i}`,
          teamAPlayers: teamAOrder[i] ? [teamAOrder[i]] : [],
          teamBPlayers: teamBOrder[i] ? [teamBOrder[i]] : [],
        });
      }
      return matches;
    } else {
      // For 2v2 formats (high-low, best-ball, etc.), combine pairings
      const teamAPairings = fixtureDay.teamAPairings || [];
      const teamBPairings = fixtureDay.teamBPairings || [];
      
      const matches: Match[] = [];
      const numPairs = Math.max(teamAPairings.length, teamBPairings.length);
      
      for (let i = 0; i < numPairs; i++) {
        const teamAPlayers = teamAPairings[i] || [];
        const teamBPlayers = teamBPairings[i] || [];
        
        if (teamAPlayers.length > 0 || teamBPlayers.length > 0) {
          matches.push({
            id: `match-${fixtureDay.id}-${i}`,
            teamAPlayers,
            teamBPlayers,
          });
        }
      }
      return matches;
    }
  }, [bothTeamsLocked, fixtureDay.matches, fixtureDay.teamAPairings, fixtureDay.teamBPairings, fixtureDay.id, isSingles]);

  const generateFlights = useCallback(() => {
    if (!bothTeamsLocked) return [];

    const flights: Flight[] = [];
    
    if (isSingles) {
      // Pair up singles matches into flights of 4
      for (let i = 0; i < generatedMatches.length; i += 2) {
        const flightPlayers: string[] = [];
        
        // First match in flight
        const match1 = generatedMatches[i];
        if (match1) {
          flightPlayers.push(...match1.teamAPlayers, ...match1.teamBPlayers);
        }
        
        // Second match in flight (if exists)
        const match2 = generatedMatches[i + 1];
        if (match2) {
          flightPlayers.push(...match2.teamAPlayers, ...match2.teamBPlayers);
        }
        
        flights.push({
          id: `flight-${i / 2}`,
          matchIds: [generatedMatches[i]?.id, generatedMatches[i + 1]?.id].filter(Boolean) as string[],
          players: flightPlayers,
        });
      }
    } else {
      // For 2v2: each match becomes a flight (4 players per flight)
      generatedMatches.forEach((match, idx) => {
        flights.push({
          id: `flight-${idx}`,
          matchIds: [match.id],
          players: [...match.teamAPlayers, ...match.teamBPlayers],
        });
      });
    }
    
    return flights;
  }, [bothTeamsLocked, generatedMatches, isSingles]);

  useEffect(() => {
    if (!bothTeamsLocked) return;

    const flights = generateFlights();

    const shouldUpdate =
      fixtureDay.matches.length !== generatedMatches.length ||
      fixtureDay.flights.length !== flights.length ||
      !fixtureDay.isFinalized;

    if (shouldUpdate) {
      updateFixtureDay(fixtureDay.id, {
        matches: generatedMatches,
        flights,
        isFinalized: true,
      });
    }
  }, [
    bothTeamsLocked,
    fixtureDay.id,
    fixtureDay.matches.length,
    fixtureDay.flights.length,
    fixtureDay.isFinalized,
    generatedMatches,
    generateFlights,
    updateFixtureDay,
  ]);

  const orderedPlayers = myPlayerOrder.map(id => myPlayers.find(p => p.id === id)).filter(Boolean) as Player[];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Card>
        <CardContent className="pt-6">
          <Accordion type="multiple" defaultValue={['header', 'matchup', 'finalized']}>
            {/* Header Section */}
            <AccordionItem value="header" className="border-none">
              <AccordionTrigger className="hover:no-underline py-0 mb-2">
                <div className="flex items-center gap-3 w-full pr-4">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: myTeam?.color }}
                  />
                  <span className="font-display text-lg">{myTeam?.name} Captain View</span>
                  <div className="flex items-center gap-2 ml-auto">
                    <Badge variant={isMyTeamLocked ? "default" : "secondary"} className="text-xs">
                      {isMyTeamLocked ? (
                        <><Lock className="w-3 h-3 mr-1" /> Locked</>
                      ) : (
                        <><Unlock className="w-3 h-3 mr-1" /> Pending</>
                      )}
                    </Badge>
                    <Badge variant={isOtherTeamLocked ? "default" : "outline"} className="text-xs">
                      {otherTeam?.name}: {isOtherTeamLocked ? 'Ready' : 'Waiting'}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground pl-7">
                  <Trophy className="w-4 h-4" />
                  <span>Day {fixtureDay.dayNumber}</span>
                  <span>•</span>
                  <span className="capitalize">{fixtureDay.gameFormat.replace('-', ' ')}</span>
                  <span>•</span>
                  <span className="capitalize">{fixtureDay.scoringType}</span>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Matching Options - Show when not locked OR when editing */}
            {(!isMyTeamLocked || isEditing) && (
              <AccordionItem value="matchup" className="border-none mt-4">
                <AccordionTrigger className="hover:no-underline py-0 mb-2">
                  <div className="flex items-center gap-2">
                    <Swords className="w-5 h-5" />
                    <span className="font-medium">{isSingles ? 'Singles Matchup Order' : 'Team Pairings'}</span>
                    {isEditing && <Badge variant="secondary" className="ml-2">Editing</Badge>}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={matchingMethod === 'handicap' ? 'default' : 'outline'}
                        size="sm"
                        onClick={handleMatchByHandicap}
                      >
                        <ArrowUpDown className="w-4 h-4 mr-2" />
                        By Handicap
                      </Button>
                      <Button
                        variant={matchingMethod === 'random' ? 'default' : 'outline'}
                        size="sm"
                        onClick={handleRandomize}
                      >
                        <Shuffle className="w-4 h-4 mr-2" />
                        Randomize
                      </Button>
                    </div>

                    {/* Singles: All players listed - drag to reorder */}
                    {isSingles && (
                      <PlayerDropZone
                        id="my-players"
                        title="Drag to reorder (Top plays vs Top)"
                        players={orderedPlayers}
                        teamColor={myTeam?.color}
                        disabled={false}
                      />
                    )}

                    {/* 2v2: Side by side layout */}
                    {!isSingles && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <PlayerDropZone
                          id="available-players"
                          title="Drag from here →"
                          players={availablePlayers}
                          teamColor={myTeam?.color}
                          disabled={false}
                          emptyMessage="All players assigned"
                        />
                        
                        <div className="space-y-3">
                          {Array.from({ length: Math.ceil(myPlayers.length / 2) }).map((_, idx) => (
                            <PairingZone
                              key={idx}
                              id={`pair-${idx}`}
                              pairIndex={idx}
                              players={myPairings[idx]?.map(id => myPlayers.find(p => p.id === id)).filter(Boolean) as Player[] || []}
                              teamColor={myTeam?.color}
                              disabled={false}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t">
                      {isEditing ? (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="hero"
                            onClick={() => {
                              handleLockIn();
                              setIsEditing(false);
                            }}
                            className="flex-1"
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            Save Changes
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="hero"
                          onClick={handleLockIn}
                          className="flex-1"
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Lock In Selections
                        </Button>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Locked State - show when locked but not editing */}
            {isMyTeamLocked && !bothTeamsLocked && !isEditing && (
              <AccordionItem value="locked" className="border-none mt-4">
                <div className="p-6 rounded-lg border-primary/50 bg-primary/5 text-center">
                  <Check className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2">Your Selections Are Locked</h3>
                  <p className="text-muted-foreground mb-4">
                    Waiting for {otherTeam?.name} captain to lock in their selections...
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Unlock className="w-4 h-4 mr-2" />
                      Edit Selections
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleReset}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset All
                    </Button>
                  </div>
                </div>
              </AccordionItem>
            )}

            {/* Both Teams Locked - Show Final Matchups */}
            {bothTeamsLocked && !isEditing && (
              <AccordionItem value="finalized" className="border-none mt-4">
                <AccordionTrigger className="hover:no-underline py-0 mb-2 p-4 rounded-lg bg-accent/10 border border-accent/30">
                  <div className="flex items-center gap-2 w-full pr-4">
                    <Trophy className="w-5 h-5 text-accent" />
                    <span className="font-display text-lg text-accent">Fixture Finalized!</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                    >
                      <Unlock className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {generatedMatches.length > 0 ? (
                      generatedMatches.map((match, idx) => (
                        <div key={match.id} className="p-4 rounded-lg bg-card border">
                          <h4 className="font-semibold mb-3">
                            {isSingles ? `Match ${idx + 1}` : `Flight ${idx + 1}`}
                          </h4>
                          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                            {/* Team A */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: teamA?.color }}
                                />
                                {teamA?.name}
                              </div>
                              {match.teamAPlayers.map(playerId => {
                                const player = players.find(p => p.id === playerId);
                                return player ? (
                                  <div 
                                    key={playerId}
                                    className="flex items-center gap-2 p-2 rounded bg-muted/50"
                                  >
                                    <span className="text-sm">{player.name}</span>
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
                            
                            {/* Team B */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: teamB?.color }}
                                />
                                {teamB?.name}
                              </div>
                              {match.teamBPlayers.map(playerId => {
                                const player = players.find(p => p.id === playerId);
                                return player ? (
                                  <div 
                                    key={playerId}
                                    className="flex items-center gap-2 p-2 rounded bg-muted/50"
                                  >
                                    <span className="text-sm">{player.name}</span>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                      ({player.handicap})
                                    </span>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        No matches generated yet
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </CardContent>
      </Card>

      <DragOverlay>
        {activePlayer && (
          <DraggablePlayerCard
            player={activePlayer}
            teamColor={myTeam?.color}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
