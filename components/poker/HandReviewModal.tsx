"use client";

import { useEffect, useState } from "react";
import { HandSummaryData } from "@/hooks/use-poker-game";
import { PlayingCard } from "./PlayingCard";
import { cardToString } from "@/lib/poker/deck";

const STREET_STYLE: Record<string, { bg: string }> = {
  preflop: { bg: "#4f46e5" },
  flop:    { bg: "#7c3aed" },
  turn:    { bg: "#0284c7" },
  river:   { bg: "#059669" },
};

const ACTION_COLOR: Record<string, string> = {
  fold:     "#ef4444",
  check:    "#6b7280",
  call:     "#60a5fa",
  raise:    "#fbbf24",
  "all-in": "#f97316",
};

interface HandReviewModalProps {
  summary: HandSummaryData;
  onClose: () => void;
}

export function HandReviewModal({ summary, onClose }: HandReviewModalProps) {
  const [aiStatus, setAiStatus] = useState<"loading" | "done" | "error">("loading");
  const [aiFeedback, setAiFeedback] = useState("");

  const { handNumber, decisions, result, profitLoss, score, holeCards, communityCards, allActions, opponentSummaries } = summary;

  const resultColor = result === "won" ? "#86efac" : result === "folded" ? "#9ca3af" : "#fca5a5";
  const plLabel = profitLoss >= 0 ? `+$${profitLoss.toLocaleString()}` : `-$${Math.abs(profitLoss).toLocaleString()}`;
  const scoreColor = score === null ? "#6b7280" : score >= 70 ? "#4ade80" : score >= 40 ? "#fbbf24" : "#f87171";
  const scoreBarColor = score === null ? "#374151" : score >= 70 ? "#16a34a" : score >= 40 ? "#d97706" : "#dc2626";

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await fetch("/api/hand-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            handNumber,
            holeCards: holeCards.map(cardToString),
            communityCards: communityCards.map(cardToString),
            decisions,
            result,
            profitLoss,
            score,
            allActions,
            opponentSummaries,
          }),
          signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setAiFeedback(data.feedback ?? "No feedback available.");
        setAiStatus("done");
      } catch {
        setAiStatus("error");
      }
    };
    fetchFeedback();
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(6px)",
        padding: "16px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "linear-gradient(160deg, #0d1b2e 0%, #091525 100%)",
          border: "1px solid rgba(201,168,76,0.3)",
          borderRadius: 20,
          width: "min(100%, 500px)",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{
          padding: "16px 18px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 3, color: "#c9a84c" }}>
              HAND #{handNumber} REVIEW
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 3 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: resultColor, textTransform: "uppercase" }}>
                {result}
              </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: resultColor }}>{plLabel}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)", color: "#9ca3af",
              cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>

          {/* ── Cards ──────────────────────────────────────────────────── */}
          <div style={{
            padding: "14px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", gap: 20, alignItems: "flex-start",
          }}>
            {/* Hole cards */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#6b7280", marginBottom: 6 }}>
                YOUR HAND
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {holeCards.length >= 2 ? (
                  holeCards.map((c, i) => <PlayingCard key={i} card={c} size="md" />)
                ) : (
                  <>
                    <PlayingCard faceDown size="md" />
                    <PlayingCard faceDown size="md" />
                  </>
                )}
              </div>
            </div>

            {/* Board */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#6b7280", marginBottom: 6 }}>
                BOARD
              </div>
              <div style={{ display: "flex", gap: 3 }}>
                {Array.from({ length: 5 }, (_, i) => (
                  <PlayingCard key={i} card={communityCards[i]} faceDown={!communityCards[i]} size="md" />
                ))}
              </div>
            </div>
          </div>

          {/* ── Score bar ──────────────────────────────────────────────── */}
          {score !== null && (
            <div style={{
              padding: "12px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#6b7280", flexShrink: 0 }}>
                DECISION SCORE
              </div>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 4,
                  width: `${score}%`,
                  background: `linear-gradient(90deg, ${scoreBarColor}99, ${scoreBarColor})`,
                  transition: "width 0.8s ease",
                }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: scoreColor, flexShrink: 0 }}>
                {score}<span style={{ fontSize: 10, color: "#6b7280" }}>/100</span>
              </div>
            </div>
          )}

          {/* ── AI Coach ───────────────────────────────────────────────── */}
          <div style={{
            margin: "12px 18px",
            padding: "12px 14px",
            borderRadius: 12,
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.2)",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 13 }}>🤖</span>
              <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, color: "#818cf8" }}>AI COACH</span>
            </div>
            {aiStatus === "loading" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Spinner />
                <span style={{ fontSize: 12, color: "#6b7280" }}>Analysing your hand...</span>
              </div>
            ) : aiStatus === "error" ? (
              <span style={{ fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>
                Could not load feedback — check your connection.
              </span>
            ) : (
              <p style={{ fontSize: 13, color: "#d1d5db", lineHeight: 1.6, margin: 0 }}>{aiFeedback}</p>
            )}
          </div>

          {/* ── Decision log ───────────────────────────────────────────── */}
          <div style={{ padding: "0 18px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#6b7280", marginBottom: 2 }}>
              YOUR DECISIONS ({decisions.length})
            </div>

            {decisions.length === 0 ? (
              <div style={{ textAlign: "center", color: "#374151", fontSize: 12, padding: "10px 0" }}>
                No voluntary decisions recorded.
              </div>
            ) : (
              decisions.map((d, i) => {
                const isWrong = d.isCorrect === false;
                const isRight = d.isCorrect === true;
                const streetStyle = STREET_STYLE[d.street] ?? { bg: "#374151" };

                return (
                  <div key={i} style={{
                    borderRadius: 10,
                    background: isWrong ? "rgba(239,68,68,0.07)" : isRight ? "rgba(74,222,128,0.07)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isWrong ? "rgba(239,68,68,0.25)" : isRight ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.07)"}`,
                    overflow: "hidden",
                  }}>
                    {/* Top row: street + action + verdict */}
                    <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontSize: 9, background: streetStyle.bg, color: "#fff",
                        borderRadius: 4, padding: "2px 6px",
                        textTransform: "uppercase", fontWeight: 700, letterSpacing: 1, flexShrink: 0,
                      }}>
                        {d.street}
                      </span>
                      <span style={{ color: ACTION_COLOR[d.action] ?? "#e5e7eb", fontWeight: 900, fontSize: 14 }}>
                        {d.action.toUpperCase()}
                        {d.amount > 0 && (
                          <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: 12 }}>
                            {" "}${d.amount.toLocaleString()}
                          </span>
                        )}
                      </span>
                      {d.isCorrect !== null && (
                        <div style={{
                          marginLeft: "auto", display: "flex", alignItems: "center", gap: 4,
                          fontSize: 11, fontWeight: 700,
                          color: isRight ? "#4ade80" : "#f87171",
                        }}>
                          <span style={{ fontSize: 14 }}>{isRight ? "✓" : "✗"}</span>
                          <span>{isRight ? "Good" : "Diff"}</span>
                        </div>
                      )}
                    </div>

                    {/* Advisor hint row (always show if available) */}
                    {d.advisorHint && (
                      <div style={{
                        padding: "6px 12px 8px",
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                        display: "flex", alignItems: "flex-start", gap: 6,
                        background: "rgba(0,0,0,0.15)",
                      }}>
                        <span style={{ fontSize: 10, flexShrink: 0, marginTop: 1 }}>💡</span>
                        <div>
                          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "#4b5563", marginRight: 4 }}>
                            ADVISOR:
                          </span>
                          <span style={{ fontSize: 11, color: isWrong ? "#fca5a5" : "#6b7280" }}>
                            {d.advisorHint}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Legend */}
          {decisions.some(d => d.isCorrect !== null) && (
            <div style={{
              padding: "0 18px 16px",
              display: "flex", gap: 16, fontSize: 10, color: "#374151",
              flexShrink: 0,
            }}>
              <span><span style={{ color: "#4ade80" }}>✓ Good</span> — matched advisor</span>
              <span><span style={{ color: "#f87171" }}>✗ Diff</span> — differed from advisor</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
      border: "2px solid rgba(99,102,241,0.2)",
      borderTopColor: "#818cf8",
      animation: "spin 0.8s linear infinite",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
