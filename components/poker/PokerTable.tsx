"use client";

import { GameState, GameMode, AvailableActions, PlayerAction } from "@/lib/poker/types";
import { PlayerSeat } from "./PlayerSeat";
import { CommunityCards } from "./CommunityCards";
import { ActionBar } from "./ActionBar";
import { InfoBar } from "./InfoBar";
import { PipWindow } from "./PipWindow";
import { HandReviewModal } from "./HandReviewModal";
import { totalPot } from "@/lib/poker/game-engine";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { HandSummaryData } from "@/hooks/use-poker-game";

// Player seat positions around the oval — index = player seatIndex
const SEAT_POSITIONS = [
  // [0] Human — bottom center
  "bottom-0 left-1/2 -translate-x-1/2",
  // [1] Bottom left
  "bottom-[10%] left-[8%]",
  // [2] Top left
  "top-[8%] left-[8%]",
  // [3] Top center
  "top-0 left-1/2 -translate-x-1/2",
  // [4] Top right
  "top-[8%] right-[8%]",
  // [5] Bottom right
  "bottom-[10%] right-[8%]",
];

interface PokerTableProps {
  state: GameState;
  availableActions: AvailableActions | null;
  onAction: (action: PlayerAction, amount?: number) => void;
  onNewHand: () => void;
  isAIThinking: boolean;
  advisorHint?: string | null;
  trainingFeedback?: string | null;
  enableAdvisor?: boolean;
  onToggleAdvisor?: () => void;
  handSummary?: HandSummaryData | null;
}

