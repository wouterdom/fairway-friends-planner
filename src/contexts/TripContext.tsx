import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Player, Team, Game, FixtureDay } from '@/types/golf';

// LocalStorage keys
const STORAGE_KEYS = {
  players: 'golf-trip-players',
  teams: 'golf-trip-teams',
  fixtureDays: 'golf-trip-fixture-days',
  games: 'golf-trip-games',
} as const;

// Helper to safely get from localStorage
function getStoredData<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn(`Failed to parse localStorage key "${key}"`, e);
  }
  return fallback;
}

interface TripContextType {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  addPlayer: (player: Player) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  removePlayer: (id: string) => void;
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  updateTeamName: (teamId: 'team-a' | 'team-b', name: string) => void;
  setCaptain: (teamId: 'team-a' | 'team-b', playerId: string) => void;
  games: Game[];
  addGame: (game: Game) => void;
  updateGameScore: (gameId: string, playerId: string, scores: number[]) => void;
  markGameStarted: (matchId: string, playerIds: string[], courseName?: string, courseLocation?: string) => void;
  markGameComplete: (matchId: string) => void;
  // Fixture management
  fixtureDays: FixtureDay[];
  setFixtureDays: React.Dispatch<React.SetStateAction<FixtureDay[]>>;
  updateFixtureDay: (id: string, updates: Partial<FixtureDay>) => void;
  lockInTeam: (fixtureDayId: string, teamId: 'team-a' | 'team-b') => void;
  resetFixtureDay: (fixtureDayId: string) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

// DEFAULT DATA - Used when no stored data exists
const defaultPlayers: Player[] = [
  { id: 'p1', name: 'John Smith', email: 'john@test.com', handicap: 12 },
  { id: 'p2', name: 'Mike Johnson', email: 'mike@test.com', handicap: 8 },
  { id: 'p3', name: 'Tom Wilson', email: 'tom@test.com', handicap: 15 },
  { id: 'p4', name: 'Chris Brown', email: 'chris@test.com', handicap: 18 },
  { id: 'p5', name: 'David Lee', email: 'david@test.com', handicap: 6 },
  { id: 'p6', name: 'James Davis', email: 'james@test.com', handicap: 22 },
  { id: 'p7', name: 'Robert Taylor', email: 'robert@test.com', handicap: 10 },
  { id: 'p8', name: 'William Anderson', email: 'william@test.com', handicap: 14 },
];

const defaultTeams: Team[] = [
  { id: 'team-a', name: 'Eagles', players: ['p1', 'p2', 'p3', 'p4'], color: '#2d5a3d' },
  { id: 'team-b', name: 'Hawks', players: ['p5', 'p6', 'p7', 'p8'], color: '#d4af37' },
];

const defaultFixtureDays: FixtureDay[] = [
  {
    id: 'day-1',
    dayNumber: 1,
    date: '2025-06-15',
    courseName: 'Old Course',
    gameFormat: 'high-low',
    scoringType: 'stableford',
    matches: [],
    flights: [],
    teamALockedIn: false,
    teamBLockedIn: false,
    matchingMethod: 'manual',
    isFinalized: false,
  },
  {
    id: 'day-2',
    dayNumber: 2,
    date: '2025-06-16',
    courseName: 'Kingsbarns',
    gameFormat: 'singles',
    scoringType: 'stableford',
    matches: [],
    flights: [],
    teamALockedIn: false,
    teamBLockedIn: false,
    matchingMethod: 'manual',
    isFinalized: false,
  }
];

export function TripProvider({ children }: { children: ReactNode }) {
  const [players, setPlayersState] = useState<Player[]>(() => 
    getStoredData(STORAGE_KEYS.players, defaultPlayers)
  );
  const [teams, setTeamsState] = useState<Team[]>(() => 
    getStoredData(STORAGE_KEYS.teams, defaultTeams)
  );
  const [games, setGamesState] = useState<Game[]>(() => 
    getStoredData(STORAGE_KEYS.games, [])
  );
  const [fixtureDays, setFixtureDaysState] = useState<FixtureDay[]>(() => 
    getStoredData(STORAGE_KEYS.fixtureDays, defaultFixtureDays)
  );

  // Persist to localStorage when data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.fixtureDays, JSON.stringify(fixtureDays));
  }, [fixtureDays]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.games, JSON.stringify(games));
  }, [games]);

  // Wrapper setters that update state (localStorage sync happens via useEffect)
  const setPlayers: React.Dispatch<React.SetStateAction<Player[]>> = setPlayersState;
  const setTeams: React.Dispatch<React.SetStateAction<Team[]>> = setTeamsState;
  const setFixtureDays: React.Dispatch<React.SetStateAction<FixtureDay[]>> = setFixtureDaysState;
  const setGames: React.Dispatch<React.SetStateAction<Game[]>> = setGamesState;

  const addPlayer = (player: Player) => {
    setPlayers(prev => [...prev, player]);
  };

  const updatePlayer = (id: string, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    // Also remove from teams
    setTeams(prev => prev.map(t => ({
      ...t,
      players: t.players.filter(pId => pId !== id)
    })));
  };

  const updateTeamName = (teamId: 'team-a' | 'team-b', name: string) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, name } : t));
  };

  const setCaptain = (teamId: 'team-a' | 'team-b', playerId: string) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, captainId: playerId } : t));
  };

  const addGame = (game: Game) => {
    setGames(prev => [...prev, game]);
  };

  const updateGameScore = (gameId: string, playerId: string, scores: number[]) => {
    setGames(prev => prev.map(g => 
      g.id === gameId 
        ? { ...g, scores: { ...g.scores, [playerId]: scores } }
        : g
    ));
  };

  const markGameStarted = (matchId: string, playerIds: string[], courseName?: string, courseLocation?: string) => {
    setGames(prev => {
      const exists = prev.find(g => g.id === matchId);
      if (exists) return prev;
      const newGame: Game = {
        id: matchId,
        date: new Date().toISOString().split('T')[0],
        courseName: courseName || 'Unknown Course',
        courseLocation: courseLocation || '',
        players: playerIds,
        scores: {},
        completed: false,
      };
      return [...prev, newGame];
    });
  };

  const markGameComplete = (matchId: string) => {
    setGames(prev => prev.map(g => 
      g.id === matchId 
        ? { ...g, completed: true }
        : g
    ));
  };

  const updateFixtureDay = (id: string, updates: Partial<FixtureDay>) => {
    setFixtureDays(prev => prev.map(fd => fd.id === id ? { ...fd, ...updates } : fd));
  };

  const lockInTeam = (fixtureDayId: string, teamId: 'team-a' | 'team-b') => {
    setFixtureDays(prev => prev.map(fd => {
      if (fd.id === fixtureDayId) {
        return {
          ...fd,
          teamALockedIn: teamId === 'team-a' ? true : fd.teamALockedIn,
          teamBLockedIn: teamId === 'team-b' ? true : fd.teamBLockedIn,
        };
      }
      return fd;
    }));
  };

  const resetFixtureDay = (fixtureDayId: string) => {
    setFixtureDays(prev => prev.map(fd => {
      if (fd.id === fixtureDayId) {
        return {
          ...fd,
          matches: [],
          flights: [],
          teamAPairings: undefined,
          teamBPairings: undefined,
          teamALockedIn: false,
          teamBLockedIn: false,
          matchingMethod: undefined,
          flightMethod: undefined,
          isFinalized: false,
        };
      }
      return fd;
    }));
  };

  return (
    <TripContext.Provider value={{
      players,
      setPlayers,
      addPlayer,
      updatePlayer,
      removePlayer,
      teams,
      setTeams,
      updateTeamName,
      setCaptain,
      games,
      addGame,
      updateGameScore,
      markGameStarted,
      markGameComplete,
      fixtureDays,
      setFixtureDays,
      updateFixtureDay,
      lockInTeam,
      resetFixtureDay,
    }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
}
