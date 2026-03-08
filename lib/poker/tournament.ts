export const HANDS_PER_LEVEL = 6;

export interface TournamentLevel {
  level: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
}

export const TOURNAMENT_LEVELS: TournamentLevel[] = [
  { level: 1,  smallBlind: 50,   bigBlind: 100,  ante: 0 },
  { level: 2,  smallBlind: 75,   bigBlind: 150,  ante: 0 },
  { level: 3,  smallBlind: 100,  bigBlind: 200,  ante: 25 },
  { level: 4,  smallBlind: 150,  bigBlind: 300,  ante: 50 },
  { level: 5,  smallBlind: 200,  bigBlind: 400,  ante: 75 },
  { level: 6,  smallBlind: 300,  bigBlind: 600,  ante: 100 },
  { level: 7,  smallBlind: 500,  bigBlind: 1000, ante: 150 },
  { level: 8,  smallBlind: 750,  bigBlind: 1500, ante: 200 },
  { level: 9,  smallBlind: 1000, bigBlind: 2000, ante: 300 },
  { level: 10, smallBlind: 2000, bigBlind: 4000, ante: 500 },
];

/** Returns the tournament level active for a given hand number (1-based). */
export function getLevelForHand(handNumber: number): TournamentLevel {
  const idx = Math.min(
    Math.floor((Math.max(handNumber, 1) - 1) / HANDS_PER_LEVEL),
    TOURNAMENT_LEVELS.length - 1,
  );
  return TOURNAMENT_LEVELS[idx];
}

/**
 * How many hands remain in the current level, including the current hand.
 * Returns 0 if already at the last level.
 */
export function handsRemainingInLevel(handNumber: number): number {
  const currentIdx = Math.floor((Math.max(handNumber, 1) - 1) / HANDS_PER_LEVEL);
  if (currentIdx >= TOURNAMENT_LEVELS.length - 1) return 0;
  return HANDS_PER_LEVEL - ((Math.max(handNumber, 1) - 1) % HANDS_PER_LEVEL);
}
