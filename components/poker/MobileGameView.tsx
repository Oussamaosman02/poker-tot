"use client";

import { useState } from "react";
import { GameState, AvailableActions, PlayerAction } from "@/lib/poker/types";
import { PlayingCard } from "./PlayingCard";
import { ActionBar } from "./ActionBar";
import { HandReviewModal } from "./HandReviewModal";
import { totalPot } from "@/lib/poker/game-engine";
import { HandSummaryData } from "@/hooks/use-poker-game";
import Link from "next/link";

const PHASE_LABEL: Record<string, string> = {
  idle: "POKER TRAINING",
  preflop: "PRE-FLOP",
  flop: "FLOP",
  turn: "TURN",
  river: "RIVER",
  showdown: "SHOWDOWN",
};

const ACTION_COLOR: Record<string, string> = {
  fold: "#ef4444",
  check: "#6b7280",
  call: "#60a5fa",
  raise: "#fbbf24",
  "all-in": "#f97316",
};

interface MobileGameViewProps {
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
  pendingAction?: "fold" | "check" | null;
  onSetPendingAction?: (a: "fold" | "check" | null) => void;
}

export function MobileGameView({
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
  pendingAction,
  onSetPendingAction,
}: MobileGameViewProps) {
  const [showReview, setShowReview] = useState(false);

  const human = state.players.find(p => p.isHuman);
  const pot = totalPot(state);
  const isHumanTurn = !!(human?.isActive && availableActions);
  const showOdds = state.mode !== "normal";
  const isAtShowdown = state.phase === "showdown";
  const isIdle = state.phase === "idle";
  const humanInHand = !!(human && !human.isFolded && !human.isEliminated);
  const showPreAction = !isHumanTurn && !isIdle && !isAtShowdown && humanInHand && !!onSetPendingAction;

  return (
    <div style={{
      width: "100%",
      height: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(180deg, #020810 0%, #050A14 60%, #020810 100%)",
      color: "white",
      fontFamily: "system-ui, sans-serif",
      overflow: "hidden",
    }}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div style={{
        padding: "10px 16px 8px",
        borderBottom: "1px solid rgba(201,168,76,0.2)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, color: "#c9a84c" }}>
          {PHASE_LABEL[state.phase] ?? state.phase.toUpperCase()}
        </span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {state.phase !== "idle" && (
            <span style={{ fontSize: 10, color: "#6b7280" }}>Hand #{state.handNumber}</span>
          )}
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 1,
            padding: "2px 7px", borderRadius: 10,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#9ca3af",
            textTransform: "uppercase",
          }}>
            {state.mode}
          </span>
          <Link href="/stats" style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, textDecoration: "none" }}>
            STATS
          </Link>
        </div>
      </div>

      {/* ── Your hand + Board ─────────────────────────────────────── */}
      <div style={{
        padding: "10px 16px 8px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
        flexShrink: 0,
      }}>
        {/* Hole cards */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#6b7280", marginBottom: 5 }}>
            YOUR HAND
          </div>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {human?.holeCards?.length === 2 ? (
              human.holeCards.map((card, i) => (
                <PlayingCard key={i} card={card} size="md" />
              ))
            ) : (
              <>
                <PlayingCard faceDown size="md" />
                <PlayingCard faceDown size="md" />
              </>
            )}
            {showOdds && human?.winProbability != null && human.winProbability > 0 && (
              <div style={{
                marginLeft: 6,
                fontSize: 22,
                fontWeight: 900,
                color: human.winProbability > 50 ? "#86efac" : human.winProbability > 30 ? "#fcd34d" : "#fca5a5",
              }}>
                {human.winProbability}%
              </div>
            )}
          </div>
          {human?.handDescription && state.communityCards.length > 0 && (
            <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 3 }}>{human.handDescription}</div>
          )}
        </div>

        {/* Board */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#6b7280", marginBottom: 5 }}>
            BOARD
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <PlayingCard key={i} card={state.communityCards[i]} faceDown={!state.communityCards[i]} size="sm" />
            ))}
          </div>
        </div>
      </div>

      {/* ── Pot + Stack row ───────────────────────────────────────── */}
      <div style={{
        padding: "7px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        gap: 20,
        alignItems: "center",
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#6b7280" }}>POT</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#fbbf24" }}>${pot.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#6b7280" }}>YOUR STACK</div>
          <div style={{
            fontSize: 18, fontWeight: 900,
            color: human && human.stack > 0 ? "#86efac" : "#fca5a5",
          }}>
            ${human?.stack.toLocaleString() ?? "0"}
          </div>
        </div>

        {/* Advisor toggle for normal mode */}
        {state.mode === "normal" && state.phase !== "idle" && (
          <button
            onClick={onToggleAdvisor}
            style={{
              marginLeft: "auto",
              padding: "4px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700,
              background: enableAdvisor ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.05)",
              border: enableAdvisor ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.1)",
              color: enableAdvisor ? "#93c5fd" : "#6b7280",
              cursor: "pointer",
            }}
          >
            💡 {enableAdvisor ? "ON" : "Hint"}
          </button>
        )}
      </div>

      {/* ── Winner banner ─────────────────────────────────────────── */}
      {state.winners && state.winners.length > 0 && (isAtShowdown || isIdle) && (
        <div style={{ padding: "8px 16px", borderBottom: "1px solid rgba(201,168,76,0.15)", flexShrink: 0 }}>
          {state.winners.map((w, i) => {
            const wPlayer = state.players.find(p => p.id === w.playerId);
            const isMe = wPlayer?.isHuman;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 10px", borderRadius: 8,
                background: isMe ? "rgba(134,239,172,0.1)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${isMe ? "rgba(134,239,172,0.35)" : "rgba(201,168,76,0.2)"}`,
              }}>
                <span style={{ fontSize: 14 }}>{isMe ? "🏆" : "🎴"}</span>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 900, color: isMe ? "#86efac" : "#fbbf24" }}>
                    {wPlayer?.name ?? "?"} wins ${w.amount.toLocaleString()}
                  </span>
                  {w.handDesc && (
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>{w.handDesc}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Players list ──────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 16px" }}>
        {state.players.filter(p => !p.isEliminated && !p.isHuman).map(p => {
          const isActive = p.isActive;
          const actionLabel = p.lastAction
            ? p.lastAction.toUpperCase() +
              (["raise", "call", "all-in"].includes(p.lastAction) && p.lastActionAmount > 0
                ? ` $${p.lastActionAmount.toLocaleString()}` : "")
            : null;
          const actionColor = ACTION_COLOR[p.lastAction ?? ""] ?? "#9ca3af";
          const isWinner = state.winners.some(w => w.playerId === p.id);

          return (
            <div key={p.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "6px 10px", borderRadius: 8, marginBottom: 4,
              background: isActive
                ? "rgba(234,179,8,0.08)"
                : isWinner
                ? "rgba(134,239,172,0.06)"
                : "rgba(255,255,255,0.03)",
              border: `1px solid ${isActive ? "rgba(234,179,8,0.25)" : isWinner ? "rgba(134,239,172,0.2)" : "transparent"}`,
              opacity: p.isFolded ? 0.4 : 1,
            }}>
              <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                {isActive && (
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24", flexShrink: 0 }} />
                )}
                {isWinner && (
                  <span style={{ fontSize: 12 }}>🏆</span>
                )}
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: p.isFolded ? "#6b7280" : "#e5e7eb" }}>
                    {p.name}
                  </span>
                  {p.personality && (
                    <span style={{ fontSize: 9, color: "#4b5563", marginLeft: 4 }}>{p.personality}</span>
                  )}
                </div>
                {p.isFolded && <span style={{ fontSize: 9, color: "#6b7280" }}>FOLD</span>}
                {p.isAllIn && <span style={{ fontSize: 9, color: "#f97316", fontWeight: 900 }}>ALL IN</span>}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {actionLabel && !p.isFolded && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: actionColor }}>{actionLabel}</span>
                )}
                {/* AI thinking indicator */}
                {isAIThinking && isActive && (
                  <span style={{ fontSize: 10, color: "#fbbf24" }}>···</span>
                )}
                <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>
                  ${p.stack.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Action area ───────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
      }}>
        {isHumanTurn ? (
          <div style={{ padding: "8px 0 4px" }}>
            <ActionBar
              actions={availableActions!}
              onAction={onAction}
              advisorHint={advisorHint}
              trainingFeedback={trainingFeedback}
              pot={pot}
              bigBlind={state.bigBlind}
            />
          </div>
        ) : isIdle || isAtShowdown ? (
          <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {isAtShowdown && handSummary && (
              <button
                onClick={() => setShowReview(true)}
                style={{
                  width: "100%", padding: "12px", borderRadius: 12,
                  fontWeight: 900, fontSize: 11, letterSpacing: 2,
                  textTransform: "uppercase",
                  background: "rgba(99,102,241,0.12)",
                  color: "#a5b4fc",
                  border: "1px solid rgba(99,102,241,0.3)",
                  cursor: "pointer",
                }}
              >
                📊 Review Hand
              </button>
            )}
            <button
              onClick={onNewHand}
              style={{
                width: "100%", padding: "14px", borderRadius: 12,
                fontWeight: 900, fontSize: 13, letterSpacing: 2,
                textTransform: "uppercase",
                background: "linear-gradient(135deg, #78350f, #c9a84c)",
                color: "#000", border: "none", cursor: "pointer",
                boxShadow: "0 4px 20px rgba(201,168,76,0.25)",
              }}
            >
              {isIdle ? "Start Game" : "Deal Next Hand"}
            </button>
          </div>
        ) : (
          <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ textAlign: "center", fontSize: 12, color: "#6b7280" }}>
              {isAIThinking ? (
                <span style={{ color: "#fbbf24", fontWeight: 700 }}>AI is thinking...</span>
              ) : (
                "Waiting for players..."
              )}
            </div>
            {showPreAction && (
              <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
                <span style={{ fontSize: 9, color: "#4b5563", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Pre-action:</span>
                {(["fold", "check"] as const).map(action => (
                  <button
                    key={action}
                    onClick={() => onSetPendingAction!(pendingAction === action ? null : action)}
                    style={{
                      padding: "5px 10px", borderRadius: 8,
                      fontSize: 10, fontWeight: 700, cursor: "pointer",
                      textTransform: "uppercase", letterSpacing: 1,
                      background: pendingAction === action
                        ? action === "fold" ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.2)"
                        : "rgba(255,255,255,0.05)",
                      border: pendingAction === action
                        ? action === "fold" ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(34,197,94,0.4)"
                        : "1px solid rgba(255,255,255,0.1)",
                      color: pendingAction === action
                        ? action === "fold" ? "#fca5a5" : "#86efac"
                        : "#6b7280",
                    }}
                  >
                    {action === "fold" ? "Fold" : "Check"}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hand review modal (full, not compact) */}
      {showReview && handSummary && (
        <HandReviewModal summary={handSummary} onClose={() => setShowReview(false)} />
      )}
    </div>
  );
}
