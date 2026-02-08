import { GameFormat, ScoringType, Player } from '@/types/golf';

// Standard stroke indices (1 = hardest hole, 18 = easiest)
export const STROKE_INDEX = [5, 13, 1, 9, 17, 3, 15, 7, 11, 6, 14, 2, 10, 18, 4, 16, 8, 12];

// Standard par for each hole
export const HOLE_PARS = [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5];

export const TOTAL_PAR = HOLE_PARS.reduce((a, b) => a + b, 0);

// Stableford points based on score relative to par (after handicap)
export const STABLEFORD_POINTS: Record<number, number> = {
  [-3]: 5, // Albatross
  [-2]: 4, // Eagle
  [-1]: 3, // Birdie
  [0]: 2,  // Par
  [1]: 1,  // Bogey
  [2]: 0,  // Double bogey or worse
};

/**
 * Calculate playing handicap strokes per hole
 * Returns an array of 18 numbers indicating extra strokes per hole
 */
export function calculateStrokesPerHole(playingHandicap: number): number[] {
  return STROKE_INDEX.map(si => {
    if (playingHandicap >= si) {
      // First round of strokes
      const firstRound = 1;
      // If handicap is > 18, player gets additional strokes on hardest holes
      const secondRound = playingHandicap >= 18 + si ? 1 : 0;
      return firstRound + secondRound;
    }
    return 0;
  });
}

/**
 * Calculate net score for a hole (gross - strokes)
 */
export function calculateNetScore(grossScore: number, strokes: number): number {
  return grossScore - strokes;
}

/**
 * Calculate Stableford points for a hole
 */
export function calculateStablefordPoints(grossScore: number, par: number, strokes: number): number {
  const netScore = grossScore - strokes;
  const scoreToPar = netScore - par;
  
  if (scoreToPar <= -3) return 5; // Albatross or better
  if (scoreToPar === -2) return 4; // Eagle
  if (scoreToPar === -1) return 3; // Birdie
  if (scoreToPar === 0) return 2;  // Par
  if (scoreToPar === 1) return 1;  // Bogey
  return 0; // Double bogey or worse
}

/**
 * Calculate total Stableford points for 18 holes
 */
export function calculateTotalStablefordPoints(
  grossScores: number[],
  playingHandicap: number
): number {
  const strokes = calculateStrokesPerHole(playingHandicap);
  return grossScores.reduce((total, gross, hole) => {
    if (gross === 0) return total; // Hole not played yet
    return total + calculateStablefordPoints(gross, HOLE_PARS[hole], strokes[hole]);
  }, 0);
}

// ========== HIGH-LOW FORMAT SCORING ==========

export interface HighLowHoleResult {
  holeNumber: number;
  teamABestNet: number;
  teamAWorstNet: number;
  teamBBestNet: number;
  teamBWorstNet: number;
  bestPointsTeamA: number;
  bestPointsTeamB: number;
  worstPointsTeamA: number;
  worstPointsTeamB: number;
  holeScore: { teamA: number; teamB: number };
}

/**
 * Calculate High-Low scoring for a single hole
 * - 2 points for best score comparison
 * - 1 point for worst score comparison
 */
export function calculateHighLowHole(
  teamAScores: { playerId: string; grossScore: number; strokes: number }[],
  teamBScores: { playerId: string; grossScore: number; strokes: number }[]
): { teamAPoints: number; teamBPoints: number } {
  if (teamAScores.length < 2 || teamBScores.length < 2) {
    return { teamAPoints: 0, teamBPoints: 0 };
  }

  // Calculate net scores
  const teamANets = teamAScores.map(s => s.grossScore - s.strokes);
  const teamBNets = teamBScores.map(s => s.grossScore - s.strokes);

  const teamABest = Math.min(...teamANets);
  const teamAWorst = Math.max(...teamANets);
  const teamBBest = Math.min(...teamBNets);
  const teamBWorst = Math.max(...teamBNets);

  let teamAPoints = 0;
  let teamBPoints = 0;

  // Best score comparison (2 points)
  if (teamABest < teamBBest) {
    teamAPoints += 2;
  } else if (teamBBest < teamABest) {
    teamBPoints += 2;
  } else {
    // Tie - 1 point each
    teamAPoints += 1;
    teamBPoints += 1;
  }

  // Worst score comparison (1 point)
  if (teamAWorst < teamBWorst) {
    teamAPoints += 1;
  } else if (teamBWorst < teamAWorst) {
    teamBPoints += 1;
  } else {
    // Tie - 0.5 points each
    teamAPoints += 0.5;
    teamBPoints += 0.5;
  }

  return { teamAPoints, teamBPoints };
}

/**
 * Calculate High-Low total for all 18 holes
 */
