"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { GameState, AvailableActions, PlayerAction } from "@/lib/poker/types";
import { PlayingCard } from "./PlayingCard";
import { ActionBar } from "./ActionBar";
import { totalPot } from "@/lib/poker/game-engine";
import { HandSummaryData } from "@/hooks/use-poker-game";

interface PipWindowProps {
  state: GameState;
  availableActions: AvailableActions | null;
  onAction: (action: PlayerAction, amount?: number) => void;
  onNewHand: () => void;
  isOpen: boolean;
  onClose: () => void;
  handSummary?: HandSummaryData | null;
}

export function PipWindow({ state, availableActions, onAction, onNewHand, isOpen, onClose, handSummary }: PipWindowProps) {
  const pipWindowRef = useRef<Window | null>(null);
  const [pipRoot, setPipRoot] = useState<HTMLElement | null>(null);

  const openPip = useCallback(async () => {
    if (!("documentPictureInPicture" in window)) return;

    try {
      // @ts-ignore — Document PiP API
      const pip = await window.documentPictureInPicture.requestWindow({ width: 380, height: 560 });
      pipWindowRef.current = pip;

      // Copy all stylesheets
      for (const sheet of document.styleSheets) {
        try {
          const rules = [...sheet.cssRules].map(r => r.cssText).join("\n");
          const style = pip.document.createElement("style");
          style.textContent = rules;
          pip.document.head.appendChild(style);
        } catch {
          if (sheet.href) {
            const link = pip.document.createElement("link");
            link.rel = "stylesheet";
            link.href = sheet.href;
            pip.document.head.appendChild(link);
          }
        }
      }

      pip.document.documentElement.classList.add("dark");
      pip.document.body.style.cssText = "margin:0;padding:0;background:#050A14;overflow:hidden;";
      pip.document.body.style.fontFamily = "inherit";

      const root = pip.document.createElement("div");
      root.id = "pip-root";
      root.style.cssText = "width:100%;height:100%;display:flex;flex-direction:column;";
      pip.document.body.appendChild(root);
      setPipRoot(root);

      pip.addEventListener("pagehide", () => {
        setPipRoot(null);
        pipWindowRef.current = null;
        onClose();
      });
    } catch (err) {
      console.error("PiP failed", err);
    }
  }, [onClose]);

  const closePip = useCallback(() => {
    pipWindowRef.current?.close();
    setPipRoot(null);
    pipWindowRef.current = null;
  }, []);

  useEffect(() => {
    if (isOpen && !pipWindowRef.current) openPip();
    else if (!isOpen && pipWindowRef.current) closePip();
  }, [isOpen]);

  const [showReview, setShowReview] = useState(false);

  if (!pipRoot) return null;

  const human = state.players.find(p => p.isHuman);
  const pot = totalPot(state);
  const isHumanTurn = human?.isActive && availableActions;
  const showOdds = state.mode !== "normal";

  return createPortal(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#050A14", color: "white", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(201,168,76,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, color: "#c9a84c" }}>POKER TRAINING</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#6b7280" }}>
            {state.phase.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Your cards */}
      <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 6, fontWeight: 700, letterSpacing: 2 }}>YOUR HAND</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {human?.holeCards?.map((card, i) => (
            <PlayingCard key={i} card={card} size="md" />
          ))}
          {human?.holeCards?.length === 0 && (
            <>
              <PlayingCard faceDown size="md" />
              <PlayingCard faceDown size="md" />
            </>
          )}
          {showOdds && human?.winProbability != null && human.winProbability > 0 && (
            <div style={{ marginLeft: 8, fontSize: 24, fontWeight: 900, color: human.winProbability > 50 ? "#86efac" : human.winProbability > 30 ? "#fcd34d" : "#fca5a5" }}>
              {human.winProbability}%
            </div>
          )}
        </div>
        {human?.handDescription && state.communityCards.length > 0 && (
          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>{human.handDescription}</div>
        )}
      </div>

      {/* Community cards */}
      <div style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 6, fontWeight: 700, letterSpacing: 2 }}>BOARD</div>
        <div style={{ display: "flex", gap: 4 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <PlayingCard key={i} card={state.communityCards[i]} faceDown={!state.communityCards[i]} size="md" />
          ))}
        </div>
      </div>

      {/* Pot + Stack */}
      <div style={{ padding: "8px 14px 4px", display: "flex", gap: 16, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, letterSpacing: 2 }}>POT</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#fbbf24" }}>${pot.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, letterSpacing: 2 }}>YOUR STACK</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: human && human.stack > 0 ? "#86efac" : "#fca5a5" }}>
            ${human?.stack.toLocaleString() ?? "0"}
          </div>
        </div>
        <div style={{ fontSize: 10, color: "#6b7280", marginLeft: "auto" }}>
          {state.phase !== "idle" && `Hand #${state.handNumber}`}
        </div>
      </div>

      {/* Players status */}
      <div style={{ padding: "4px 14px 8px", display: "flex", flexDirection: "column", gap: 3, flex: 1, overflowY: "auto" }}>
        {state.players.filter(p => !p.isEliminated && !p.isHuman).map(p => {
          const isActive = p.isActive;
          const actionLabel = p.lastAction
            ? p.lastAction.toUpperCase() + ((p.lastAction === "raise" || p.lastAction === "call" || p.lastAction === "all-in") && p.lastActionAmount > 0 ? ` $${p.lastActionAmount.toLocaleString()}` : "")
            : null;
          const actionColor = p.lastAction === "fold" ? "#ef4444" : p.lastAction === "raise" || p.lastAction === "all-in" ? "#fbbf24" : p.lastAction === "call" ? "#60a5fa" : "#34d399";
          return (
            <div key={p.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "4px 8px", borderRadius: 6,
              background: isActive ? "rgba(234,179,8,0.1)" : "rgba(255,255,255,0.03)",
              border: isActive ? "1px solid rgba(234,179,8,0.3)" : "1px solid transparent",
              opacity: p.isFolded ? 0.4 : 1,
            }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {isActive && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#fbbf24" }} />}
                <span style={{ fontSize: 11, fontWeight: 700, color: p.isFolded ? "#6b7280" : "#e5e7eb" }}>{p.name}</span>
                {p.isFolded && <span style={{ fontSize: 9, color: "#6b7280" }}>FOLD</span>}
                {p.isAllIn && <span style={{ fontSize: 9, color: "#ef4444", fontWeight: 900 }}>ALL IN</span>}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {actionLabel && !p.isFolded && (
                  <span style={{ fontSize: 9, fontWeight: 900, color: actionColor }}>{actionLabel}</span>
                )}
                {p.streetBet > 0 && !p.isFolded && (
                  <span style={{ fontSize: 9, color: "#9ca3af" }}>bet ${p.streetBet.toLocaleString()}</span>
                )}
                <span style={{ fontSize: 10, color: "#fbbf24", fontWeight: 700 }}>${p.stack.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Winner banner */}
      {state.winners && state.winners.length > 0 && (state.phase === "showdown" || state.phase === "idle") && (
        <div style={{ padding: "6px 14px", borderTop: "1px solid rgba(201,168,76,0.2)" }}>
          {state.winners.map((w, i) => {
            const wPlayer = state.players.find(p => p.id === w.playerId);
            const isHumanWinner = wPlayer?.isHuman;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 10px", borderRadius: 8,
                background: isHumanWinner ? "rgba(134,239,172,0.12)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${isHumanWinner ? "rgba(134,239,172,0.4)" : "rgba(201,168,76,0.2)"}`,
                marginBottom: i < state.winners.length - 1 ? 4 : 0,
              }}>
                <span style={{ fontSize: 14 }}>{isHumanWinner ? "🏆" : "🎴"}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: isHumanWinner ? "#86efac" : "#fbbf24" }}>
                    {wPlayer?.name ?? "Unknown"} wins ${w.amount.toLocaleString()}
                  </span>
                  {w.handDesc && (
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>{w.handDesc}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compact hand review (inline in PiP) */}
      {showReview && handSummary && (
        <PipReview summary={handSummary} />
      )}

      {/* Action bar */}
      <div style={{ marginTop: "auto", padding: "8px 0 10px" }}>
        {isHumanTurn ? (
          <ActionBar
            actions={availableActions}
            onAction={onAction}
            pot={pot}
            bigBlind={state.bigBlind}
            isCompact
          />
        ) : state.phase === "idle" || state.phase === "showdown" ? (
          <div style={{ padding: "6px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
            {state.phase === "showdown" && handSummary && (
              <button
                onClick={() => setShowReview(v => !v)}
                style={{
                  width: "100%", padding: "8px", borderRadius: 10,
                  fontWeight: 900, fontSize: 10, letterSpacing: 2,
                  textTransform: "uppercase",
                  background: showReview ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.06)",
                  color: showReview ? "#c9a84c" : "#9ca3af",
                  border: showReview ? "1px solid rgba(201,168,76,0.4)" : "1px solid rgba(255,255,255,0.1)",
                  cursor: "pointer",
                }}
              >
                📊 {showReview ? "Hide Review" : "Review Hand"}
              </button>
            )}
            <button
              onClick={onNewHand}
              style={{
                width: "100%", padding: "10px", borderRadius: 10,
                fontWeight: 900, fontSize: 11, letterSpacing: 2,
                textTransform: "uppercase",
                background: "linear-gradient(135deg, #78350f, #c9a84c)",
                color: "#000", border: "none", cursor: "pointer",
              }}
            >
              {state.phase === "idle" ? "Start Game" : "Deal Next Hand"}
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center", fontSize: 11, color: "#6b7280", padding: "8px 0" }}>
            {state.isWaitingForAI ? "AI is thinking..." : "Waiting..."}
          </div>
        )}
      </div>
    </div>,
    pipRoot
  );
}

// ── Compact review panel shown inline in the PiP window ──────────────────────

const STREET_BG: Record<string, string> = {
  preflop: "#4f46e5", flop: "#7c3aed", turn: "#0284c7", river: "#059669",
};
const ACTION_CLR: Record<string, string> = {
  fold: "#ef4444", check: "#6b7280", call: "#60a5fa", raise: "#fbbf24", "all-in": "#f97316",
};

function PipReview({ summary }: { summary: HandSummaryData }) {
  const { decisions, result, profitLoss, score } = summary;
  const resultColor = result === "won" ? "#86efac" : result === "folded" ? "#9ca3af" : "#fca5a5";
  const plLabel = profitLoss >= 0 ? `+$${profitLoss.toLocaleString()}` : `-$${Math.abs(profitLoss).toLocaleString()}`;
  const scoreColor = score === null ? "#6b7280" : score >= 70 ? "#4ade80" : score >= 40 ? "#fbbf24" : "#f87171";
  const scoreBarBg = score === null ? "#374151" : score >= 70 ? "#16a34a" : score >= 40 ? "#d97706" : "#dc2626";

  return (
    <div style={{ padding: "8px 14px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Score row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: resultColor, textTransform: "uppercase" }}>
          {result} {plLabel}
        </span>
        {score !== null && (
          <>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${score}%`, background: scoreBarBg, borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 900, color: scoreColor, flexShrink: 0 }}>{score}/100</span>
          </>
        )}
      </div>

      {/* Decisions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
        {decisions.length === 0 ? (
          <div style={{ fontSize: 10, color: "#4b5563" }}>No decisions recorded.</div>
        ) : decisions.map((d, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 5,
            padding: "4px 7px", borderRadius: 6,
            background: d.isCorrect === false ? "rgba(239,68,68,0.07)" : d.isCorrect === true ? "rgba(74,222,128,0.07)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${d.isCorrect === false ? "rgba(239,68,68,0.2)" : d.isCorrect === true ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.06)"}`,
          }}>
            <span style={{
              fontSize: 8, background: STREET_BG[d.street] ?? "#374151",
              color: "#fff", borderRadius: 3, padding: "1px 4px",
              textTransform: "uppercase", fontWeight: 700, flexShrink: 0, marginTop: 2,
            }}>
              {d.street.substring(0, 3)}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: ACTION_CLR[d.action] ?? "#e5e7eb", fontWeight: 900, fontSize: 11 }}>
                  {d.action.toUpperCase()}{d.amount > 0 ? ` $${d.amount.toLocaleString()}` : ""}
                </span>
                {d.isCorrect !== null && (
                  <span style={{ fontSize: 11, color: d.isCorrect ? "#4ade80" : "#f87171", marginLeft: "auto" }}>
                    {d.isCorrect ? "✓" : "✗"}
                  </span>
                )}
              </div>
              {d.advisorHint && !d.isCorrect && (
                <div style={{ fontSize: 9, color: "#6b7280", marginTop: 1 }}>💡 {d.advisorHint}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
