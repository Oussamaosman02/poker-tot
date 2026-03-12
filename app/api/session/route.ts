import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");

    if (id) {
      const session = await prisma.session.findFirst({
        where: { id, userId },
        select: { id: true, mode: true, savedState: true },
      });
      if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({
        ...session,
        savedState: session.savedState ? JSON.parse(session.savedState) : null,
      });
    }

    const sessions = await prisma.session.findMany({
      where: { userId, endedAt: null },
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
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { action, sessionId, mode, startStack, finalStack, handsPlayed, profit, savedState, playtimeSeconds } = await req.json();

    if (action === "start") {
      const session = await prisma.session.create({
        data: { userId, mode, startStack, finalStack: startStack },
      });
      await prisma.playerStats.upsert({
        where: { userId },
        create: { userId, sessionsPlayed: 1 },
        update: { sessionsPlayed: { increment: 1 } },
      });
      return NextResponse.json({ sessionId: session.id });
    }

    if (action === "save" && sessionId) {
      const prev = await prisma.session.findFirst({
        where: { id: sessionId, userId },
        select: { playtimeSeconds: true },
      });
      if (!prev) return NextResponse.json({ error: "Session not found" }, { status: 404 });

      const newPlaytime = typeof playtimeSeconds === "number" ? playtimeSeconds : 0;
      const addedSeconds = Math.max(0, newPlaytime - (prev.playtimeSeconds ?? 0));

      await prisma.session.update({
        where: { id: sessionId },
        data: {
          savedState: JSON.stringify(savedState),
          finalStack: savedState.players.find((p: { id: string }) => p.id === "human")?.stack ?? finalStack,
          handsPlayed: savedState.handNumber,
          playtimeSeconds: newPlaytime,
        },
      });
      if (addedSeconds > 0) {
        await prisma.playerStats.upsert({
          where: { userId },
          create: { userId, totalPlaytimeSeconds: addedSeconds },
          update: { totalPlaytimeSeconds: { increment: addedSeconds } },
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "end" && sessionId) {
      await prisma.session.updateMany({
        where: { id: sessionId, userId },
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