export function PokerTable({
  state,
  availableActions,
  onAction,
  onNewHand,
  isAIThinking,
  advisorHint,
  trainingFeedback,
  enableAdvisor,
  onToggleAdvisor,
  handSummary,
}: PokerTableProps) {
  const [pipOpen, setPipOpen] = useState(false);
  const [revealCards, setRevealCards] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const pipSupported = typeof window !== "undefined" && "documentPictureInPicture" in window;

  const pot = totalPot(state);
  const isNormalMode = state.mode === "normal";
  const human = state.players.find(p => p.isHuman);
  const humanFolded = !!(human?.isFolded && !human?.isEliminated);
  const showCards = state.mode === "vision" || revealCards;
  const showOdds = !isNormalMode || revealCards;

  const winners = state.winners.map(w => w.playerId);

  const handlePip = useCallback(() => setPipOpen(prev => !prev), []);

  return (
    <div
      className="flex flex-col h-screen select-none"
      style={{ background: "linear-gradient(180deg, #020810 0%, #050A14 50%, #020810 100%)" }}
    >
      {/* Table area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,168,76,0.04) 0%, transparent 70%)",
          }}
        />

        {/* Oval table */}
        <div
          className="absolute"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(72vw, 680px)",
            height: "min(52vh, 340px)",
            borderRadius: "50%",
            background: "radial-gradient(ellipse at center, #0f3322 0%, #0a2618 60%, #071c11 100%)",
            border: "8px solid transparent",
            backgroundClip: "padding-box",
            boxShadow: [
              "0 0 0 8px #c9a84c",
              "0 0 0 12px #8B6914",
              "0 0 60px rgba(0,0,0,0.8)",
              "inset 0 2px 20px rgba(255,255,255,0.03)",
            ].join(", "),
          }}
        >
          {/* Inner felt texture */}
          <div className="absolute inset-0 rounded-full" style={{
            background: "radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.02) 0%, transparent 50%)",
          }} />

          {/* Logo text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-10 select-none"
              style={{ color: "#c9a84c" }}>
              POKER TRAINING
            </span>
          </div>

          {/* Community cards + pot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <CommunityCards cards={state.communityCards} pot={pot} />
          </div>
        </div>

        {/* Player seats — absolutely positioned relative to full table area */}
        <div className="absolute inset-0">
          {state.players.map((player, idx) => (
            <div
              key={player.id}
              className={cn("absolute flex items-center justify-center", SEAT_POSITIONS[player.seatIndex])}
            >
              <PlayerSeat
                player={player}
                state={state}
                playerIdx={idx}
                isAIThinking={isAIThinking}
                showCards={showCards}
                isWinner={winners.includes(player.id)}
                showOdds={showOdds}
              />
            </div>
          ))}
        </div>

      </div>

      {/* Action bar / New hand button */}
      <div
        className="py-3"
        style={{
          background: "linear-gradient(180deg, rgba(2,8,16,0) 0%, #020810 30%)",
          minHeight: 100,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {state.phase === "showdown" ? (
          <div className="flex flex-col items-center gap-2 px-4">
            {state.winners.length > 0 && (
              <div
                className="px-6 py-2 rounded-xl text-center"
                style={{
                  background: "rgba(0,0,0,0.6)",
                  border: "1px solid rgba(201,168,76,0.4)",
                }}
              >
                {state.winners.map(w => {
                  const player = state.players.find(p => p.id === w.playerId);
                  return (
                    <div key={w.playerId} className="text-center">
                      <div className="text-yellow-400 font-black text-base">{player?.name ?? w.playerId} wins!</div>
                      <div className="text-yellow-300 font-bold text-xs">${w.amount.toLocaleString()} — {w.handDesc}</div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex gap-3">
              {handSummary && (
                <button
                  onClick={() => setShowReview(true)}
                  className="px-5 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 hover:brightness-110"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#e5e7eb",
                  }}
                >
                  📊 Review Hand
                </button>
              )}
              <button
                onClick={onNewHand}
                className="px-8 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg, #78350f, #c9a84c)",
                  color: "black",
                  boxShadow: "0 4px 20px rgba(201,168,76,0.3)",
                }}
              >
                Deal Next Hand
              </button>
            </div>
          </div>
        ) : state.phase === "idle" ? (
          <div className="flex justify-center px-4">
            <button
              onClick={onNewHand}
              className="px-10 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #14532d, #c9a84c)",
                color: "black",
                boxShadow: "0 4px 20px rgba(201,168,76,0.3)",
              }}
            >
              Start Game
            </button>
          </div>
        ) : availableActions ? (
          <div className="flex flex-col gap-1">
            {isNormalMode && (
              <div className="flex justify-end px-4">
                <button
                  onClick={onToggleAdvisor}
                  className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                  style={{
                    background: enableAdvisor ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.05)",
                    border: enableAdvisor ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.1)",
                    color: enableAdvisor ? "#93c5fd" : "#6b7280",
                  }}
                >
                  {enableAdvisor ? "💡 Advisor on" : "💡 Advisor"}
                </button>
              </div>
            )}
            <ActionBar
              actions={availableActions}
              onAction={onAction}
              advisorHint={advisorHint}
              trainingFeedback={trainingFeedback}
              pot={pot}
              bigBlind={state.bigBlind}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="text-gray-600 text-xs font-medium tracking-wider uppercase">
              {isAIThinking ? (
                <span className="text-yellow-700 animate-pulse">AI is thinking...</span>
              ) : (
                "Waiting for players..."
              )}
            </div>
            {/* Normal-mode overlays: shown while a hand is in progress */}
            {isNormalMode && (
              <div className="flex gap-2">
                {humanFolded && (
                  <button
                    onClick={() => setRevealCards(v => !v)}
                    className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                    style={{
                      background: revealCards ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.05)",
                      border: revealCards ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.1)",
                      color: revealCards ? "#c4b5fd" : "#6b7280",
                    }}
                  >
                    {revealCards ? "👁 Cards visible" : "👁 Reveal cards"}
                  </button>
                )}
                <button
                  onClick={onToggleAdvisor}
                  className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                  style={{
                    background: enableAdvisor ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.05)",
                    border: enableAdvisor ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.1)",
                    color: enableAdvisor ? "#93c5fd" : "#6b7280",
                  }}
                >
                  {enableAdvisor ? "💡 Advisor on" : "💡 Advisor"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info bar */}
      <InfoBar state={state} onPip={handlePip} pipSupported={pipSupported} />

      {/* PiP window */}
      <PipWindow
        state={state}
        availableActions={availableActions}
        onAction={onAction}
        onNewHand={onNewHand}
        isOpen={pipOpen}
        onClose={() => setPipOpen(false)}
        handSummary={handSummary}
      />

      {/* Hand review modal */}
      {showReview && handSummary && (
        <HandReviewModal summary={handSummary} onClose={() => setShowReview(false)} />
      )}
    </div>
  );
}
