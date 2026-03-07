"use client";

import { HandSummaryData } from "@/hooks/use-poker-game";

const STREET_COLOR: Record<string, string> = {
  preflop: "#6366f1",
  flop: "#8b5cf6",
  turn: "#0ea5e9",
  river: "#10b981",
};

const ACTION_COLOR: Record<string, string> = {
  fold: "#ef4444",
  check: "#6b7280",
  call: "#60a5fa",
  raise: "#fbbf24",
  "all-in": "#f97316",
};

interface HandReviewModalProps {
  summary: HandSummaryData;
  onClose: () => void;
  /** Compact layout for PiP window */
  compact?: boolean;
}

export function HandReviewModal({ summary, onClose, compact = false }: HandReviewModalProps) {
  const { decisions, result, profitLoss, score, feedback, handNumber } = summary;

  const resultColor = result === "won" ? "#86efac" : result === "folded" ? "#9ca3af" : "#fca5a5";
  const resultLabel = result === "won" ? "WON" : result === "folded" ? "FOLDED" : "LOST";
  const plLabel = profitLoss >= 0 ? `+$${profitLoss.toLocaleString()}` : `-$${Math.abs(profitLoss).toLocaleString()}`;
  const scoreColor = score === null ? "#6b7280" : score >= 70 ? "#86efac" : score >= 40 ? "#fcd34d" : "#fca5a5";

  if (compact) {
    // ── Compact PiP variant ───────────────────────────────────────────────
    return (
      <div style={{ padding: "8px 14px", borderTop: "1px solid rgba(201,168,76,0.15)" }}>
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, color: "#c9a84c" }}>HAND REVIEW</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: resultColor }}>{resultLabel} {plLabel}</span>
            {score !== null && (
              <span style={{ fontSize: 10, fontWeight: 900, color: scoreColor }}>{score}/100</span>
            )}
          </div>
        </div>

        {/* Feedback */}
        <div style={{ fontSize: 9, color: "#9ca3af", marginBottom: 6, fontStyle: "italic" }}>{feedback}</div>

        {/* Decisions */}
        {decisions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {decisions.map((d, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 5,
                padding: "4px 6px", borderRadius: 5,
                background: d.isCorrect === false ? "rgba(252,165,165,0.06)" : d.isCorrect === true ? "rgba(134,239,172,0.06)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${d.isCorrect === false ? "rgba(252,165,165,0.2)" : d.isCorrect === true ? "rgba(134,239,172,0.2)" : "rgba(255,255,255,0.06)"}`,
              }}>
                <span style={{
                  fontSize: 8, background: STREET_COLOR[d.street] ?? "#374151",
                  color: "#fff", borderRadius: 3, padding: "1px 4px",
                  textTransform: "uppercase", fontWeight: 700, flexShrink: 0, marginTop: 1,
                }}>
                  {d.street.substring(0, 3)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: ACTION_COLOR[d.action] ?? "#e5e7eb", fontWeight: 900, fontSize: 10 }}>
                      {d.action.toUpperCase()}{d.amount > 0 ? ` $${d.amount.toLocaleString()}` : ""}
                    </span>
                    {d.isCorrect !== null && (
                      <span style={{ fontSize: 10, color: d.isCorrect ? "#86efac" : "#fca5a5" }}>
                        {d.isCorrect ? "✓" : "✗"}
                      </span>
                    )}
                  </div>
                  {d.advisorHint && !d.isCorrect && (
                    <div style={{ fontSize: 8, color: "#6b7280", marginTop: 1 }}>💡 {d.advisorHint}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Full modal overlay ────────────────────────────────────────────────────
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#0a1628",
          border: "1px solid rgba(201,168,76,0.35)",
          borderRadius: 16,
          padding: "20px 22px",
          width: "min(92vw, 480px)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          gap: 0,
          boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, color: "#c9a84c" }}>
              HAND #{handNumber} REVIEW
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: resultColor }}>{resultLabel}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: resultColor }}>{plLabel}</span>
              {score !== null && (
                <span style={{
                  padding: "2px 10px", borderRadius: 20,
                  fontWeight: 900, fontSize: 11,
                  background: score >= 70 ? "rgba(134,239,172,0.12)" : score >= 40 ? "rgba(252,211,77,0.12)" : "rgba(252,165,165,0.12)",
                  color: scoreColor,
                  border: `1px solid ${scoreColor}44`,
                }}>
                  Decision score: {score}/100
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#9ca3af", borderRadius: 8, width: 28, height: 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 14, flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Feedback */}
        <div style={{
          fontSize: 12, color: "#9ca3af", fontStyle: "italic",
          padding: "8px 12px", borderRadius: 8,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          marginBottom: 14,
        }}>
          {feedback}
        </div>

        {/* Decision log */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          {decisions.length === 0 ? (
            <div style={{ textAlign: "center", color: "#4b5563", fontSize: 12, padding: "16px 0" }}>
              No voluntary decisions recorded.
            </div>
          ) : (
            decisions.map((d, i) => (
              <div key={i} style={{
                padding: "8px 12px", borderRadius: 8,
                background: d.isCorrect === false
                  ? "rgba(252,165,165,0.06)"
                  : d.isCorrect === true
                  ? "rgba(134,239,172,0.06)"
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${d.isCorrect === false
                  ? "rgba(252,165,165,0.2)"
                  : d.isCorrect === true
                  ? "rgba(134,239,172,0.2)"
                  : "rgba(255,255,255,0.07)"}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* Street badge */}
                  <span style={{
                    fontSize: 9, background: STREET_COLOR[d.street] ?? "#374151",
                    color: "#fff", borderRadius: 4, padding: "2px 6px",
                    textTransform: "uppercase", fontWeight: 700, letterSpacing: 1,
                    flexShrink: 0,
                  }}>
                    {d.street}
                  </span>

                  {/* Action */}
                  <span style={{ color: ACTION_COLOR[d.action] ?? "#e5e7eb", fontWeight: 900, fontSize: 13 }}>
                    {d.action.toUpperCase()}
                    {d.amount > 0 && (
                      <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: 11 }}> ${d.amount.toLocaleString()}</span>
                    )}
                  </span>

                  {/* Correctness badge */}
                  {d.isCorrect !== null && (
                    <span style={{
                      marginLeft: "auto",
                      fontSize: 14,
                      color: d.isCorrect ? "#86efac" : "#fca5a5",
                    }}>
                      {d.isCorrect ? "✓" : "✗"}
                    </span>
                  )}
                </div>

                {/* Advisor hint (show when incorrect or no hint was acted on) */}
                {d.advisorHint && (
                  <div style={{
                    marginTop: 5, fontSize: 11,
                    color: d.isCorrect === false ? "#fca5a5" : "#6b7280",
                    display: "flex", gap: 5, alignItems: "flex-start",
                  }}>
                    <span style={{ flexShrink: 0 }}>💡</span>
                    <span>{d.advisorHint}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Score legend (only when advisor was active for some decisions) */}
        {decisions.some(d => d.isCorrect !== null) && (
          <div style={{
            marginTop: 14, paddingTop: 10,
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex", gap: 14, fontSize: 10, color: "#4b5563",
          }}>
            <span><span style={{ color: "#86efac" }}>✓</span> Matched advisor</span>
            <span><span style={{ color: "#fca5a5" }}>✗</span> Differed from advisor</span>
          </div>
        )}
      </div>
    </div>
  );
}
