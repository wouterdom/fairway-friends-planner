// Stroke table lookup for calculating playing handicap based on handicap index and tee color
// Based on World Handicap System course handicap tables

export interface StrokeTableEntry {
  from: number;
  to: number;
  courseHandicap: number;
}

// White tees: Course Rating 71.7, Slope Rating 129
export const WHITE_TEE_TABLE: StrokeTableEntry[] = [
  { from: -3.6, to: -2.9, courseHandicap: -3 },
  { from: -2.8, to: -2.0, courseHandicap: -2 },
  { from: -1.9, to: -1.1, courseHandicap: -1 },
  { from: -1.0, to: -0.2, courseHandicap: 0 },
  { from: -0.1, to: 0.7, courseHandicap: 1 },
  { from: 0.8, to: 1.5, courseHandicap: 2 },
  { from: 1.6, to: 2.4, courseHandicap: 3 },
  { from: 2.5, to: 3.3, courseHandicap: 4 },
  { from: 3.4, to: 4.2, courseHandicap: 5 },
  { from: 4.3, to: 5.0, courseHandicap: 6 },
  { from: 5.1, to: 5.9, courseHandicap: 7 },
  { from: 6.0, to: 6.8, courseHandicap: 8 },
  { from: 6.9, to: 7.7, courseHandicap: 9 },
  { from: 7.8, to: 8.5, courseHandicap: 10 },
  { from: 8.6, to: 9.4, courseHandicap: 11 },
  { from: 9.5, to: 10.3, courseHandicap: 12 },
  { from: 10.4, to: 11.2, courseHandicap: 13 },
  { from: 11.3, to: 12.0, courseHandicap: 14 },
  { from: 12.1, to: 12.9, courseHandicap: 15 },
  { from: 13.0, to: 13.8, courseHandicap: 16 },
  { from: 13.9, to: 14.7, courseHandicap: 17 },
  { from: 14.8, to: 15.5, courseHandicap: 18 },
  { from: 15.6, to: 16.4, courseHandicap: 19 },
  { from: 16.5, to: 17.3, courseHandicap: 20 },
  { from: 17.4, to: 18.2, courseHandicap: 21 },
  { from: 18.3, to: 19.0, courseHandicap: 22 },
  { from: 19.1, to: 19.9, courseHandicap: 23 },
  { from: 20.0, to: 20.8, courseHandicap: 24 },
  { from: 20.9, to: 21.7, courseHandicap: 25 },
  { from: 21.8, to: 22.5, courseHandicap: 26 },
  { from: 22.6, to: 23.4, courseHandicap: 27 },
  { from: 23.5, to: 24.3, courseHandicap: 28 },
  { from: 24.4, to: 25.2, courseHandicap: 29 },
  { from: 25.3, to: 26.1, courseHandicap: 30 },
  { from: 26.2, to: 26.9, courseHandicap: 31 },
  { from: 27.0, to: 27.8, courseHandicap: 32 },
  { from: 27.9, to: 28.7, courseHandicap: 33 },
  { from: 28.8, to: 29.6, courseHandicap: 34 },
  { from: 29.7, to: 30.4, courseHandicap: 35 },
  { from: 30.5, to: 31.3, courseHandicap: 36 },
  { from: 31.4, to: 32.2, courseHandicap: 37 },
  { from: 32.3, to: 33.1, courseHandicap: 38 },
  { from: 33.2, to: 33.9, courseHandicap: 39 },
  { from: 34.0, to: 34.8, courseHandicap: 40 },
  { from: 34.9, to: 35.7, courseHandicap: 41 },
  { from: 35.8, to: 36.6, courseHandicap: 42 },
  { from: 36.7, to: 37.4, courseHandicap: 43 },
  { from: 37.5, to: 38.3, courseHandicap: 44 },
  { from: 38.4, to: 39.2, courseHandicap: 45 },
  { from: 39.3, to: 40.1, courseHandicap: 46 },
  { from: 40.2, to: 40.9, courseHandicap: 47 },
  { from: 41.0, to: 41.8, courseHandicap: 48 },
  { from: 41.9, to: 42.7, courseHandicap: 49 },
  { from: 42.8, to: 43.6, courseHandicap: 50 },
  { from: 43.7, to: 44.4, courseHandicap: 51 },
  { from: 44.5, to: 45.3, courseHandicap: 52 },
  { from: 45.4, to: 46.2, courseHandicap: 53 },
  { from: 46.3, to: 47.1, courseHandicap: 54 },
  { from: 47.2, to: 48.0, courseHandicap: 55 },
  { from: 48.1, to: 48.8, courseHandicap: 56 },
  { from: 48.9, to: 49.7, courseHandicap: 57 },
  { from: 49.8, to: 50.6, courseHandicap: 58 },
  { from: 50.7, to: 51.5, courseHandicap: 59 },
  { from: 51.6, to: 52.3, courseHandicap: 60 },
  { from: 52.4, to: 53.2, courseHandicap: 61 },
  { from: 53.3, to: 54.0, courseHandicap: 62 },
];

