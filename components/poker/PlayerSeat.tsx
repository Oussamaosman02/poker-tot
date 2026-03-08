"use client";

import { useEffect, useRef, useState } from "react";
import { Player, GameState } from "@/lib/poker/types";
import { PlayingCard } from "./PlayingCard";
import { ChipStack, StackDots } from "./ChipStack";
import { getPositionLabel } from "@/lib/poker/game-engine";
import { cn } from "@/lib/utils";

const ACTION_LABELS: Record<string, string> = {
  fold: "FOLD",
  check: "CHECK",
  call: "CALL",
  raise: "RAISE",
  "all-in": "ALL IN",
};

interface PlayerSeatProps {
  player: Player;
  state: GameState;
  playerIdx: number;
  isAIThinking?: boolean;
  showCards: boolean;
  isWinner: boolean;
  showOdds: boolean;
}

export function PlayerSeat({ player, state, playerIdx, isAIThinking, showCards, isWinner, showOdds }: PlayerSeatProps) {
  const position = state.phase !== "idle" ? getPositionLabel(state, playerIdx) : null;
  const isCurrentlyThinking = isAIThinking && !player.isHuman &&
    player.id === state.players[state.currentPlayerIndex]?.id;
  const isActive = player.isActive || isCurrentlyThinking;

  // Track last action to drive animations
  const [avatarAnim, setAvatarAnim] = useState("");
  const [chipAnim, setChipAnim] = useState("");
  const prevAction = useRef<string | null>(null);

  useEffect(() => {
    if (!player.lastAction || player.lastAction === prevAction.current) return;
    prevAction.current = player.lastAction;

    setAvatarAnim("");
    setChipAnim("");

    // Tiny delay so re-adding the class triggers the animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        switch (player.lastAction) {
          case "raise":
            setAvatarAnim("animate-raise-glow");
            setChipAnim("animate-chip-pop");
            break;
          case "all-in":
            setAvatarAnim("animate-allin-flash");
            setChipAnim("animate-chip-pop");
            break;
          case "fold":
            setAvatarAnim("animate-fold-out");
            break;
          case "check":
            setAvatarAnim("animate-check-flash");
            break;
          case "call":
            setChipAnim("animate-call-slide");
            break;
        }
      });
    });
  }, [player.lastAction, player.lastActionAmount]);

  if (player.isEliminated) {
    return (
      <div className="flex flex-col items-center gap-1 opacity-30">
        <div className="w-12 h-12 rounded-full border-2 border-gray-800 bg-gray-950 flex items-center justify-center">
          <span className="text-gray-700 text-[10px] font-black">OUT</span>
        </div>
        <span className="text-gray-700 text-xs">{player.name}</span>
      </div>
    );
  }

  const revealCards = showCards || player.isHuman || state.showdownReveal;
  const isFolded = player.isFolded;

  return (
    <div className={cn("flex flex-col items-center gap-0.5 transition-all duration-300", isFolded && "opacity-40")}>
      {/* Cards */}
      <div className="flex gap-0.5 mb-0.5">
        {player.holeCards.length > 0 ? (
          player.holeCards.map((card, i) => (
            <PlayingCard
              key={i}
              card={card}
              faceDown={!revealCards}
              size="sm"
              highlight={isWinner}
              className={isFolded ? "opacity-50 grayscale" : ""}
            />
          ))
        ) : (
          <>
            <div className="w-8 h-11" />
            <div className="w-8 h-11" />
          </>
        )}
      </div>

      {/* Avatar */}
      <div className="relative">
        <div
          className={cn(
            "w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-300",
            avatarAnim,
            isActive
              ? "border-yellow-400"
              : isWinner
              ? "border-yellow-500"
              : isFolded
              ? "border-gray-800"
              : "border-yellow-800/50",
            player.isHuman
              ? "bg-gradient-to-br from-blue-900 to-blue-700"
              : "bg-gradient-to-br from-gray-800 to-gray-700"
          )}
          style={isActive ? {
            boxShadow: "0 0 22px 6px rgba(234,179,8,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
          } : isWinner ? {
            boxShadow: "0 0 16px 4px rgba(234,179,8,0.25)",
          } : undefined}
        >
          <span className="text-white text-[11px] font-black">{player.avatar}</span>
        </div>

        {/* Position badge */}
        {position && (
          <div className={cn(
            "absolute -top-1 -right-1 text-[9px] font-black px-1 rounded-sm",
            player.isDealer ? "bg-yellow-500 text-black" :
            player.isSB    ? "bg-blue-600 text-white" :
            player.isBB    ? "bg-purple-600 text-white" :
                             "bg-gray-700 text-gray-300"
          )}>
            {position}
          </div>
        )}

        {/* AI thinking dots */}
        {isCurrentlyThinking && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1 h-1 rounded-full bg-yellow-400 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        )}
      </div>

      {/* Name + stack */}
      <div className="text-center px-2 py-0.5 rounded" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
        <div className="text-[11px] font-bold text-white whitespace-nowrap">{player.name}</div>
        <div className="flex items-center justify-center gap-1">
          <div className="text-[10px] text-yellow-400 font-mono">${player.stack.toLocaleString()}</div>
          {state.bigBlind > 0 && player.stack > 0 && player.stack < 10 * state.bigBlind && (
            <div className="text-[8px] font-black px-1 rounded bg-red-900/70 text-red-400 leading-tight">
              {Math.floor(player.stack / state.bigBlind)}BB
            </div>
          )}
        </div>
        {/* Stack dots bar */}
        <div className="mt-0.5 flex justify-center">
          <StackDots amount={player.stack} />
        </div>
      </div>

      {/* Win probability — only shown when showOdds=true */}
      {showOdds && player.winProbability > 0 && !isFolded && state.phase !== "idle" && (
        <div className={cn(
          "text-[10px] font-bold px-1.5 py-0.5 rounded",
          player.winProbability > 60 ? "bg-green-900/80 text-green-300" :
          player.winProbability > 35 ? "bg-yellow-900/80 text-yellow-300" :
                                        "bg-red-900/80 text-red-300"
        )}>
          {player.winProbability}%
        </div>
      )}

      {/* Last action label */}
      {player.lastAction && !isFolded && (
        <div className={cn(
          "text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider",
          player.lastAction === "fold"   ? "bg-red-900/80 text-red-300" :
          player.lastAction === "check"  ? "bg-green-900/80 text-green-300" :
          player.lastAction === "call"   ? "bg-blue-900/80 text-blue-300" :
          player.lastAction === "raise"  ? "bg-yellow-900/80 text-yellow-300" :
                                           "bg-red-600/90 text-white"
        )}>
          {ACTION_LABELS[player.lastAction]}
          {(player.lastAction === "raise" || player.lastAction === "all-in" || player.lastAction === "call") && player.lastActionAmount > 0
            ? ` $${player.lastActionAmount.toLocaleString()}` : ""}
        </div>
      )}

      {/* Bet chip stack (current street bet) */}
      {player.streetBet > 0 && state.phase !== "showdown" && (
        <div className={cn("mt-0.5", chipAnim)}>
          <ChipStack amount={player.streetBet} size="sm" label />
        </div>
      )}

      {/* Hand description */}
      {player.handDescription && (showCards || player.isHuman) && state.communityCards.length > 0 && (
        <div className="text-[8px] text-gray-400 text-center max-w-[90px] leading-tight">
          {player.handDescription}
        </div>
      )}

      {/* Winner badge */}
      {isWinner && (
        <div className="text-[10px] font-black text-yellow-400 animate-pulse tracking-widest">
          WINNER
        </div>
      )}
    </div>
  );
}
