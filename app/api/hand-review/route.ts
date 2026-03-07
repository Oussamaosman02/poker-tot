import { generateText } from "ai";
import { openrouter } from "@/lib/openrouter";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const { handNumber, holeCards, communityCards, decisions, result, profitLoss, score } = body;

  const decisionsText = (decisions ?? [])
    .map((d: { street: string; action: string; amount: number; advisorHint: string | null; isCorrect: boolean | null }, i: number) => {
      const actionStr = `${d.action.toUpperCase()}${d.amount > 0 ? ` $${d.amount}` : ""}`;
      const hint = d.advisorHint ? ` — advisor said: "${d.advisorHint}"` : "";
      const verdict = d.isCorrect === true ? " ✓" : d.isCorrect === false ? " ✗" : "";
      return `${i + 1}. ${d.street.toUpperCase()}: ${actionStr}${hint}${verdict}`;
    })
    .join("\n");

  const boardStr = communityCards?.length > 0 ? communityCards.join(" ") : "none (preflop only)";
  const plStr = profitLoss >= 0 ? `+$${profitLoss}` : `-$${Math.abs(profitLoss)}`;

  const prompt = `You are an expert poker coach giving quick feedback after a hand. Be specific, encouraging but honest. Max 3 short sentences.

Hand #${handNumber}
Hole cards: ${(holeCards ?? []).join(" ")}
Board: ${boardStr}
Result: ${result} (${plStr})${score !== null ? `\nDecision accuracy: ${score}/100` : ""}

Decisions made:
${decisionsText || "No voluntary decisions."}

Give 2-3 sentences of poker coaching. Focus on the most important thing they did well or should improve. Reference their actual cards and decisions specifically.`;

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
