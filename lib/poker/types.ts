export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank =
  | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "T" | "J" | "Q" | "K" | "A";

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // 2–14
}

export type GamePhase = "idle" | "preflop" | "flop" | "turn" | "river" | "showdown";
export type PlayerAction = "fold" | "check" | "call" | "raise" | "all-in";
export type GameMode = "normal" | "vision" | "advisor" | "training";

export type AIPersonality = "TAG" | "LAG" | "nit" | "fish" | "maniac";

export const PERSONALITIES: AIPersonality[] = ["TAG", "LAG", "nit", "fish", "maniac"];

export const PERSONALITY_LABELS: Record<AIPersonality, string> = {
  TAG: "Tight-Aggressive",
  LAG: "Loose-Aggressive",
  nit: "Nit",
  fish: "Fish",
  maniac: "Maniac",
};

export interface Player {
  id: string;
  name: string;
  avatar: string;
  stack: number;
  holeCards: Card[];
  isHuman: boolean;
  isFolded: boolean;
  isAllIn: boolean;
  streetBet: number;       // bet in current street (resets each street)
  totalBetThisHand: number; // total bet across all streets (for side pots)
  seatIndex: number;       // fixed seat 0–5
  lastAction: PlayerAction | null;
  lastActionAmount: number;
  personality: AIPersonality | null;
  aiModel: string | null;
  winProbability: number;  // 0–100
  isDealer: boolean;
  isSB: boolean;
  isBB: boolean;
  isActive: boolean;       // currently acting
  isEliminated: boolean;
  handDescription: string | null;
}

export interface Pot {
  amount: number;
  eligibleIds: string[];
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  communityCards: Card[];
  mainPot: number;
  sidePots: Pot[];
  currentBet: number;      // highest bet this street
  minRaiseBy: number;      // min raise increment
  toAct: number[];         // seat indices still to act
  currentPlayerIndex: number;
  dealerIndex: number;
  smallBlind: number;
  bigBlind: number;
  deck: Card[];
  handNumber: number;
  mode: GameMode;
  winners: { playerId: string; amount: number; handDesc: string }[];
  lastAction: { playerIndex: number; action: PlayerAction; amount: number } | null;
  isWaitingForAI: boolean;
  showdownReveal: boolean;
}

export interface AvailableActions {
  canFold: boolean;
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  canRaise: boolean;
  minRaise: number;
  maxRaise: number;
  canAllIn: boolean;
}
