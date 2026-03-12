import { generateObject } from "ai";
import { z } from "zod";
import { openrouter, PERSONALITY_PROMPTS } from "@/lib/openrouter";
import { NextRequest, NextResponse } from "next/server";
import { extractUsage, trackAIUsage } from "@/lib/ai-usage-tracking";
import { getUserId } from "@/lib/auth-utils";

const ActionSchema = z.object({
  action: z.enum(["fold", "check", "call", "raise", "all-in"]),
  amount: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const userId = await getUserId(req).catch(() => null);
  try {
    const {
      model,
      personality,
      playerName,
      holeCards,
      communityCards,
      position,
      stack,
      pot,
      callAmount,
      currentBet,
      minRaise,
      maxRaise,
      availableActions,
      opponents,
    } = body;

    // Redirect thinking/reasoning models to non-thinking equivalents
    const BLOCKED_MODELS: Record<string, string> = {
      "google/gemini-2.5-pro":      "google/gemini-2.0-flash-001",
      "google/gemini-2.5-flash":    "google/gemini-2.0-flash-001",
      "google/gemini-3-flash-preview": "google/gemini-2.0-flash-001",
      "x-ai/grok-3-mini":           "openai/gpt-4o-mini",
    };
    const resolvedModel: string = BLOCKED_MODELS[model] ?? model;

    const personalityPrompt = PERSONALITY_PROMPTS[personality] ?? PERSONALITY_PROMPTS.TAG;

    const systemPrompt = `You are ${playerName}, a professional poker player. ${personalityPrompt}

Always respond with a valid JSON action. Your available actions are ONLY what is listed in the user message.
Never choose an action that isn't available. Be decisive and consistent with your playing style.`;

    const userPrompt = `Texas Hold'em situation:
- Your hole cards: ${holeCards}
- Community cards: ${communityCards || "none (preflop)"}
- Your position: ${position}
- Your stack: $${stack}
- Pot: $${pot}
- Amount to call: $${callAmount}
- Your current bet this street: $${currentBet}
- Min raise to: $${minRaise}
- Max raise (all-in): $${maxRaise}
- Opponents still in hand: ${opponents}

Available actions: ${availableActions.join(", ")}

Make your decision.`;

    const { object, usage, providerMetadata } = await generateObject({
      model: openrouter(resolvedModel),
      schema: ActionSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });

    trackAIUsage(extractUsage(usage, providerMetadata), {
      userId,
      model: resolvedModel,
      operationType: "AI_ACTION",
    });

    // Validate the action is in available actions
    if (!availableActions.includes(object.action)) {
      const fallback = availableActions.includes("check") ? "check" : availableActions[0];
      return NextResponse.json({ action: fallback, amount: undefined });
    }

    return NextResponse.json(object);
  } catch (err) {
    console.error("AI action error:", err);
    const { availableActions, callAmount } = body;
    const fallback = availableActions?.includes("check")
      ? "check"
      : availableActions?.includes("call") && callAmount <= 200
      ? "call"
      : "fold";
    return NextResponse.json({ action: fallback });
  }
}
