import { Card, Rank, Suit } from "./types";

export type QuizPosition = "UTG" | "MP" | "CO" | "BTN" | "SB" | "BB";
export type QuizSituation = "rfi" | "facing_raise" | "bb_defense";
export type QuizAction = "fold" | "call" | "raise";

function c(notation: string): Card {
  const rank = notation.slice(0, -1) as Rank;
  const suitMap: Record<string, Suit> = { s: "spades", h: "hearts", d: "diamonds", c: "clubs" };
  const valueMap: Record<Rank, number> = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8,
    "9": 9, "T": 10, "J": 11, "Q": 12, "K": 13, "A": 14,
  };
  return { rank, suit: suitMap[notation.slice(-1)], value: valueMap[rank] };
}

export interface PreflopScenario {
  id: string;
  holeCards: [Card, Card];
  position: QuizPosition;
  numPlayers: number;
  situation: QuizSituation;
  stackBB: number;
  raiserPosition?: QuizPosition;
  raiseSize?: number; // in BB
  numCallers?: number;
  correctAction: QuizAction;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  concept: string;
}

export function getSituationLabel(situation: QuizSituation): string {
  switch (situation) {
    case "rfi": return "Raise First In";
    case "facing_raise": return "Facing a Raise";
    case "bb_defense": return "BB Defense";
  }
}

export function describeSituation(s: PreflopScenario): string {
  if (s.situation === "rfi") {
    return `Action is folded to you in ${s.position}. ${s.numPlayers} players at the table, ${s.stackBB}BB effective. What do you do?`;
  }
  if (s.situation === "facing_raise") {
    const callerStr = s.numCallers ? `, ${s.numCallers} caller${s.numCallers > 1 ? "s" : ""}` : "";
    return `${s.raiserPosition} raised to ${s.raiseSize}BB${callerStr}, folded to you in ${s.position}. ${s.stackBB}BB effective. What do you do?`;
  }
  if (s.situation === "bb_defense") {
    return `${s.raiserPosition} raised to ${s.raiseSize}BB, everyone folded. You're in the BB with ${s.stackBB}BB stack. Defend or fold?`;
  }
  return "";
}

