import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (id) {
      const session = await prisma.session.findUnique({
        where: { id },
        select: { id: true, mode: true, savedState: true },
      });
      if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({
        ...session,
        savedState: session.savedState ? JSON.parse(session.savedState) : null,
      });
    }

    const sessions = await prisma.session.findMany({
      where: { endedAt: null },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        mode: true,
        startedAt: true,
        handsPlayed: true,
        finalStack: true,
        startStack: true,
        savedState: true,
      },
    });
    return NextResponse.json({
      sessions: sessions.map(s => ({
        ...s,
        savedState: s.savedState ? JSON.parse(s.savedState) : null,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to list sessions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, sessionId, mode, startStack, finalStack, handsPlayed, profit, savedState } = await req.json();

    if (action === "start") {
      const session = await prisma.session.create({
        data: { mode, startStack, finalStack: startStack },
      });
      await prisma.playerStats.upsert({
        where: { id: "singleton" },
        create: { id: "singleton", sessionsPlayed: 1 },
        update: { sessionsPlayed: { increment: 1 } },
      });
      return NextResponse.json({ sessionId: session.id });
    }

    if (action === "save" && sessionId) {
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          savedState: JSON.stringify(savedState),
          finalStack: savedState.players.find((p: { id: string }) => p.id === "human")?.stack ?? finalStack,
          handsPlayed: savedState.handNumber,
        },
      });
      return NextResponse.json({ ok: true });
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
