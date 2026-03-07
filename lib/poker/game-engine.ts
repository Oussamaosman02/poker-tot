"use client";

import { GameState, Player, Card, GamePhase, PlayerAction, GameMode, AIPersonality, PERSONALITIES, AvailableActions } from "./types";
import { createDeck, shuffleDeck } from "./deck";
import { evaluateBestHand } from "./hand-evaluator";
import { AI_MODELS_POOL } from "@/lib/openrouter";

// ─── Randomly assign models from pool, one per personality slot ─────────────
function assignModels(): Record<AIPersonality, string> {
  const shuffled = [...AI_MODELS_POOL].sort(() => Math.random() - 0.5);
  const personalities: AIPersonality[] = ["TAG", "LAG", "nit", "fish", "maniac"];
  return Object.fromEntries(personalities.map((p, i) => [p, shuffled[i % shuffled.length]])) as Record<AIPersonality, string>;
}

export const AI_MODELS = assignModels();

const AI_NAMES = ["Viktor", "Maria", "Chen", "Sofia", "James"];
const AI_AVATARS = ["V", "M", "C", "S", "J"];

// ─── Initial State ──────────────────────────────────────────────────────────
export function createInitialState(mode: GameMode = "normal"): GameState {
  const personalities = [...PERSONALITIES].sort(() => Math.random() - 0.5);
  const players: Player[] = [
    {
      id: "human",
      name: "You",
      avatar: "YOU",
      stack: 10000,
      holeCards: [],
      isHuman: true,
      isFolded: false,
      isAllIn: false,
      streetBet: 0,
      totalBetThisHand: 0,
      seatIndex: 0,
      lastAction: null,
      lastActionAmount: 0,
      personality: null,
      aiModel: null,
      winProbability: 0,
      isDealer: false,
      isSB: false,
      isBB: false,
      isActive: false,
      isEliminated: false,
      handDescription: null,
    },
    ...Array.from({ length: 5 }, (_, i) => {
      const p = personalities[i];
      return {
        id: `ai-${i}`,
        name: AI_NAMES[i],
        avatar: AI_AVATARS[i],
        stack: 10000,
        holeCards: [],
        isHuman: false,
        isFolded: false,
        isAllIn: false,
        streetBet: 0,
        totalBetThisHand: 0,
        seatIndex: i + 1,
        lastAction: null,
        lastActionAmount: 0,
        personality: p,
        aiModel: AI_MODELS[p],
        winProbability: 0,
        isDealer: false,
        isSB: false,
        isBB: false,
        isActive: false,
        isEliminated: false,
        handDescription: null,
      } as Player;
    }),
  ];

  return {
    phase: "idle",
    players,
    communityCards: [],
    mainPot: 0,
    sidePots: [],
    currentBet: 0,
    minRaiseBy: 100,
    toAct: [],
    currentPlayerIndex: 0,
    dealerIndex: Math.floor(Math.random() * 6),
    smallBlind: 50,
    bigBlind: 100,
    deck: [],
    handNumber: 0,
    mode,
    winners: [],
    lastAction: null,
    isWaitingForAI: false,
    showdownReveal: false,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function getNextActiveIdx(players: Player[], from: number): number {
  const n = players.length;
  for (let i = 1; i <= n; i++) {
    const idx = (from + i) % n;
    if (!players[idx].isEliminated) return idx;
  }
  return from;
}

function getActiveAfter(players: Player[], fromIdx: number): number[] {
  const n = players.length;
  const result: number[] = [];
  for (let i = 1; i < n; i++) {
    const idx = (fromIdx + i) % n;
    const p = players[idx];
    if (!p.isFolded && !p.isEliminated && !p.isAllIn) result.push(idx);
  }
  return result;
}

function getPostFlopOrder(players: Player[], dealerIdx: number): number[] {
  const n = players.length;
  const result: number[] = [];
  for (let i = 1; i <= n; i++) {
    const idx = (dealerIdx + i) % n;
    const p = players[idx];
    if (!p.isFolded && !p.isEliminated && !p.isAllIn) result.push(idx);
  }
  return result;
}

export function totalPot(state: GameState): number {
  return state.mainPot + state.sidePots.reduce((s, p) => s + p.amount, 0);
}

// ─── Start Hand ─────────────────────────────────────────────────────────────
export function startHand(state: GameState): GameState {
  const alive = state.players.filter(p => !p.isEliminated);
  if (alive.length < 2) return state;

  const deck = shuffleDeck(createDeck());

  // Rotate dealer among alive players
  let newDealerIdx = state.dealerIndex;
  for (let i = 0; i < state.players.length; i++) {
    newDealerIdx = (newDealerIdx + 1) % state.players.length;
    if (!state.players[newDealerIdx].isEliminated) break;
  }

  const sbIdx = getNextActiveIdx(state.players, newDealerIdx);
  const bbIdx = getNextActiveIdx(state.players, sbIdx);
  const utgIdx = getNextActiveIdx(state.players, bbIdx);

  // Reset all players
  const players: Player[] = state.players.map(p => ({
    ...p,
    holeCards: [],
    isFolded: p.isEliminated,
    isAllIn: false,
    streetBet: 0,
    totalBetThisHand: 0,
    lastAction: null,
    lastActionAmount: 0,
    isDealer: false,
    isSB: false,
    isBB: false,
    isActive: false,
    winProbability: 0,
    handDescription: null,
  }));

  players[newDealerIdx].isDealer = true;
  players[sbIdx].isSB = true;
  players[bbIdx].isBB = true;

  // Post blinds
  const sbAmt = Math.min(state.smallBlind, players[sbIdx].stack);
  players[sbIdx].stack -= sbAmt;
  players[sbIdx].streetBet = sbAmt;
  players[sbIdx].totalBetThisHand = sbAmt;
  if (players[sbIdx].stack === 0) players[sbIdx].isAllIn = true;

  const bbAmt = Math.min(state.bigBlind, players[bbIdx].stack);
  players[bbIdx].stack -= bbAmt;
  players[bbIdx].streetBet = bbAmt;
  players[bbIdx].totalBetThisHand = bbAmt;
  if (players[bbIdx].stack === 0) players[bbIdx].isAllIn = true;

  // Deal 2 cards each
  let deckPos = 0;
  for (const p of players) {
    if (!p.isEliminated) {
      p.holeCards = [deck[deckPos++], deck[deckPos++]];
    }
  }

  // Pre-flop toAct: starting UTG, ending BB (BB has option)
  const toAct = buildPreflopToAct(players, newDealerIdx, bbIdx);
  const firstToAct = toAct[0];
  players[firstToAct].isActive = true;

  return {
    ...state,
    phase: "preflop",
    players,
    communityCards: [],
    mainPot: sbAmt + bbAmt,
    sidePots: [],
    currentBet: bbAmt,
    minRaiseBy: bbAmt,
    toAct,
    currentPlayerIndex: firstToAct,
    dealerIndex: newDealerIdx,
    deck: deck.slice(deckPos),
    handNumber: state.handNumber + 1,
    winners: [],
    lastAction: null,
    isWaitingForAI: !players[firstToAct].isHuman,
    showdownReveal: false,
  };
}

function buildPreflopToAct(players: Player[], dealerIdx: number, bbIdx: number): number[] {
  // All active players starting from UTG (player after BB), ending with BB
  const n = players.length;
  const order: number[] = [];
  // Start from the player after BB
  for (let i = 1; i <= n; i++) {
    const idx = (bbIdx + i) % n;
    const p = players[idx];
    if (!p.isEliminated && !p.isAllIn) order.push(idx);
  }
  return order;
}

// ─── Available Actions ───────────────────────────────────────────────────────
export function getAvailableActions(state: GameState, playerIdx: number): AvailableActions {
  const p = state.players[playerIdx];
  if (!p || p.isFolded || p.isAllIn || p.isEliminated) {
    return { canFold: false, canCheck: false, canCall: false, callAmount: 0, canRaise: false, minRaise: 0, maxRaise: 0, canAllIn: false };
  }
  const callAmount = Math.min(state.currentBet - p.streetBet, p.stack);
  const canCheck = callAmount === 0;
  const canCall = callAmount > 0 && callAmount < p.stack;
  const minRaiseTo = state.currentBet + state.minRaiseBy;
  const minRaise = Math.min(minRaiseTo, p.stack + p.streetBet);
  const maxRaise = p.stack + p.streetBet;
  const canRaise = p.stack > callAmount && p.stack + p.streetBet > state.currentBet + state.minRaiseBy;

  return {
    canFold: true,
    canCheck,
    canCall,
    callAmount,
    canRaise,
    minRaise,
    maxRaise,
    canAllIn: p.stack > 0,
  };
}

// ─── Apply Action ────────────────────────────────────────────────────────────
export function applyAction(
  state: GameState,
  playerIdx: number,
  action: PlayerAction,
  raiseAmount?: number
): GameState {
  const players = state.players.map(p => ({ ...p, holeCards: [...p.holeCards] }));
  const p = players[playerIdx];
  let pot = state.mainPot;
  let currentBet = state.currentBet;
  let minRaiseBy = state.minRaiseBy;
  let toAct = state.toAct.filter(i => i !== playerIdx);

  p.isActive = false;
  p.lastAction = action;

  switch (action) {
    case "fold":
      p.isFolded = true;
      p.lastActionAmount = 0;
      break;

    case "check":
      p.lastActionAmount = 0;
      break;

    case "call": {
      const amt = Math.min(currentBet - p.streetBet, p.stack);
      p.stack -= amt;
      p.streetBet += amt;
      p.totalBetThisHand += amt;
      pot += amt;
      p.lastActionAmount = amt;
      if (p.stack === 0) p.isAllIn = true;
      break;
    }

    case "raise": {
      const raiseTo = Math.min(raiseAmount ?? (currentBet + minRaiseBy), p.stack + p.streetBet);
      const toPut = raiseTo - p.streetBet;
      const increment = raiseTo - currentBet;
      pot += toPut;
      p.totalBetThisHand += toPut;
      p.stack -= toPut;
      p.streetBet = raiseTo;
      p.lastActionAmount = raiseTo;
      minRaiseBy = Math.max(minRaiseBy, increment);
      currentBet = raiseTo;
      if (p.stack === 0) p.isAllIn = true;
      // Everyone else must act again
      toAct = getActiveAfter(players, playerIdx).filter(i => i !== playerIdx);
      break;
    }

    case "all-in": {
      const allAmt = p.stack;
      const newStreetBet = p.streetBet + allAmt;
      pot += allAmt;
      p.totalBetThisHand += allAmt;
      p.stack = 0;
      p.isAllIn = true;
      p.lastActionAmount = allAmt;
      p.streetBet = newStreetBet;
      if (newStreetBet > currentBet) {
        const inc = newStreetBet - currentBet;
        minRaiseBy = Math.max(minRaiseBy, inc);
        currentBet = newStreetBet;
        toAct = getActiveAfter(players, playerIdx).filter(i => i !== playerIdx);
      }
      break;
    }
  }

  const nextState: GameState = {
    ...state,
    players,
    mainPot: pot,
    currentBet,
    minRaiseBy,
    toAct,
    lastAction: { playerIndex: playerIdx, action, amount: p.lastActionAmount },
    isWaitingForAI: false,
  };

  // Check if only one player remains
  const notFolded = players.filter(pl => !pl.isFolded && !pl.isEliminated);
  if (notFolded.length === 1) {
    return resolveLastPlayer(nextState, notFolded[0].seatIndex);
  }

  // Betting round over?
  if (toAct.length === 0) {
    return advancePhase(nextState);
  }

  // Next player
  const next = toAct[0];
  players[next].isActive = true;
  return { ...nextState, currentPlayerIndex: next, isWaitingForAI: !players[next].isHuman };
}

// ─── Phase Advancement ───────────────────────────────────────────────────────
function advancePhase(state: GameState): GameState {
  const players = state.players.map(p => ({
    ...p,
    streetBet: 0,
    lastAction: null,
    isActive: false,
  }));

  let newPhase: GamePhase;
  let community = [...state.communityCards];
  let deck = [...state.deck];

  switch (state.phase) {
    case "preflop":
      newPhase = "flop";
      community = [...community, deck[0], deck[1], deck[2]];
      deck = deck.slice(3);
      break;
    case "flop":
      newPhase = "turn";
      community = [...community, deck[0]];
      deck = deck.slice(1);
      break;
    case "turn":
      newPhase = "river";
      community = [...community, deck[0]];
      deck = deck.slice(1);
      break;
    case "river":
      return resolveShowdown({ ...state, players, communityCards: community });
    default:
      return state;
  }

  const toAct = getPostFlopOrder(players, state.dealerIndex);

  // If no one can act (all all-in or folded), run out the board
  if (toAct.length === 0) {
    return advancePhase({ ...state, players, communityCards: community, deck, phase: newPhase, currentBet: 0, minRaiseBy: state.bigBlind, toAct: [] });
  }

  const first = toAct[0];
  players[first].isActive = true;

  return {
    ...state,
    phase: newPhase,
    players,
    communityCards: community,
    deck,
    currentBet: 0,
    minRaiseBy: state.bigBlind,
    toAct,
    currentPlayerIndex: first,
    isWaitingForAI: !players[first].isHuman,
  };
}

// ─── Showdown ────────────────────────────────────────────────────────────────
function resolveLastPlayer(state: GameState, winnerSeatIdx: number): GameState {
  const players = state.players.map(p => ({ ...p, isActive: false }));
  const winner = players[winnerSeatIdx];
  const pot = totalPot(state) + state.mainPot - (totalPot(state));  // ensure we use mainPot
  winner.stack += state.mainPot;

  return {
    ...state,
    players,
    phase: "showdown",
    mainPot: 0,
    sidePots: [],
    winners: [{ playerId: winner.id, amount: state.mainPot, handDesc: "Last player standing" }],
    isWaitingForAI: false,
    showdownReveal: false,
    toAct: [],
  };
}

function resolveShowdown(state: GameState): GameState {
  const players = state.players.map(p => ({ ...p, isActive: false }));
  const contenders = players.filter(p => !p.isFolded && !p.isEliminated && p.holeCards.length >= 2);

  if (contenders.length === 0) return { ...state, players, phase: "showdown" };

  // Evaluate hands
  contenders.forEach(p => {
    const result = evaluateBestHand(p.holeCards, state.communityCards);
    p.handDescription = result.description;
  });

  // Calculate side pots
  const pots = calculateSidePots(players);
  const winnerEntries: { playerId: string; amount: number; handDesc: string }[] = [];

  for (const pot of pots) {
    const eligible = contenders.filter(p => pot.eligibleIds.includes(p.id));
    if (eligible.length === 0) continue;

    let bestScore = -1;
    let potWinners: Player[] = [];
    for (const p of eligible) {
      const r = evaluateBestHand(p.holeCards, state.communityCards);
      if (r.score > bestScore) { bestScore = r.score; potWinners = [p]; }
      else if (r.score === bestScore) potWinners.push(p);
    }

    const share = Math.floor(pot.amount / potWinners.length);
    potWinners.forEach(w => {
      const idx = players.findIndex(p => p.id === w.id);
      players[idx].stack += share;
      const existing = winnerEntries.find(e => e.playerId === w.id);
      const desc = evaluateBestHand(w.holeCards, state.communityCards).description;
      if (existing) existing.amount += share;
      else winnerEntries.push({ playerId: w.id, amount: share, handDesc: desc });
    });
  }

  // Eliminate broke players
  players.forEach(p => {
    if (p.stack <= 0 && !p.isEliminated) p.isEliminated = true;
  });

  return {
    ...state,
    players,
    phase: "showdown",
    mainPot: 0,
    sidePots: [],
    winners: winnerEntries,
    toAct: [],
    isWaitingForAI: false,
    showdownReveal: true,
  };
}

function calculateSidePots(players: Player[]) {
  const contributors = players.filter(p => p.totalBetThisHand > 0);
  const levels = [...new Set(contributors.map(p => p.totalBetThisHand))].sort((a, b) => a - b);
  const pots: { amount: number; eligibleIds: string[] }[] = [];
  let prev = 0;

  for (const level of levels) {
    const diff = level - prev;
    const eligible = contributors.filter(p => p.totalBetThisHand >= level && !p.isFolded);
    const all = contributors.filter(p => p.totalBetThisHand >= level);
    const amount = diff * all.length;
    if (amount > 0 && eligible.length > 0) {
      pots.push({ amount, eligibleIds: eligible.map(p => p.id) });
    }
    prev = level;
  }

  return pots;
}

// ─── Position Label ──────────────────────────────────────────────────────────
export function getPositionLabel(state: GameState, playerIdx: number): string {
  const p = state.players[playerIdx];
  if (p.isDealer) return "BTN";
  if (p.isSB) return "SB";
  if (p.isBB) return "BB";
  // Relative position from dealer
  const n = state.players.filter(pl => !pl.isEliminated).length;
  return n <= 4 ? "MP" : "UTG";
}