export function calculateHighLowTotal(
  holeResults: { teamAPoints: number; teamBPoints: number }[]
): { teamATotal: number; teamBTotal: number; matchPoints: { teamA: number; teamB: number } } {
  const teamATotal = holeResults.reduce((sum, h) => sum + h.teamAPoints, 0);
  const teamBTotal = holeResults.reduce((sum, h) => sum + h.teamBPoints, 0);

  // Convert to match points (1 point for winner, 0.5 each for tie)
  let matchPoints = { teamA: 0, teamB: 0 };
  if (teamATotal > teamBTotal) {
    matchPoints.teamA = 1;
  } else if (teamBTotal > teamATotal) {
    matchPoints.teamB = 1;
  } else {
    matchPoints.teamA = 0.5;
    matchPoints.teamB = 0.5;
  }

  return { teamATotal, teamBTotal, matchPoints };
}

// ========== FOUR-BALL BEST BALL SCORING ==========

/**
 * Calculate Four-Ball Best Ball for a hole
 * Team score = lowest net score of the two players
 */
export function calculateFourBallHole(
  teamAScores: { playerId: string; grossScore: number; strokes: number }[],
  teamBScores: { playerId: string; grossScore: number; strokes: number }[]
): { teamANet: number; teamBNet: number } {
  const teamANets = teamAScores.map(s => s.grossScore - s.strokes);
  const teamBNets = teamBScores.map(s => s.grossScore - s.strokes);

  return {
    teamANet: Math.min(...teamANets),
    teamBNet: Math.min(...teamBNets),
  };
}

/**
 * Calculate Four-Ball match result (stroke play or match play)
 */
export function calculateFourBallTotal(
  holeResults: { teamANet: number; teamBNet: number }[],
  scoringType: ScoringType
): { teamATotal: number; teamBTotal: number; matchPoints: { teamA: number; teamB: number } } {
  if (scoringType === 'strokeplay') {
    // Total strokes wins
    const teamATotal = holeResults.reduce((sum, h) => sum + h.teamANet, 0);
    const teamBTotal = holeResults.reduce((sum, h) => sum + h.teamBNet, 0);

    let matchPoints = { teamA: 0, teamB: 0 };
    if (teamATotal < teamBTotal) {
      matchPoints.teamA = 1;
    } else if (teamBTotal < teamATotal) {
      matchPoints.teamB = 1;
    } else {
      matchPoints.teamA = 0.5;
      matchPoints.teamB = 0.5;
    }

    return { teamATotal, teamBTotal, matchPoints };
  } else {
    // Stableford - higher points wins
    const teamATotal = holeResults.reduce((sum, h) => sum + h.teamANet, 0);
    const teamBTotal = holeResults.reduce((sum, h) => sum + h.teamBNet, 0);

    let matchPoints = { teamA: 0, teamB: 0 };
    if (teamATotal > teamBTotal) {
      matchPoints.teamA = 1;
    } else if (teamBTotal > teamATotal) {
      matchPoints.teamB = 1;
    } else {
      matchPoints.teamA = 0.5;
      matchPoints.teamB = 0.5;
    }

    return { teamATotal, teamBTotal, matchPoints };
  }
}

// ========== TEXAS SCRAMBLE SCORING ==========

/**
 * Texas Scramble: Only one ball played per team
 * Points based on scoring type (stroke play, match play, or stableford)
 */
export function calculateTexasScrambleHole(
  teamAScore: number,
  teamBScore: number,
  par: number,
  scoringType: ScoringType
): { teamAPoints: number; teamBPoints: number } {
  if (scoringType === 'stableford') {
    // Convert to Stableford points (no handicap strokes in scramble)
    const teamAPoints = calculateStablefordPoints(teamAScore, par, 0);
    const teamBPoints = calculateStablefordPoints(teamBScore, par, 0);
    return { teamAPoints, teamBPoints };
  } else {
    // Stroke play - return actual strokes
    return { teamAPoints: teamAScore, teamBPoints: teamBScore };
  }
}

// ========== MATCH PLAY SCORING ==========

export interface MatchPlayState {
  holesUp: number; // Positive = Team A up, Negative = Team B up
  holesPlayed: number;
  holesRemaining: number;
  matchStatus: 'in_progress' | 'team_a_wins' | 'team_b_wins' | 'all_square' | 'halved';
}

/**
 * Calculate match play hole result
 */
export function calculateMatchPlayHole(
  teamANetScore: number,
  teamBNetScore: number
): { teamAWins: boolean; teamBWins: boolean; halved: boolean } {
  if (teamANetScore < teamBNetScore) {
    return { teamAWins: true, teamBWins: false, halved: false };
  } else if (teamBNetScore < teamANetScore) {
    return { teamAWins: false, teamBWins: true, halved: false };
  }
  return { teamAWins: false, teamBWins: false, halved: true };
}

