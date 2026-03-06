"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GameMode } from "@/lib/poker/types";
import { usePokerGame } from "@/hooks/use-poker-game";
import { PokerTable } from "@/components/poker/PokerTable";

function GameInner() {
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") ?? "normal") as GameMode;
  const sessionId = searchParams.get("session");

  const {
    gameState,
    isAIThinking,
    advisorHint,
    trainingFeedback,
    availableActions,
    humanAction,
    newHand,
    totalPot: pot,
  } = usePokerGame(mode, sessionId);

  return (
    <PokerTable
      state={gameState}
      availableActions={availableActions}
      onAction={humanAction}
      onNewHand={newHand}
      isAIThinking={isAIThinking}
      advisorHint={advisorHint}
      trainingFeedback={trainingFeedback}
    />
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050A14" }}>
        <div className="text-yellow-500 font-bold animate-pulse text-lg tracking-widest">LOADING TABLE...</div>
      </div>
    }>
      <GameInner />
    </Suspense>
  );
}
