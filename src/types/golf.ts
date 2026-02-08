export interface Player {
  id: string;
  name: string;
  email: string;
  handicap: number;
  avatar?: string;
  flightId?: string;
  totalScore?: number;
}

export interface Team {
  id: 'team-a' | 'team-b';
  name: string;
  players: string[];
  color: string;
  captainId?: string;
}

// Match represents a single game matchup (singles or 2v2)
export interface Match {
  id: string;
  teamAPlayers: string[]; // 1 player for singles, 2 for 2v2
  teamBPlayers: string[];
  flightId?: string;
}

// Flight represents a group of up to 4 players playing together
export interface Flight {
  id: string;
  matchIds: string[]; // 1 match for 2v2, 2 matches for singles (to fill 4 players)
  players: string[]; // All players in this flight (max 4)
}

// FixtureDay represents the fixture configuration for a single day
export interface FixtureDay {
  id: string;
  dayNumber: number;
  date: string;
  gameFormat: GameFormat;
  scoringType: ScoringType;
  courseName?: string;
  courseLocation?: string;
  matches: Match[];
  flights: Flight[];
  teamAPairings?: string[][]; // For 2v2: array of player pairs [[p1, p2], [p3, p4]]
  teamBPairings?: string[][];
  teamALockedIn: boolean;
  teamBLockedIn: boolean;
  matchingMethod?: 'handicap' | 'random' | 'manual';
  flightMethod?: 'handicap' | 'random' | 'manual';
  isFinalized: boolean;
}

export type GameFormat = 
  | 'singles'        // 1v1
  | 'texas-scramble' // 2v2
  | 'high-low'       // 2v2
  | 'foursomes'      // 2v2
  | 'fourball'       // 4ball best ball 2v2
  | 'chapman';       // 2v2

export type ScoringType = 'stableford' | 'strokeplay' | 'matchplay';

export interface DaySchedule {
  dayNumber: number;
  date?: string;
  gameFormat: GameFormat;
  scoringType: ScoringType;
  hasSkins: boolean;
}

export interface Game {
  id: string;
  date: string;
  courseName: string;
  courseLocation: string;
  teamId?: string;
  players: string[];
  scores: Record<string, number[]>;
  completed: boolean;
  gameFormat?: GameFormat;
  scoringType?: ScoringType;
  hasSkins?: boolean;
}

export type LeaderboardType = 'individual' | 'team';

// ========== LEADERBOARD TYPES ==========

// Player's score for a single match
export interface MatchScore {
  matchId: string;
  fixtureDayId: string;
  playerId: string;
  grossScore: number; // Score without handicap correction
  netScore: number; // Score with handicap correction
  thruHole: number; // Current hole (1-18)
  isComplete: boolean;
  holesUp?: number; // For match play: positive = up, negative = down
}

// Team score for a single match
export interface MatchResult {
  matchId: string;
  fixtureDayId: string;
  winningTeamId: 'team-a' | 'team-b' | 'tie' | null; // null = in progress
  teamAPoints: number;
  teamBPoints: number;
  isComplete: boolean;
}

// Player's identified flight for the current session
export interface PlayerIdentification {
  playerId: string;
  flightId: string;
  fixtureDayId: string;
  flightColor: string; // Player can customize this
}

// Leaderboard entry for individual player
export interface IndividualLeaderboardEntry {
  playerId: string;
  playerName: string;
  teamId: 'team-a' | 'team-b';
  grossScore: number;
  netScore: number;
  thruHole: number;
  matchesWon: number;
  matchesLost: number;
  matchesTied: number;
  isCurrentlyPlaying: boolean;
}

// Leaderboard entry for team standings
export interface TeamLeaderboardEntry {
  teamId: 'team-a' | 'team-b';
  teamName: string;
  teamColor: string;
  totalPoints: number;
  previousDaysPoints: number;
  currentDayPoints: number;
  potentialRemainingPoints: number;
  matchesWon: number;
  matchesLost: number;
  matchesTied: number;
  isWinningPossible: boolean; // Can the other team still catch up?
}

// Flight-specific leaderboard view
export interface FlightLeaderboard {
  flightId: string;
  flightNumber: number;
  fixtureDayId: string;
  players: IndividualLeaderboardEntry[];
  matchResult: MatchResult;
}

// Overall day leaderboard
export interface DayLeaderboard {
  fixtureDayId: string;
  dayNumber: number;
  courseName: string;
  date: string;
  gameFormat: GameFormat;
  flights: FlightLeaderboard[];
  teamStandings: TeamLeaderboardEntry[];
  individualStandings: IndividualLeaderboardEntry[];
}

// Overall tournament leaderboard
export interface OverallLeaderboard {
  teamStandings: TeamLeaderboardEntry[];
  dayLeaderboards: DayLeaderboard[];
  totalMatchesPlayed: number;
  totalMatchesRemaining: number;
  isWinnerDetermined: boolean; // If remaining points can't change outcome
  winningTeamId?: 'team-a' | 'team-b';
}