export const PREFLOP_SCENARIOS: PreflopScenario[] = [
  // ─── Easy: Obvious RFI ───
  {
    id: "rfi-aa-utg",
    holeCards: [c("As"), c("Ad")],
    position: "UTG", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "raise",
    explanation: "Pocket Aces — always raise! This is the best starting hand in poker. Open raise from any position.",
    difficulty: "easy", concept: "Premium hands",
  },
  {
    id: "rfi-kk-mp",
    holeCards: [c("Ks"), c("Kh")],
    position: "MP", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "raise",
    explanation: "Pocket Kings — second best hand in poker. Raise first in from any position to build the pot preflop.",
    difficulty: "easy", concept: "Premium hands",
  },
  {
    id: "rfi-72o-utg",
    holeCards: [c("7h"), c("2c")],
    position: "UTG", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "fold",
    explanation: "7-2 offsuit is the worst starting hand in Texas Hold'em. Fold from any position — no straight, no flush, terrible kicker.",
    difficulty: "easy", concept: "Junk hands",
  },
  {
    id: "rfi-aks-co",
    holeCards: [c("As"), c("Ks")],
    position: "CO", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "raise",
    explanation: "AK suited is a premium hand — the 'nut' drawing hand. Raise from any position for value.",
    difficulty: "easy", concept: "Premium hands",
  },
  {
    id: "rfi-32o-btn",
    holeCards: [c("3h"), c("2c")],
    position: "BTN", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "fold",
    explanation: "3-2 offsuit has the worst straight potential and will almost always make second-best hands. Fold even from BTN.",
    difficulty: "easy", concept: "Junk hands",
  },
  {
    id: "rfi-qq-utg",
    holeCards: [c("Qh"), c("Qd")],
    position: "UTG", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "raise",
    explanation: "QQ is a premium hand. Raise from UTG to build the pot and narrow the field.",
    difficulty: "easy", concept: "Premium hands",
  },
  {
    id: "rfi-ako-btn",
    holeCards: [c("Ah"), c("Kc")],
    position: "BTN", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "raise",
    explanation: "AK offsuit is a top-5 hand. Raise from any position — it has great equity against any pair.",
    difficulty: "easy", concept: "Premium hands",
  },
  {
    id: "rfi-ajo-btn",
    holeCards: [c("As"), c("Jc")],
    position: "BTN", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "raise",
    explanation: "AJo from BTN — standard open. A broadway hand with strong top-pair potential. Comfortably in BTN range.",
    difficulty: "easy", concept: "Broadway hands",
  },

  // ─── Medium: RFI ───
  {
    id: "rfi-a5s-btn",
    holeCards: [c("As"), c("5s")],
    position: "BTN", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "raise",
    explanation: "A5 suited on the button has flush potential, wheel straight draws, and the ace blocker. Open raise — solid BTN hand.",
    difficulty: "medium", concept: "Suited aces",
  },
  {
    id: "rfi-76s-co",
    holeCards: [c("7s"), c("6s")],
    position: "CO", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "raise",
    explanation: "76 suited from CO is a solid open. Suited connectors play well in multi-way pots with strong straight and flush potential.",
    difficulty: "medium", concept: "Suited connectors",
  },
  {
    id: "rfi-kqo-utg",
    holeCards: [c("Ks"), c("Qh")],
    position: "UTG", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "raise",
    explanation: "KQo is in the UTG opening range in 6-max. It's a strong broadway hand with good equity. Raise.",
    difficulty: "medium", concept: "Broadway hands",
  },
  {
    id: "rfi-55-co",
    holeCards: [c("5s"), c("5h")],
    position: "CO", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "raise",
    explanation: "55 from CO is a standard open in 6-max. Small pairs have great set-mining potential with implied odds.",
    difficulty: "medium", concept: "Small pairs",
  },
  {
    id: "rfi-j7o-btn",
    holeCards: [c("Jh"), c("7c")],
    position: "BTN", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "raise",
    explanation: "J7o is within GTO button range (~45% of hands). From BTN you steal the blinds profitably with many hands.",
    difficulty: "medium", concept: "BTN stealing",
  },
  {
    id: "rfi-a2o-utg",
    holeCards: [c("Ah"), c("2c")],
    position: "UTG", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "fold",
    explanation: "A2 offsuit is too weak for a UTG open. The ace has kicker problems and A2o doesn't make strong hands often enough.",
    difficulty: "medium", concept: "UTG range tightness",
  },
  {
    id: "rfi-t9s-mp",
    holeCards: [c("Ts"), c("9s")],
    position: "MP", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "raise",
    explanation: "T9 suited is a solid MP open. Connected suited hands have great post-flop playability and can make strong straights and flushes.",
    difficulty: "medium", concept: "Suited connectors",
  },
  {
    id: "rfi-a2s-btn",
    holeCards: [c("As"), c("2s")],
    position: "BTN", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "raise",
    explanation: "A2 suited is a solid BTN open. The nut-flush draw and wheel straight potential make this very playable in position.",
    difficulty: "medium", concept: "Suited aces",
  },
  {
    id: "rfi-q9s-mp",
    holeCards: [c("Qs"), c("9s")],
    position: "MP", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "raise",
    explanation: "Q9s from MP — open raise in 6-max. Suited one-gapper with flush and top-pair potential.",
    difficulty: "medium", concept: "Suited hands",
  },
  {
    id: "rfi-k9o-btn",
    holeCards: [c("Ks"), c("9c")],
    position: "BTN", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "raise",
    explanation: "K9o from BTN — open raise. You're in the best position; K9o is comfortably in the BTN opening range.",
    difficulty: "medium", concept: "BTN stealing",
  },
  {
    id: "rfi-k5s-btn",
    holeCards: [c("Ks"), c("5s")],
    position: "BTN", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "raise",
    explanation: "K5s from BTN — open. Suited king with flush potential is in the BTN range. Strong top pair + nut flush draw when you hit.",
    difficulty: "medium", concept: "BTN stealing",
  },
  {
    id: "rfi-axs-sb",
    holeCards: [c("As"), c("3s")],
    position: "SB", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "raise",
    explanation: "A3 suited in SB — raise/steal. SB opens wide vs only BB. A3s has nut-flush potential and wheel straight draws.",
    difficulty: "medium", concept: "SB stealing",
  },
  {
    id: "rfi-64s-utg",
    holeCards: [c("6s"), c("4s")],
    position: "UTG", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "fold",
    explanation: "64s from UTG — fold. Suited connectors with small ranks need position to be profitable. UTG is the worst position.",
    difficulty: "medium", concept: "UTG range tightness",
  },

  // ─── Hard: RFI ───
  {
    id: "rfi-kjo-utg",
    holeCards: [c("Kh"), c("Jc")],
    position: "UTG", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "fold",
    explanation: "KJo is typically a fold from UTG in 6-max GTO. You're out of position against most of the table with a dominated hand risk vs KQ/AK/AJ.",
    difficulty: "hard", concept: "UTG range tightness",
  },
  {
    id: "rfi-22-utg",
    holeCards: [c("2s"), c("2h")],
    position: "UTG", numPlayers: 6, situation: "rfi", stackBB: 100,
    correctAction: "raise",
    explanation: "22 is a standard open from UTG in 6-max (part of the ~15% UTG range). Set-mining potential with 7.5:1 implied odds makes it profitable.",
    difficulty: "hard", concept: "Small pairs",
  },

  // ─── Easy: Facing a raise ───
  {
    id: "vs-raise-aa-bb",
    holeCards: [c("Ah"), c("Ad")],
    position: "BB", numPlayers: 6, situation: "facing_raise", stackBB: 100,
    raiserPosition: "BTN", raiseSize: 3,
    correctAction: "raise",
    explanation: "AA facing any raise — always 3-bet! Never just call with aces preflop. Build the pot and charge drawing hands.",
    difficulty: "easy", concept: "3-betting premiums",
  },
  {
    id: "vs-raise-72o-btn",
    holeCards: [c("7h"), c("2d")],
    position: "BTN", numPlayers: 6, situation: "facing_raise", stackBB: 100,
    raiserPosition: "UTG", raiseSize: 3,
    correctAction: "fold",
    explanation: "7-2 offsuit is trash. Fold to any raise regardless of your position.",
    difficulty: "easy", concept: "Junk hands",
  },
  {
    id: "vs-raise-qq-bb",
    holeCards: [c("Qh"), c("Qd")],
    position: "BB", numPlayers: 6, situation: "facing_raise", stackBB: 100,
    raiserPosition: "BTN", raiseSize: 3,
    correctAction: "raise",
    explanation: "QQ facing a BTN raise — 3-bet! Queens are too strong to just call. 3-betting charges AK/AQ and gets value from weaker pairs.",
    difficulty: "easy", concept: "3-betting premiums",
  },
  {
    id: "vs-raise-kk-utg",
    holeCards: [c("Kh"), c("Kd")],
    position: "MP", numPlayers: 6, situation: "facing_raise", stackBB: 100,
    raiserPosition: "UTG", raiseSize: 3,
    correctAction: "raise",
    explanation: "KK facing UTG raise — 3-bet! Kings are almost always best. Don't slow-play preflop. Build the pot and charge draws.",
    difficulty: "easy", concept: "3-betting premiums",
  },

  // ─── Medium: Facing a raise ───
  {
    id: "vs-raise-22-btn",
    holeCards: [c("2s"), c("2h")],
    position: "BTN", numPlayers: 6, situation: "facing_raise", stackBB: 100,
    raiserPosition: "UTG", raiseSize: 3,
    correctAction: "call",
    explanation: "22 vs UTG raise from BTN — call for set value. You have position and good implied odds. Don't 3-bet small pairs vs tight ranges.",
    difficulty: "medium", concept: "Set mining",
  },
  {
    id: "vs-raise-jts-btn",
    holeCards: [c("Jh"), c("Th")],
    position: "BTN", numPlayers: 6, situation: "facing_raise", stackBB: 100,
    raiserPosition: "CO", raiseSize: 3,
    correctAction: "call",
    explanation: "JTs vs CO raise from BTN — call in position. Great playability, but 3-betting is thin vs CO's strong range. Call and play post-flop.",
    difficulty: "medium", concept: "Suited connectors",
  },
  {
    id: "vs-raise-kqo-btn",
    holeCards: [c("Ks"), c("Qh")],
    position: "BTN", numPlayers: 6, situation: "facing_raise", stackBB: 100,
    raiserPosition: "UTG", raiseSize: 3,
    correctAction: "call",
    explanation: "KQo vs UTG raise from BTN — call. UTG's range is tight, making KQo a potential dominated hand vs KK/AA/AK. Call in position rather than 3-bet and face a 4-bet.",
    difficulty: "medium", concept: "Dominated hands",
  },
  {
    id: "vs-raise-55-co",
    holeCards: [c("5s"), c("5h")],
    position: "CO", numPlayers: 6, situation: "facing_raise", stackBB: 100,
    raiserPosition: "UTG", raiseSize: 3,
    correctAction: "call",
    explanation: "55 vs UTG raise from CO — call for set value. ~15:1 implied odds are achievable at 100BB. Don't 3-bet small pairs OOP vs tight ranges.",
    difficulty: "medium", concept: "Set mining",
  },
  {
    id: "vs-raise-99-sb",
    holeCards: [c("9s"), c("9h")],
    position: "SB", numPlayers: 6, situation: "facing_raise", stackBB: 100,
    raiserPosition: "BTN", raiseSize: 2.5,
    correctAction: "raise",
    explanation: "99 vs BTN raise from SB — 3-bet! BTN steals wide, making 99 a premium vs their range. 3-betting applies pressure and avoids multi-way pots.",
    difficulty: "medium", concept: "3-betting medium pairs",
  },
  {
    id: "vs-raise-98s-bb",
    holeCards: [c("9h"), c("8h")],
    position: "BB", numPlayers: 6, situation: "facing_raise", stackBB: 100,
    raiserPosition: "MP", raiseSize: 3,
    correctAction: "call",
    explanation: "98s in BB vs MP raise — defend. You're getting 2.2:1 odds and 98s has great connectivity. The suited nature gives flush draws and the hand plays well.",
    difficulty: "medium", concept: "BB defense",
  },
  {
    id: "vs-raise-tt-co",
    holeCards: [c("Th"), c("Td")],
    position: "CO", numPlayers: 6, situation: "facing_raise", stackBB: 100,
    raiserPosition: "UTG", raiseSize: 3,
    correctAction: "call",
    explanation: "TT vs UTG raise from CO — call (slightly preferred over 3-bet). TT is ahead of UTG's calling range but behind their 4-bet range. Calling keeps the pot manageable.",
    difficulty: "hard", concept: "Medium pairs vs tight ranges",
  },

  // ─── Hard: Facing a raise ───
  {
    id: "vs-raise-a5s-sb",
    holeCards: [c("As"), c("5s")],
    position: "SB", numPlayers: 6, situation: "facing_raise", stackBB: 100,
    raiserPosition: "BTN", raiseSize: 2.5,
    correctAction: "raise",
    explanation: "A5s is a classic 3-bet bluff from SB vs BTN. The ace blocker reduces AA/AK combos, and you have the nut flush draw if called. Perfect 3-bet bluffing hand.",
    difficulty: "hard", concept: "3-bet bluffing",
  },
  {
    id: "vs-raise-ajs-co",
    holeCards: [c("As"), c("Js")],
    position: "CO", numPlayers: 6, situation: "facing_raise", stackBB: 100,
    raiserPosition: "UTG", raiseSize: 3,
    correctAction: "call",
    explanation: "AJs vs UTG raise from CO — call. 3-betting risks a 4-bet (UTG is tight), and folding is too weak. Call and play the flop in position.",
    difficulty: "hard", concept: "Calling in position",
  },

  // ─── BB Defense ───
  {
    id: "bb-defend-j9s-btn",
    holeCards: [c("Jh"), c("9h")],
    position: "BB", numPlayers: 6, situation: "bb_defense", stackBB: 100,
    raiserPosition: "BTN", raiseSize: 2.5,
    correctAction: "call",
    explanation: "J9s in BB vs BTN raise — easy defend. BTN steals wide, and J9 suited has great equity and playability. The pot odds make this a clear call.",
    difficulty: "easy", concept: "BB defense",
  },
  {
    id: "bb-defend-qq-btn",
    holeCards: [c("Qh"), c("Qd")],
    position: "BB", numPlayers: 6, situation: "bb_defense", stackBB: 100,
    raiserPosition: "BTN", raiseSize: 2.5,
    correctAction: "raise",
    explanation: "QQ in BB vs BTN raise — 3-bet! BTN has a wide range, making QQ a huge favorite. 3-betting gets value and protects your hand.",
    difficulty: "easy", concept: "3-betting premiums",
  },
  {
    id: "bb-defend-k8o-co",
    holeCards: [c("Ks"), c("8h")],
    position: "BB", numPlayers: 6, situation: "bb_defense", stackBB: 100,
    raiserPosition: "CO", raiseSize: 3,
    correctAction: "call",
    explanation: "K8o in BB vs CO raise — defend. You're getting 2.2:1 pot odds. K8o has enough equity against CO's range to be a profitable defend.",
    difficulty: "medium", concept: "BB defense",
  },
  {
    id: "bb-defend-52o-utg",
    holeCards: [c("5h"), c("2c")],
    position: "BB", numPlayers: 6, situation: "bb_defense", stackBB: 100,
    raiserPosition: "UTG", raiseSize: 3,
    correctAction: "fold",
    explanation: "52o in BB vs UTG raise — fold. Even with pot odds, 52o has terrible equity vs UTG's tight range. The pot odds don't compensate for reverse implied odds.",
    difficulty: "medium", concept: "BB defense limits",
  },
  {
    id: "bb-defend-a4o-btn",
    holeCards: [c("As"), c("4c")],
    position: "BB", numPlayers: 6, situation: "bb_defense", stackBB: 100,
    raiserPosition: "BTN", raiseSize: 2.5,
    correctAction: "call",
    explanation: "A4o in BB vs BTN steal — defend. You're getting great odds and the ace plays well vs a wide BTN range. Call and use the discount to close action.",
    difficulty: "medium", concept: "BB defense",
  },
  {
    id: "bb-defend-t3o-utg",
    holeCards: [c("Th"), c("3c")],
    position: "BB", numPlayers: 6, situation: "bb_defense", stackBB: 100,
    raiserPosition: "UTG", raiseSize: 3,
    correctAction: "fold",
    explanation: "T3o in BB vs UTG — fold. UTG has a tight range, and T3o has very poor equity against it. The pot odds aren't enough to overcome the hand's weakness.",
    difficulty: "medium", concept: "BB defense limits",
  },
  {
    id: "bb-defend-87s-btn",
    holeCards: [c("8s"), c("7s")],
    position: "BB", numPlayers: 6, situation: "bb_defense", stackBB: 100,
    raiserPosition: "BTN", raiseSize: 2.5,
    correctAction: "call",
    explanation: "87s in BB vs BTN steal — defend. Great suited connector hand with flush and straight potential. Clear defend with the discount you get in BB.",
    difficulty: "easy", concept: "BB defense",
  },
  {
    id: "bb-defend-q6o-sb",
    holeCards: [c("Qh"), c("6c")],
    position: "BB", numPlayers: 6, situation: "bb_defense", stackBB: 100,
    raiserPosition: "SB", raiseSize: 3,
    correctAction: "call",
    explanation: "Q6o in BB vs SB raise — defend. SB raises wide from the steal position, and you're closing the action. Q6o has enough equity to profitably call.",
    difficulty: "medium", concept: "BB defense",
  },
];

export function getRandomScenario(exclude: string[] = []): PreflopScenario | null {
  const available = PREFLOP_SCENARIOS.filter(s => !exclude.includes(s.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

export function getScenariosByDifficulty(difficulty: "easy" | "medium" | "hard"): PreflopScenario[] {
  return PREFLOP_SCENARIOS.filter(s => s.difficulty === difficulty);
}
