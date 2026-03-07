"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GameMode } from "@/lib/poker/types";
import { usePokerGame } from "@/hooks/use-poker-game";
import { SavedGameState } from "@/lib/poker/game-engine";
import { PokerTable } from "@/components/poker/PokerTable";

const LOADING = (
  <div className="min-h-screen flex items-center justify-center" style={{ background: "#050A14" }}>
    <div className="text-yellow-500 font-bold animate-pulse text-lg tracking-widest">RESUMING GAME...</div>
  </div>
);

// Separated so usePokerGame's useState initializer only runs once the resumeState is known
function GameTable({ mode, sessionId, resumeState }: { mode: GameMode; sessionId: string | null; resumeState: SavedGameState | null }) {
  const [enableAdvisor, setEnableAdvisor] = useState(false);
  const {
    gameState,
    isAIThinking,
    advisorHint,
    trainingFeedback,
    availableActions,
    humanAction,
    newHand,
    handSummary,
    pendingAction,
    setPendingAction,
  } = usePokerGame(mode, sessionId, enableAdvisor, resumeState);

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

function GameInner() {
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") ?? "normal") as GameMode;
  const sessionId = searchParams.get("session");
  const isResume = searchParams.get("resume") === "true";
  const [resumeState, setResumeState] = useState<SavedGameState | null>(null);
  const [resumeLoaded, setResumeLoaded] = useState(!isResume);

  useEffect(() => {
    if (!isResume || !sessionId) return;
    fetch(`/api/session?id=${sessionId}`)
      .then(r => r.json())
      .then(data => { if (data.savedState) setResumeState(data.savedState); })
      .catch(() => {})
      .finally(() => setResumeLoaded(true));
  }, [isResume, sessionId]);

  if (!resumeLoaded) return LOADING;

  return <GameTable mode={mode} sessionId={sessionId} resumeState={resumeState} />;
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
