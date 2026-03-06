import { Card, Player } from "./types";
import { createDeck, shuffleDeck } from "./deck";
import { evaluateBestHand } from "./hand-evaluator";

export function calculateOdds(
  players: Player[],
  communityCards: Card[],
  simulations = 400
): Record<string, number> {
  const active = players.filter(p => !p.isFolded && !p.isEliminated && p.holeCards.length === 2);
  if (active.length === 0) return {};
  if (active.length === 1) return { [active[0].id]: 100 };

  const usedKeys = new Set([
    ...active.flatMap(p => p.holeCards.map(c => `${c.rank}${c.suit}`)),
    ...communityCards.map(c => `${c.rank}${c.suit}`),
  ]);
  const remaining = createDeck().filter(c => !usedKeys.has(`${c.rank}${c.suit}`));
  const needed = 5 - communityCards.length;

  const wins: Record<string, number> = {};
  active.forEach(p => { wins[p.id] = 0; });

  for (let i = 0; i < simulations; i++) {
    const drawn = shuffleDeck(remaining).slice(0, needed);
    const board = [...communityCards, ...drawn];

    let bestScore = -1;
    let pot_winners: string[] = [];
    for (const p of active) {
      const r = evaluateBestHand(p.holeCards, board);
      if (r.score > bestScore) { bestScore = r.score; pot_winners = [p.id]; }
      else if (r.score === bestScore) pot_winners.push(p.id);
    }
    const share = 1 / pot_winners.length;
    pot_winners.forEach(id => { wins[id] += share; });
  }

  const odds: Record<string, number> = {};
  active.forEach(p => {
    odds[p.id] = Math.round((wins[p.id] / simulations) * 100);
  });
  return odds;
}

export function preflopHandStrength(holeCards: Card[]): number {
  if (holeCards.length < 2) return 0;
  const [c1, c2] = holeCards;
  const v1 = c1.value, v2 = c2.value;
  const hi = Math.max(v1, v2), lo = Math.min(v1, v2);
  const isPair = v1 === v2;
  const isSuited = c1.suit === c2.suit;
  const gap = hi - lo;

  if (isPair) {
    if (hi >= 10) return 0.9;
    if (hi >= 7) return 0.65;
    return 0.45;
  }
  if (hi === 14) {
    if (lo >= 10) return 0.82;
    if (lo >= 7) return 0.65;
    return 0.52;
  }
  if (hi === 13 && lo >= 10) return 0.72;
  if (hi >= 10 && lo >= 10) return 0.68;
  if (isSuited && hi >= 10 && gap <= 3) return 0.58;
  if (isSuited && gap <= 2) return 0.5;
  if (!isSuited && gap <= 2 && hi >= 8) return 0.46;
  return Math.max(0.15, 0.2 + (hi / 14) * 0.2);
}