// Yellow tees: Course Rating 68.7, Slope Rating 120
export const YELLOW_TEE_TABLE: StrokeTableEntry[] = [
  { from: -3.0, to: -2.1, courseHandicap: -5 },
  { from: -2.0, to: -1.2, courseHandicap: -4 },
  { from: -1.1, to: -0.2, courseHandicap: -3 },
  { from: -0.1, to: 0.7, courseHandicap: -2 },
  { from: 0.8, to: 1.6, courseHandicap: -1 },
  { from: 1.7, to: 2.6, courseHandicap: 0 },
  { from: 2.7, to: 3.5, courseHandicap: 1 },
  { from: 3.6, to: 4.5, courseHandicap: 2 },
  { from: 4.6, to: 5.4, courseHandicap: 3 },
  { from: 5.5, to: 6.4, courseHandicap: 4 },
  { from: 6.5, to: 7.3, courseHandicap: 5 },
  { from: 7.4, to: 8.2, courseHandicap: 6 },
  { from: 8.3, to: 9.2, courseHandicap: 7 },
  { from: 9.3, to: 10.1, courseHandicap: 8 },
  { from: 10.2, to: 11.1, courseHandicap: 9 },
  { from: 11.2, to: 12.0, courseHandicap: 10 },
  { from: 12.1, to: 12.9, courseHandicap: 11 },
  { from: 13.0, to: 13.9, courseHandicap: 12 },
  { from: 14.0, to: 14.8, courseHandicap: 13 },
  { from: 14.9, to: 15.8, courseHandicap: 14 },
  { from: 15.9, to: 16.7, courseHandicap: 15 },
  { from: 16.8, to: 17.7, courseHandicap: 16 },
  { from: 17.8, to: 18.6, courseHandicap: 17 },
  { from: 18.7, to: 19.5, courseHandicap: 18 },
  { from: 19.6, to: 20.5, courseHandicap: 19 },
  { from: 20.6, to: 21.4, courseHandicap: 20 },
  { from: 21.5, to: 22.4, courseHandicap: 21 },
  { from: 22.5, to: 23.3, courseHandicap: 22 },
  { from: 23.4, to: 24.2, courseHandicap: 23 },
  { from: 24.3, to: 25.2, courseHandicap: 24 },
  { from: 25.3, to: 26.1, courseHandicap: 25 },
  { from: 26.2, to: 27.1, courseHandicap: 26 },
  { from: 27.2, to: 28.0, courseHandicap: 27 },
  { from: 28.1, to: 29.0, courseHandicap: 28 },
  { from: 29.1, to: 29.9, courseHandicap: 29 },
  { from: 30.0, to: 30.8, courseHandicap: 30 },
  { from: 30.9, to: 31.8, courseHandicap: 31 },
  { from: 31.9, to: 32.7, courseHandicap: 32 },
  { from: 32.8, to: 33.7, courseHandicap: 33 },
  { from: 33.8, to: 34.6, courseHandicap: 34 },
  { from: 34.7, to: 35.5, courseHandicap: 35 },
  { from: 35.6, to: 36.5, courseHandicap: 36 },
  { from: 36.6, to: 37.4, courseHandicap: 37 },
  { from: 37.5, to: 38.4, courseHandicap: 38 },
  { from: 38.5, to: 39.3, courseHandicap: 39 },
  { from: 39.4, to: 40.3, courseHandicap: 40 },
  { from: 40.4, to: 41.2, courseHandicap: 41 },
  { from: 41.3, to: 42.1, courseHandicap: 42 },
  { from: 42.2, to: 43.1, courseHandicap: 43 },
  { from: 43.2, to: 44.0, courseHandicap: 44 },
  { from: 44.1, to: 45.0, courseHandicap: 45 },
  { from: 45.1, to: 45.9, courseHandicap: 46 },
  { from: 46.0, to: 46.8, courseHandicap: 47 },
  { from: 46.9, to: 47.8, courseHandicap: 48 },
  { from: 47.9, to: 48.7, courseHandicap: 49 },
  { from: 48.8, to: 49.7, courseHandicap: 50 },
  { from: 49.8, to: 50.6, courseHandicap: 51 },
  { from: 50.7, to: 51.6, courseHandicap: 52 },
  { from: 51.7, to: 52.5, courseHandicap: 53 },
  { from: 52.6, to: 53.4, courseHandicap: 54 },
  { from: 53.5, to: 54.0, courseHandicap: 55 },
];

/**
 * Look up playing handicap from handicap index and tee color
 */
export function getPlayingHandicap(
  handicapIndex: number,
  teeColor: 'yellow' | 'white'
): number {
  const table = teeColor === 'white' ? WHITE_TEE_TABLE : YELLOW_TEE_TABLE;
  
  // Find the matching range
  for (const entry of table) {
    if (handicapIndex >= entry.from && handicapIndex <= entry.to) {
      return entry.courseHandicap;
    }
  }
  
  // If handicap index is outside the table range, calculate using slope formula
  // Playing Handicap = Handicap Index × (Slope Rating / 113) + (Course Rating - Par)
  if (teeColor === 'white') {
    // White: CR 71.7, SR 129, Par 72
    return Math.round(handicapIndex * (129 / 113) + (71.7 - 72));
  } else {
    // Yellow: CR 68.7, SR 120, Par 72
    return Math.round(handicapIndex * (120 / 113) + (68.7 - 72));
  }
}

/**
 * Get course info for display
 */
export function getCourseInfo(teeColor: 'yellow' | 'white') {
  if (teeColor === 'white') {
    return {
      length: '5886m',
      courseRating: 71.7,
      slopeRating: 129,
    };
  }
  return {
    length: '5418m',
    courseRating: 68.7,
    slopeRating: 120,
  };
}
