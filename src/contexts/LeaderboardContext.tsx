import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTrip } from './TripContext';
import { 
  MatchScore, 
  MatchResult, 
  PlayerIdentification,
  IndividualLeaderboardEntry,
  TeamLeaderboardEntry,
  FlightLeaderboard,
  DayLeaderboard,
  OverallLeaderboard,
  GameFormat,
  ScoringType,
} from '@/types/golf';
import {
  calculateStrokesPerHole,
  calculateHighLowHole,
  calculateFourBallHole,
  calculateMatchPlayHole,
  calculateMatchPlayTotal,
  calculateStablefordPoints,
  HOLE_PARS,
  DEFAULT_POINTS_CONFIG,
} from '@/lib/scoring';

interface LeaderboardContextType {
  // Player identification
  currentPlayerIdentification: PlayerIdentification | null;
  setPlayerIdentification: (identification: PlayerIdentification) => void;
  flightColor: string;
  setFlightColor: (color: string) => void;
  
  // Match scores
  matchScores: MatchScore[];
  updateMatchScore: (score: MatchScore) => void;
  
  // Match results
  matchResults: MatchResult[];
  updateMatchResult: (result: MatchResult) => void;
  
  // Leaderboard data
  getDayLeaderboard: (fixtureDayId: string) => DayLeaderboard | null;
  getFlightLeaderboard: (flightId: string, fixtureDayId: string) => FlightLeaderboard | null;
  getOverallLeaderboard: () => OverallLeaderboard;
  
  // Selected day for viewing
  selectedDayId: string | null;
  setSelectedDayId: (dayId: string | null) => void;
  
  // View mode
  viewMode: 'team' | 'individual';
  setViewMode: (mode: 'team' | 'individual') => void;
}

const LeaderboardContext = createContext<LeaderboardContextType | undefined>(undefined);

// Load from localStorage
const STORAGE_KEY_IDENTIFICATION = 'golf-player-identification';
const STORAGE_KEY_FLIGHT_COLOR = 'golf-flight-color';