/**
 * Calculate match play standing after all holes
 */
export function calculateMatchPlayTotal(
  holeResults: { teamAWins: boolean; teamBWins: boolean; halved: boolean }[]
): MatchPlayState {
  let holesUp = 0;
  
  holeResults.forEach(result => {
    if (result.teamAWins) holesUp++;
    else if (result.teamBWins) holesUp--;
  });

  const holesPlayed = holeResults.length;
  const holesRemaining = 18 - holesPlayed;

  let matchStatus: MatchPlayState['matchStatus'] = 'in_progress';
  
  if (holesRemaining === 0) {
    if (holesUp > 0) matchStatus = 'team_a_wins';
    else if (holesUp < 0) matchStatus = 'team_b_wins';
    else matchStatus = 'halved';
  } else if (Math.abs(holesUp) > holesRemaining) {
    // Match is dormie or won
    matchStatus = holesUp > 0 ? 'team_a_wins' : 'team_b_wins';
  } else if (holesUp === 0) {
    matchStatus = 'all_square';
  }

  return {
    holesUp,
    holesPlayed,
    holesRemaining,
    matchStatus,
  };
}

// ========== SINGLES SCORING ==========

/**
 * Calculate singles match result
 * Returns 1 point for win, 0.5 for tie (in pairs of 6v6, 6 singles games = 6 points total)
 */
export function calculateSinglesResult(
  player1NetScore: number,
  player2NetScore: number,
  scoringType: ScoringType
): { player1Points: number; player2Points: number } {
  if (scoringType === 'stableford') {
    // Higher Stableford points wins
    if (player1NetScore > player2NetScore) {
      return { player1Points: 1, player2Points: 0 };
    } else if (player2NetScore > player1NetScore) {
      return { player1Points: 0, player2Points: 1 };
    }
  } else {
    // Lower stroke count wins
    if (player1NetScore < player2NetScore) {
      return { player1Points: 1, player2Points: 0 };
    } else if (player2NetScore < player1NetScore) {
      return { player1Points: 0, player2Points: 1 };
    }
  }
  // Tie
  return { player1Points: 0.5, player2Points: 0.5 };
}

// ========== POINTS ATTRIBUTION ==========

export interface MatchPointsConfig {
  pointsPerMatch: number; // Default: 1 point per match
  tiePoints: number;      // Default: 0.5 points each for tie
}

export const DEFAULT_POINTS_CONFIG: MatchPointsConfig = {
  pointsPerMatch: 1,
  tiePoints: 0.5,
};

/**
 * Calculate total match points for a day based on format
 * 
 * Singles (6v6): 6 matches × 1 point = 6 points available
 * Pairs (6v6): 3 matches × 1 point = 3 points available
 */
export function calculateDayPointsAvailable(
  gameFormat: GameFormat,
  matchCount: number
): number {
  return matchCount * DEFAULT_POINTS_CONFIG.pointsPerMatch;
}

/**
 * Calculate match points based on game format and result
 */
export function calculateMatchPoints(
  gameFormat: GameFormat,
  scoringType: ScoringType,
  teamAScore: number,
  teamBScore: number,
  config: MatchPointsConfig = DEFAULT_POINTS_CONFIG
): { teamAPoints: number; teamBPoints: number } {
  const isHigherBetter = scoringType === 'stableford';
  
  if (isHigherBetter ? teamAScore > teamBScore : teamAScore < teamBScore) {
    return { teamAPoints: config.pointsPerMatch, teamBPoints: 0 };
  } else if (isHigherBetter ? teamBScore > teamAScore : teamBScore < teamAScore) {
    return { teamAPoints: 0, teamBPoints: config.pointsPerMatch };
  }
  
  // Tie
  return { teamAPoints: config.tiePoints, teamBPoints: config.tiePoints };
}

// ========== FORMAT DESCRIPTIONS ==========

export const FORMAT_DESCRIPTIONS: Record<GameFormat, string> = {
  singles: 'Each player plays their own ball. 1 point per match.',
  'texas-scramble': 'Team plays one ball together. Best shot selected each time.',
  'high-low': 'Best score = 2 points, Worst score = 1 point per hole.',
  foursomes: 'Partners alternate shots with one ball.',
  fourball: 'Each player plays own ball, best net score counts for team.',
  chapman: 'Both drive, then switch and play partner\'s ball, then select best.',
};

export const SCORING_DESCRIPTIONS: Record<ScoringType, string> = {
  stableford: 'Points based on score relative to par. Higher is better.',
  strokeplay: 'Total strokes counted. Lower is better.',
  matchplay: 'Win individual holes. Most holes won wins match.',
};
