import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { action, sessionId, mode, startStack, finalStack, handsPlayed, profit } = await req.json();

    if (action === "start") {
      const session = await prisma.session.create({
        data: { mode, startStack, finalStack: startStack },
      });
      // Increment session count
      await prisma.playerStats.upsert({
        where: { id: "singleton" },
        create: { id: "singleton", sessionsPlayed: 1 },
        update: { sessionsPlayed: { increment: 1 } },
      });
      return NextResponse.json({ sessionId: session.id });
    }

    if (action === "end" && sessionId) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { endedAt: new Date(), finalStack, handsPlayed, profit },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Session error" }, { status: 500 });
  }
}
