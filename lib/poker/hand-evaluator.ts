import { Card } from "./types";

export interface HandResult {
  score: number;
  description: string;
  category: number; // 0=High Card … 8=Straight Flush
}

const CAT_NAMES = [
  "High Card", "One Pair", "Two Pair", "Three of a Kind",
  "Straight", "Flush", "Full House", "Four of a Kind", "Straight Flush",
];

function encodeScore(cat: number, k1 = 0, k2 = 0, k3 = 0, k4 = 0, k5 = 0): number {
  return cat * 1e10 + k1 * 1e8 + k2 * 1e6 + k3 * 1e4 + k4 * 1e2 + k5;
}

function rankName(v: number): string {
  const n: Record<number, string> = {
    14: "Ace", 13: "King", 12: "Queen", 11: "Jack", 10: "Ten",
    9: "Nine", 8: "Eight", 7: "Seven", 6: "Six", 5: "Five", 4: "Four", 3: "Three", 2: "Two",
  };
  return n[v] ?? String(v);
}

function evaluate5(cards: Card[]): HandResult {
  let vals = cards.map(c => c.value).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const isFlush = new Set(suits).size === 1;

  // Check straight (including A-low)
  const uniq = [...new Set(vals)];
  let isStraight = uniq.length === 5 && vals[0] - vals[4] === 4;
  let straightHigh = vals[0];
  if (!isStraight && uniq.includes(14) && uniq.includes(2) && uniq.includes(3) && uniq.includes(4) && uniq.includes(5)) {
    isStraight = true;
    straightHigh = 5;
    vals = [5, 4, 3, 2, 1];
  }

  if (isFlush && isStraight) {
    const desc = straightHigh === 14 ? "Royal Flush" : `Straight Flush, ${rankName(straightHigh)}-high`;
    return { score: encodeScore(8, straightHigh), description: desc, category: 8 };
  }

  // Frequency map
  const freq: Record<number, number> = {};
  vals.forEach(v => { freq[v] = (freq[v] ?? 0) + 1; });
  const groups = Object.entries(freq)
    .map(([v, c]) => ({ v: Number(v), c }))
    .sort((a, b) => b.c - a.c || b.v - a.v);
  const [g0, g1, g2, g3] = groups;

  if (g0.c === 4) return { score: encodeScore(7, g0.v, g1.v), description: `Four of a Kind, ${rankName(g0.v)}s`, category: 7 };
  if (g0.c === 3 && g1?.c === 2) return { score: encodeScore(6, g0.v, g1.v), description: `Full House, ${rankName(g0.v)}s full of ${rankName(g1.v)}s`, category: 6 };
  if (isFlush) return { score: encodeScore(5, vals[0], vals[1], vals[2], vals[3], vals[4]), description: `Flush, ${rankName(vals[0])}-high`, category: 5 };
  if (isStraight) return { score: encodeScore(4, straightHigh), description: `Straight, ${rankName(straightHigh)}-high`, category: 4 };
  if (g0.c === 3) return { score: encodeScore(3, g0.v, g1.v, g2.v), description: `Three of a Kind, ${rankName(g0.v)}s`, category: 3 };
  if (g0.c === 2 && g1?.c === 2) {
    const kicker = g2?.v ?? 0;
    return { score: encodeScore(2, g0.v, g1.v, kicker), description: `Two Pair, ${rankName(g0.v)}s & ${rankName(g1.v)}s`, category: 2 };
  }
  if (g0.c === 2) return { score: encodeScore(1, g0.v, g1.v, g2?.v ?? 0, g3?.v ?? 0), description: `Pair of ${rankName(g0.v)}s`, category: 1 };
  return { score: encodeScore(0, vals[0], vals[1], vals[2], vals[3], vals[4]), description: `${rankName(vals[0])}-high`, category: 0 };
}

function choose5(arr: Card[]): Card[][] {
  const results: Card[][] = [];
  const n = arr.length;
  for (let a = 0; a < n - 4; a++)
    for (let b = a + 1; b < n - 3; b++)
      for (let c = b + 1; c < n - 2; c++)
        for (let d = c + 1; d < n - 1; d++)
          for (let e = d + 1; e < n; e++)
            results.push([arr[a], arr[b], arr[c], arr[d], arr[e]]);
  return results;
}

export function evaluateBestHand(holeCards: Card[], communityCards: Card[]): HandResult {
  const all = [...holeCards, ...communityCards];
  if (all.length < 5) return { score: 0, description: "—", category: -1 };
  const combos = choose5(all);
  let best: HandResult = { score: -1, description: "", category: -1 };
  for (const combo of combos) {
    const r = evaluate5(combo);
    if (r.score > best.score) best = r;
  }
  return best;
}

export { CAT_NAMES };
