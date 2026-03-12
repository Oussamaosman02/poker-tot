import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { isCorrect, timeSpentMs } = await req.json();

    await prisma.playerStats.upsert({
      where: { userId },
      create: {
        userId,
        quizAnswered: 1,
        quizCorrect: isCorrect ? 1 : 0,
        quizPlaytimeSeconds: Math.round(timeSpentMs / 1000),
        totalPlaytimeSeconds: Math.round(timeSpentMs / 1000),
      },
      update: {
        quizAnswered: { increment: 1 },
        quizCorrect: { increment: isCorrect ? 1 : 0 },
        quizPlaytimeSeconds: { increment: Math.round(timeSpentMs / 1000) },
        totalPlaytimeSeconds: { increment: Math.round(timeSpentMs / 1000) },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save quiz result" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const stats = await prisma.playerStats.findUnique({ where: { userId } });
    return NextResponse.json({
      quizAnswered: stats?.quizAnswered ?? 0,
      quizCorrect: stats?.quizCorrect ?? 0,
      quizPlaytimeSeconds: stats?.quizPlaytimeSeconds ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load quiz stats" }, { status: 500 });
  }
}
