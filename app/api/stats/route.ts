import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const stats = await prisma.playerStats.findUnique({ where: { id: "singleton" } });
    const sessions = await prisma.session.findMany({
      orderBy: { startedAt: "desc" },
      take: 10,
      include: { hands: { orderBy: { createdAt: "asc" } } },
    });
    return NextResponse.json({ stats, sessions });
  } catch (e) {
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, hand } = await req.json();

    // Save hand
    await prisma.hand.create({
      data: {
        sessionId,
        handNumber: hand.handNumber,
        holeCards: JSON.stringify(hand.holeCards),
        communityCards: JSON.stringify(hand.communityCards),
        position: hand.position,
        actions: JSON.stringify(hand.actions),
        result: hand.result,
        profitLoss: hand.profitLoss,
        potSize: hand.potSize,
        handStrength: hand.handStrength ?? null,
        advisorAction: hand.advisorAction ?? null,
        playerAction: hand.playerAction,
        followedAdvisor: hand.followedAdvisor ?? false,
      },
    });

    // Update aggregate stats
    await prisma.playerStats.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        totalHands: 1,
        handsWon: hand.result === "won" ? 1 : 0,
        handsLost: hand.result === "lost" ? 1 : 0,
        handsFolded: hand.result === "folded" ? 1 : 0,
        totalProfit: hand.profitLoss,
        biggestPot: hand.potSize,
        biggestWin: hand.result === "won" ? hand.profitLoss : 0,
        vpipHands: hand.vpip ? 1 : 0,
        pfrHands: hand.pfr ? 1 : 0,
        advisorFollowed: hand.followedAdvisor ? 1 : 0,
        advisorShown: hand.advisorAction ? 1 : 0,
        correctDecisions: hand.decisionsCorrect ?? 0,
        totalDecisions: hand.decisionsTotal ?? 0,
      },
      update: {
        totalHands: { increment: 1 },
        handsWon: { increment: hand.result === "won" ? 1 : 0 },
        handsLost: { increment: hand.result === "lost" ? 1 : 0 },
        handsFolded: { increment: hand.result === "folded" ? 1 : 0 },
        totalProfit: { increment: hand.profitLoss },
        biggestPot: { set: Math.max(0, hand.potSize) },
        biggestWin: hand.result === "won" ? { increment: hand.profitLoss > 0 ? hand.profitLoss : 0 } : {},
        vpipHands: { increment: hand.vpip ? 1 : 0 },
        pfrHands: { increment: hand.pfr ? 1 : 0 },
        advisorFollowed: { increment: hand.followedAdvisor ? 1 : 0 },
        advisorShown: { increment: hand.advisorAction ? 1 : 0 },
        correctDecisions: { increment: hand.decisionsCorrect ?? 0 },
        totalDecisions: { increment: hand.decisionsTotal ?? 0 },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save stats" }, { status: 500 });
  }
}
