// Game status utilities for determining win conditions and team standings

// Fixed team colors - consistent across all views
export const TEAM_COLORS = {
  'team-a': {
    primary: '#2563eb', // Blue
    bg: 'bg-blue-600',
    bgLight: 'bg-blue-100',
    bgLighter: 'bg-blue-50',
    border: 'border-blue-400',
    text: 'text-blue-700',
    textDark: 'text-blue-600',
    ring: 'ring-blue-500',
  },
  'team-b': {
    primary: '#dc2626', // Red
    bg: 'bg-red-600',
    bgLight: 'bg-red-100',
    bgLighter: 'bg-red-50',
    border: 'border-red-400',
    text: 'text-red-700',
    textDark: 'text-red-600',
    ring: 'ring-red-500',
  },
} as const;

export interface HoleStatus {
  holeNumber: number;
  teamAPoints: number;
  teamBPoints: number;
  cumulativeTeamAPoints: number;
  cumulativeTeamBPoints: number;
  leadingTeam: 'team-a' | 'team-b' | 'tied';
  leadAmount: number; // How many points up
}

export interface GameWonStatus {
  isWon: boolean;
  winningTeam: 'team-a' | 'team-b' | null;
  margin: number; // Points ahead
  holesRemaining: number;
  decisionHole: number; // The hole where the game was decided
  displayText: string; // e.g., "3&2"
}

/**
 * Calculate cumulative team standings after each hole
 */
export function calculateHoleByHoleStatus(
  holePoints: { teamA: number; teamB: number }[],
  validatedHoles: boolean[]
): HoleStatus[] {
  const statuses: HoleStatus[] = [];
  let cumulativeA = 0;
  let cumulativeB = 0;

  for (let i = 0; i < 18; i++) {
    if (validatedHoles[i]) {
      cumulativeA += holePoints[i]?.teamA || 0;
      cumulativeB += holePoints[i]?.teamB || 0;
    }

    const diff = cumulativeA - cumulativeB;
    statuses.push({
      holeNumber: i + 1,
      teamAPoints: holePoints[i]?.teamA || 0,
      teamBPoints: holePoints[i]?.teamB || 0,
      cumulativeTeamAPoints: cumulativeA,
      cumulativeTeamBPoints: cumulativeB,
      leadingTeam: diff > 0 ? 'team-a' : diff < 0 ? 'team-b' : 'tied',
      leadAmount: Math.abs(diff),
    });
  }

  return statuses;
}

/**
 * Determine if the game has been won (opponent can't catch up)
 * In high-low format: 3 points per hole max (2 for best, 1 for worst)
 * A game is won when the lead > remaining possible points
 */
export function checkGameWon(
  holeStatuses: HoleStatus[],
  validatedHoles: boolean[],
  pointsPerHole: number = 3 // Default: high-low has 3 points per hole
): GameWonStatus {
  const validatedCount = validatedHoles.filter(v => v).length;
  const holesRemaining = 18 - validatedCount;
  
  if (validatedCount === 0) {
    return {
      isWon: false,
      winningTeam: null,
      margin: 0,
      holesRemaining,
      decisionHole: 0,
      displayText: '',
    };
  }

  // Get current standing after last validated hole
  const lastValidatedIndex = validatedHoles.lastIndexOf(true);
  if (lastValidatedIndex === -1) {
    return {
      isWon: false,
      winningTeam: null,
      margin: 0,
      holesRemaining,
      decisionHole: 0,
      displayText: '',
    };
  }

  const currentStatus = holeStatuses[lastValidatedIndex];
  const currentDiff = currentStatus.cumulativeTeamAPoints - currentStatus.cumulativeTeamBPoints;
  const maxRemainingPoints = holesRemaining * pointsPerHole;

  // Check if current leader's advantage is insurmountable
  const absDiff = Math.abs(currentDiff);
  
  if (absDiff > maxRemainingPoints) {
    const winningTeam = currentDiff > 0 ? 'team-a' : 'team-b';
    
    // Find the decision hole (when the game became unwinnable)
    let decisionHole = lastValidatedIndex + 1;
    for (let i = lastValidatedIndex; i >= 0; i--) {
      if (!validatedHoles[i]) continue;
      
      const statusAtHole = holeStatuses[i];
      const diffAtHole = statusAtHole.cumulativeTeamAPoints - statusAtHole.cumulativeTeamBPoints;
      const holesRemainingAtHole = 18 - (i + 1);
      const maxPointsAtHole = holesRemainingAtHole * pointsPerHole;
      
      if (Math.abs(diffAtHole) <= maxPointsAtHole) {
        decisionHole = i + 2; // The next hole was the decision
        break;
      }
      decisionHole = i + 1;
    }

    return {
      isWon: true,
      winningTeam,
      margin: absDiff,
      holesRemaining,
      decisionHole,
      displayText: `${absDiff}&${holesRemaining}`,
    };
  }

  // Game complete - all 18 holes played
  if (validatedCount === 18 && currentDiff !== 0) {
    return {
      isWon: true,
      winningTeam: currentDiff > 0 ? 'team-a' : 'team-b',
      margin: absDiff,
      holesRemaining: 0,
      decisionHole: 18,
      displayText: `${absDiff} UP`,
    };
  }

  return {
    isWon: false,
    winningTeam: null,
    margin: absDiff,
    holesRemaining,
    decisionHole: 0,
    displayText: '',
  };
}

/**
 * Get display text for hole status (e.g., "3UP" in team color)
 */
export function getHoleStatusDisplay(status: HoleStatus): {
  text: string;
  teamId: 'team-a' | 'team-b' | null;
} {
  if (status.leadingTeam === 'tied' || status.leadAmount === 0) {
    return { text: 'AS', teamId: null }; // "All Square"
  }

  return {
    text: `${status.leadAmount}UP`,
    teamId: status.leadingTeam,
  };
}

/**
 * Get team color class based on team ID
 */
export function getTeamColorClasses(teamId: 'team-a' | 'team-b') {
  return TEAM_COLORS[teamId];
}
