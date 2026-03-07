import { generateText } from "ai";
import { openrouter } from "@/lib/openrouter";
import { NextRequest, NextResponse } from "next/server";

interface ActionEntry { playerName: string; isHuman: boolean; street: string; action: string; amount: number; }
interface OpponentSummary { name: string; personality: string | null; holeCards: string[]; finalStack: number; isFolded: boolean; isWinner: boolean; }
interface Decision { street: string; action: string; amount: number; advisorHint: string | null; isCorrect: boolean | null; }

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const { handNumber, holeCards, communityCards, decisions, result, profitLoss, score, allActions, opponentSummaries } = body;

  const decisionsText = (decisions ?? [] as Decision[])
    .map((d: Decision, i: number) => {
      const actionStr = `${d.action.toUpperCase()}${d.amount > 0 ? ` $${d.amount}` : ""}`;
      const hint = d.advisorHint ? ` — advisor said: "${d.advisorHint}"` : "";
      const verdict = d.isCorrect === true ? " ✓" : d.isCorrect === false ? " ✗" : "";
      return `${i + 1}. ${d.street.toUpperCase()}: ${actionStr}${hint}${verdict}`;
    })
    .join("\n");

  // Build street-by-street action log of all players
  const streets = ["preflop", "flop", "turn", "river"];
  const actionLogLines: string[] = [];
  for (const street of streets) {
    const streetActions = (allActions ?? [] as ActionEntry[]).filter((a: ActionEntry) => a.street === street);
    if (streetActions.length === 0) continue;
    actionLogLines.push(`${street.toUpperCase()}:`);
    for (const a of streetActions as ActionEntry[]) {
      const amt = a.amount > 0 ? ` $${a.amount}` : "";
      actionLogLines.push(`  ${a.playerName}: ${a.action.toUpperCase()}${amt}`);
    }
  }
  const actionLog = actionLogLines.join("\n");

  // Opponent summaries
  const opponentLines = (opponentSummaries ?? [] as OpponentSummary[]).map((o: OpponentSummary) => {
    const cards = o.holeCards?.length >= 2 ? ` [${o.holeCards.join(" ")}]` : "";
    const status = o.isWinner ? "WON" : o.isFolded ? "folded" : "lost";
    const personality = o.personality ? ` (${o.personality})` : "";
    return `  ${o.name}${personality}${cards} — ${status}, stack $${o.finalStack}`;
  }).join("\n");

  const boardStr = communityCards?.length > 0 ? communityCards.join(" ") : "none (preflop only)";
  const plStr = profitLoss >= 0 ? `+$${profitLoss}` : `-$${Math.abs(profitLoss)}`;

  const prompt = `You are an expert poker coach giving concise feedback after a hand. Be specific, honest, and reference actual cards, actions, and opponents. Max 3 sentences.

Hand #${handNumber}
Your hole cards: ${(holeCards ?? []).join(" ")}
Board: ${boardStr}
Result: ${result} (${plStr})${score !== null ? `\nDecision score: ${score}/100` : ""}

--- Full action log ---
${actionLog || "No actions recorded."}

--- Opponents ---
${opponentLines || "No opponent data."}

--- Your decisions ---
${decisionsText || "No voluntary decisions."}

Give 2-3 sentences of poker coaching. Consider how opponents played (their bets, raises, folds) and what that means for how the player should have responded. Reference specific players and actions where relevant.`;

  try {
    const { text } = await generateText({
      model: openrouter("google/gemini-2.5-flash"),
      prompt,
      maxOutputTokens: 180,
    });

    return NextResponse.json({ feedback: text.trim() });
  } catch (err) {
    console.error("Hand review AI error:", err);
    return NextResponse.json({ feedback: null }, { status: 500 });
  }
}
