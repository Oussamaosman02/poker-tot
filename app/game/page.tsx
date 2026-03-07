"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GameMode } from "@/lib/poker/types";
import { usePokerGame } from "@/hooks/use-poker-game";
import { SavedGameState } from "@/lib/poker/game-engine";
import { PokerTable } from "@/components/poker/PokerTable";

function GameInner() {
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") ?? "normal") as GameMode;
  const sessionId = searchParams.get("session");
  const isResume = searchParams.get("resume") === "true";
  const [enableAdvisor, setEnableAdvisor] = useState(false);
  const [resumeState, setResumeState] = useState<SavedGameState | null>(null);
  const [resumeLoaded, setResumeLoaded] = useState(!isResume);

  useEffect(() => {
    if (!isResume || !sessionId) return;
    fetch(`/api/session?id=${sessionId}`)
      .then(r => r.json())
      .then(data => {
        if (data.savedState) setResumeState(data.savedState);
      })
      .catch(() => {})
      .finally(() => setResumeLoaded(true));
  }, [isResume, sessionId]);

  const {
    gameState,
    isAIThinking,
    advisorHint,
    trainingFeedback,
    availableActions,
    humanAction,
    newHand,
    handSummary,
    totalPot: pot,
    pendingAction,
    setPendingAction,
  } = usePokerGame(mode, sessionId, enableAdvisor, resumeLoaded ? resumeState : null);

  if (!resumeLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050A14" }}>
        <div className="text-yellow-500 font-bold animate-pulse text-lg tracking-widest">RESUMING GAME...</div>
      </div>
    );
  }

  return (
    <PokerTable
      state={gameState}
      availableActions={availableActions}
      onAction={humanAction}
      onNewHand={newHand}
      isAIThinking={isAIThinking}
      advisorHint={advisorHint}
      trainingFeedback={trainingFeedback}
      enableAdvisor={enableAdvisor}
      onToggleAdvisor={() => setEnableAdvisor(v => !v)}
      handSummary={handSummary}
      pendingAction={pendingAction}
      onSetPendingAction={setPendingAction}
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