export function LeaderboardProvider({ children }: { children: ReactNode }) {
  const { players, teams, fixtureDays } = useTrip();
  
  const [currentPlayerIdentification, setCurrentPlayerIdentification] = useState<PlayerIdentification | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_IDENTIFICATION);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  
  const [flightColor, setFlightColorState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_FLIGHT_COLOR) || '#3b82f6';
  });
  
  const [matchScores, setMatchScores] = useState<MatchScore[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'team' | 'individual'>('team');
  
  // Persist player identification
  useEffect(() => {
    if (currentPlayerIdentification) {
      localStorage.setItem(STORAGE_KEY_IDENTIFICATION, JSON.stringify(currentPlayerIdentification));
    }
  }, [currentPlayerIdentification]);
  
  // Persist flight color
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FLIGHT_COLOR, flightColor);
  }, [flightColor]);
  
  const setPlayerIdentification = (identification: PlayerIdentification) => {
    setCurrentPlayerIdentification(identification);
  };
  
  const setFlightColor = (color: string) => {
    setFlightColorState(color);
  };
  
  const updateMatchScore = (score: MatchScore) => {
    setMatchScores(prev => {
      const existing = prev.findIndex(
        s => s.matchId === score.matchId && s.playerId === score.playerId
      );
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = score;
        return updated;
      }
      return [...prev, score];
    });
    
    // Recalculate match result when scores update
    recalculateMatchResult(score.matchId, score.fixtureDayId);
  };
  
  const updateMatchResult = (result: MatchResult) => {
    setMatchResults(prev => {
      const existing = prev.findIndex(r => r.matchId === result.matchId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = result;
        return updated;
      }
      return [...prev, result];
    });
  };
  
  const recalculateMatchResult = (matchId: string, fixtureDayId: string) => {
    const fixtureDay = fixtureDays.find(fd => fd.id === fixtureDayId);
    if (!fixtureDay) return;
    
    const match = fixtureDay.matches.find(m => m.id === matchId);
    if (!match) return;
    
    const teamAScores = matchScores.filter(
      s => s.matchId === matchId && match.teamAPlayers.includes(s.playerId)
    );
    const teamBScores = matchScores.filter(
      s => s.matchId === matchId && match.teamBPlayers.includes(s.playerId)
    );
    
    const allComplete = [...teamAScores, ...teamBScores].every(s => s.isComplete);
    
    // Calculate points based on game format
    let teamAPoints = 0;
    let teamBPoints = 0;
    let winningTeamId: 'team-a' | 'team-b' | 'tie' | null = null;
    
    const gameFormat = fixtureDay.gameFormat;
    const scoringType = fixtureDay.scoringType;
    
    if (gameFormat === 'high-low') {
      // High-Low: Best 2 pts, Worst 1 pt per hole - aggregate over all holes
      // For now, use total net scores to determine winner
      const teamATotal = teamAScores.reduce((sum, s) => sum + s.netScore, 0);
      const teamBTotal = teamBScores.reduce((sum, s) => sum + s.netScore, 0);
      
      if (allComplete) {
        if (teamATotal < teamBTotal) {
          winningTeamId = 'team-a';
          teamAPoints = DEFAULT_POINTS_CONFIG.pointsPerMatch;
        } else if (teamBTotal < teamATotal) {
          winningTeamId = 'team-b';
          teamBPoints = DEFAULT_POINTS_CONFIG.pointsPerMatch;
        } else {
          winningTeamId = 'tie';
          teamAPoints = DEFAULT_POINTS_CONFIG.tiePoints;
          teamBPoints = DEFAULT_POINTS_CONFIG.tiePoints;
        }
      } else if (teamAScores.length > 0 || teamBScores.length > 0) {
        if (teamATotal < teamBTotal) winningTeamId = 'team-a';
        else if (teamBTotal < teamATotal) winningTeamId = 'team-b';
      }
    } else if (gameFormat === 'fourball') {
      // Four-Ball Best Ball: Best net score per hole for each team
      const teamATotal = teamAScores.reduce((sum, s) => sum + s.netScore, 0);
      const teamBTotal = teamBScores.reduce((sum, s) => sum + s.netScore, 0);
      
      if (allComplete) {
        if (teamATotal < teamBTotal) {
          winningTeamId = 'team-a';
          teamAPoints = DEFAULT_POINTS_CONFIG.pointsPerMatch;
        } else if (teamBTotal < teamATotal) {
          winningTeamId = 'team-b';
          teamBPoints = DEFAULT_POINTS_CONFIG.pointsPerMatch;
        } else {
          winningTeamId = 'tie';
          teamAPoints = DEFAULT_POINTS_CONFIG.tiePoints;
          teamBPoints = DEFAULT_POINTS_CONFIG.tiePoints;
        }
      } else if (teamAScores.length > 0 || teamBScores.length > 0) {
        if (teamATotal < teamBTotal) winningTeamId = 'team-a';
        else if (teamBTotal < teamATotal) winningTeamId = 'team-b';
      }
    } else if (gameFormat === 'texas-scramble') {
      // Texas Scramble: One score per team
      const teamATotal = teamAScores.reduce((sum, s) => sum + s.netScore, 0);
      const teamBTotal = teamBScores.reduce((sum, s) => sum + s.netScore, 0);
      
      if (allComplete) {
        if (scoringType === 'stableford') {
          // Higher Stableford wins
          if (teamATotal > teamBTotal) {
            winningTeamId = 'team-a';
            teamAPoints = DEFAULT_POINTS_CONFIG.pointsPerMatch;
          } else if (teamBTotal > teamATotal) {
            winningTeamId = 'team-b';
            teamBPoints = DEFAULT_POINTS_CONFIG.pointsPerMatch;
          } else {
            winningTeamId = 'tie';
            teamAPoints = DEFAULT_POINTS_CONFIG.tiePoints;
            teamBPoints = DEFAULT_POINTS_CONFIG.tiePoints;
          }
        } else {
          // Lower strokes wins
          if (teamATotal < teamBTotal) {
            winningTeamId = 'team-a';
            teamAPoints = DEFAULT_POINTS_CONFIG.pointsPerMatch;
          } else if (teamBTotal < teamATotal) {
            winningTeamId = 'team-b';
            teamBPoints = DEFAULT_POINTS_CONFIG.pointsPerMatch;
          } else {
            winningTeamId = 'tie';
            teamAPoints = DEFAULT_POINTS_CONFIG.tiePoints;
            teamBPoints = DEFAULT_POINTS_CONFIG.tiePoints;
          }
        }
      }
    } else {
      // Singles or other formats: Standard total net score comparison
      const teamATotal = teamAScores.reduce((sum, s) => sum + s.netScore, 0);
      const teamBTotal = teamBScores.reduce((sum, s) => sum + s.netScore, 0);
      
      if (allComplete) {
        if (scoringType === 'stableford') {
          if (teamATotal > teamBTotal) {
            winningTeamId = 'team-a';
            teamAPoints = DEFAULT_POINTS_CONFIG.pointsPerMatch;
          } else if (teamBTotal > teamATotal) {
            winningTeamId = 'team-b';
            teamBPoints = DEFAULT_POINTS_CONFIG.pointsPerMatch;
          } else {
            winningTeamId = 'tie';
            teamAPoints = DEFAULT_POINTS_CONFIG.tiePoints;
            teamBPoints = DEFAULT_POINTS_CONFIG.tiePoints;
          }
        } else {
          if (teamATotal < teamBTotal) {
            winningTeamId = 'team-a';
            teamAPoints = DEFAULT_POINTS_CONFIG.pointsPerMatch;
          } else if (teamBTotal < teamATotal) {
            winningTeamId = 'team-b';
            teamBPoints = DEFAULT_POINTS_CONFIG.pointsPerMatch;
          } else {
            winningTeamId = 'tie';
            teamAPoints = DEFAULT_POINTS_CONFIG.tiePoints;
            teamBPoints = DEFAULT_POINTS_CONFIG.tiePoints;
          }
        }
      } else if (teamAScores.length > 0 || teamBScores.length > 0) {
        if (scoringType === 'stableford') {
          if (teamATotal > teamBTotal) winningTeamId = 'team-a';
          else if (teamBTotal > teamATotal) winningTeamId = 'team-b';
        } else {
          if (teamATotal < teamBTotal) winningTeamId = 'team-a';
          else if (teamBTotal < teamATotal) winningTeamId = 'team-b';
        }
      }
    }
    
    updateMatchResult({
      matchId,
      fixtureDayId,
      winningTeamId,
      teamAPoints,
      teamBPoints,
      isComplete: allComplete,
    });
  };
  
  const getDayLeaderboard = (fixtureDayId: string): DayLeaderboard | null => {
    const fixtureDay = fixtureDays.find(fd => fd.id === fixtureDayId);
    if (!fixtureDay) return null;
    
    const dayMatchResults = matchResults.filter(r => r.fixtureDayId === fixtureDayId);
    const dayMatchScores = matchScores.filter(s => s.fixtureDayId === fixtureDayId);
    
    // Build individual standings
    const individualStandings: IndividualLeaderboardEntry[] = players.map(player => {
      const playerScores = dayMatchScores.filter(s => s.playerId === player.id);
      const team = teams.find(t => t.players.includes(player.id));
      
      const grossTotal = playerScores.reduce((sum, s) => sum + s.grossScore, 0);
      const netTotal = playerScores.reduce((sum, s) => sum + s.netScore, 0);
      const maxThru = playerScores.length > 0 ? Math.max(...playerScores.map(s => s.thruHole)) : 0;
      
      // Calculate match wins/losses
      const playerMatches = fixtureDay.matches.filter(
        m => m.teamAPlayers.includes(player.id) || m.teamBPlayers.includes(player.id)
      );
      
      let won = 0, lost = 0, tied = 0;
      playerMatches.forEach(match => {
        const result = dayMatchResults.find(r => r.matchId === match.id);
        if (result?.isComplete) {
          const isTeamA = match.teamAPlayers.includes(player.id);
          if (result.winningTeamId === 'tie') tied++;
          else if ((isTeamA && result.winningTeamId === 'team-a') || 
                   (!isTeamA && result.winningTeamId === 'team-b')) won++;
          else lost++;
        }
      });
      
      return {
        playerId: player.id,
        playerName: player.name,
        teamId: team?.id as 'team-a' | 'team-b',
        grossScore: grossTotal,
        netScore: netTotal,
        thruHole: maxThru,
        matchesWon: won,
        matchesLost: lost,
        matchesTied: tied,
        isCurrentlyPlaying: playerScores.some(s => !s.isComplete && s.thruHole > 0),
      };
    }).filter(e => e.teamId).sort((a, b) => a.netScore - b.netScore);
    
    // Build team standings for this day
    const teamStandings: TeamLeaderboardEntry[] = teams.map(team => {
      const teamResults = dayMatchResults.filter(r => {
        const match = fixtureDay.matches.find(m => m.id === r.matchId);
        if (!match) return false;
        return team.id === 'team-a' 
          ? match.teamAPlayers.some(p => team.players.includes(p))
          : match.teamBPlayers.some(p => team.players.includes(p));
      });
      
      const points = teamResults.reduce((sum, r) => {
        if (team.id === 'team-a') return sum + r.teamAPoints;
        return sum + r.teamBPoints;
      }, 0);
      
      const won = teamResults.filter(r => 
        (team.id === 'team-a' && r.winningTeamId === 'team-a') ||
        (team.id === 'team-b' && r.winningTeamId === 'team-b')
      ).length;
      
      const lost = teamResults.filter(r => 
        (team.id === 'team-a' && r.winningTeamId === 'team-b') ||
        (team.id === 'team-b' && r.winningTeamId === 'team-a')
      ).length;
      
      const tied = teamResults.filter(r => r.winningTeamId === 'tie').length;
      
      const remainingMatches = fixtureDay.matches.length - teamResults.filter(r => r.isComplete).length;
      
      return {
        teamId: team.id as 'team-a' | 'team-b',
        teamName: team.name,
        teamColor: team.color,
        totalPoints: points,
        previousDaysPoints: 0,
        currentDayPoints: points,
        potentialRemainingPoints: remainingMatches,
        matchesWon: won,
        matchesLost: lost,
        matchesTied: tied,
        isWinningPossible: true,
      };
    });
    
    // Build flight leaderboards
    const flights: FlightLeaderboard[] = fixtureDay.flights.map((flight, idx) => {
      const flightPlayers = individualStandings.filter(e => 
        flight.players.includes(e.playerId)
      );
      
      const flightMatch = fixtureDay.matches.find(m => flight.matchIds.includes(m.id));
      const flightResult = flightMatch 
        ? dayMatchResults.find(r => r.matchId === flightMatch.id)
        : undefined;
      
      return {
        flightId: flight.id,
        flightNumber: idx + 1,
        fixtureDayId,
        players: flightPlayers,
        matchResult: flightResult || {
          matchId: flightMatch?.id || '',
          fixtureDayId,
          winningTeamId: null,
          teamAPoints: 0,
          teamBPoints: 0,
          isComplete: false,
        },
      };
    });
    
    return {
      fixtureDayId,
      dayNumber: fixtureDay.dayNumber,
      courseName: fixtureDay.courseName || `Day ${fixtureDay.dayNumber}`,
      date: fixtureDay.date,
      gameFormat: fixtureDay.gameFormat,
      flights,
      teamStandings,
      individualStandings,
    };
  };
  
  const getFlightLeaderboard = (flightId: string, fixtureDayId: string): FlightLeaderboard | null => {
    const dayLeaderboard = getDayLeaderboard(fixtureDayId);
    if (!dayLeaderboard) return null;
    
    return dayLeaderboard.flights.find(f => f.flightId === flightId) || null;
  };
  
  const getOverallLeaderboard = (): OverallLeaderboard => {
    const dayLeaderboards = fixtureDays
      .filter(fd => fd.flights.length > 0 || fd.matches.length > 0 || fd.teamALockedIn || fd.teamBLockedIn)
      .map(fd => getDayLeaderboard(fd.id))
      .filter((dl): dl is DayLeaderboard => dl !== null);
    
    // Aggregate team standings across all days
    const aggregatedTeamStandings: TeamLeaderboardEntry[] = teams.map(team => {
      const allDayStandings = dayLeaderboards.map(dl => 
        dl.teamStandings.find(ts => ts.teamId === team.id)
      ).filter((ts): ts is TeamLeaderboardEntry => ts !== undefined);
      
      const totalPoints = allDayStandings.reduce((sum, ts) => sum + ts.totalPoints, 0);
      const totalWon = allDayStandings.reduce((sum, ts) => sum + ts.matchesWon, 0);
      const totalLost = allDayStandings.reduce((sum, ts) => sum + ts.matchesLost, 0);
      const totalTied = allDayStandings.reduce((sum, ts) => sum + ts.matchesTied, 0);
      const remainingPoints = allDayStandings.reduce((sum, ts) => sum + ts.potentialRemainingPoints, 0);
      
      // Calculate previous days vs current day
      const completedDays = dayLeaderboards.filter(dl => 
        dl.teamStandings.every(ts => ts.potentialRemainingPoints === 0)
      );
      const previousDaysPoints = completedDays
        .map(dl => dl.teamStandings.find(ts => ts.teamId === team.id)?.totalPoints || 0)
        .reduce((sum, p) => sum + p, 0);
      
      return {
        teamId: team.id as 'team-a' | 'team-b',
        teamName: team.name,
        teamColor: team.color,
        totalPoints,
        previousDaysPoints,
        currentDayPoints: totalPoints - previousDaysPoints,
        potentialRemainingPoints: remainingPoints,
        matchesWon: totalWon,
        matchesLost: totalLost,
        matchesTied: totalTied,
        isWinningPossible: true,
      };
    });
    
    // Determine if winner is already decided
    const teamA = aggregatedTeamStandings.find(t => t.teamId === 'team-a');
    const teamB = aggregatedTeamStandings.find(t => t.teamId === 'team-b');
    
    let isWinnerDetermined = false;
    let winningTeamId: 'team-a' | 'team-b' | undefined;
    
    if (teamA && teamB) {
      const maxTeamARemainingGain = teamA.potentialRemainingPoints;
      const maxTeamBRemainingGain = teamB.potentialRemainingPoints;
      
      // Team A wins if even with max B points, A still leads
      if (teamA.totalPoints > teamB.totalPoints + maxTeamBRemainingGain) {
        isWinnerDetermined = true;
        winningTeamId = 'team-a';
        teamB.isWinningPossible = false;
      }
      // Team B wins if even with max A points, B still leads
      else if (teamB.totalPoints > teamA.totalPoints + maxTeamARemainingGain) {
        isWinnerDetermined = true;
        winningTeamId = 'team-b';
        teamA.isWinningPossible = false;
      }
    }
    
    const totalMatchesPlayed = matchResults.filter(r => r.isComplete).length;
    const totalMatchesRemaining = fixtureDays
      .filter(fd => fd.teamALockedIn && fd.teamBLockedIn)
      .reduce((sum, fd) => sum + fd.matches.length, 0) - totalMatchesPlayed;
    
    return {
      teamStandings: aggregatedTeamStandings,
      dayLeaderboards,
      totalMatchesPlayed,
      totalMatchesRemaining,
      isWinnerDetermined,
      winningTeamId,
    };
  };
  
  return (
    <LeaderboardContext.Provider value={{
      currentPlayerIdentification,
      setPlayerIdentification,
      flightColor,
      setFlightColor,
      matchScores,
      updateMatchScore,
      matchResults,
      updateMatchResult,
      getDayLeaderboard,
      getFlightLeaderboard,
      getOverallLeaderboard,
      selectedDayId,
      setSelectedDayId,
      viewMode,
      setViewMode,
    }}>
      {children}
    </LeaderboardContext.Provider>
  );
}

export function useLeaderboard() {
  const context = useContext(LeaderboardContext);
  if (!context) {
    throw new Error('useLeaderboard must be used within a LeaderboardProvider');
  }
  return context;
}
