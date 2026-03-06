"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { GameState, AvailableActions, PlayerAction } from "@/lib/poker/types";
import { PlayingCard } from "./PlayingCard";
import { ActionBar } from "./ActionBar";
import { totalPot } from "@/lib/poker/game-engine";

interface PipWindowProps {
  state: GameState;
  availableActions: AvailableActions | null;
  onAction: (action: PlayerAction, amount?: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function PipWindow({ state, availableActions, onAction, isOpen, onClose }: PipWindowProps) {
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

  if (!pipRoot) return null;

  const human = state.players.find(p => p.isHuman);
  const pot = totalPot(state);
  const isHumanTurn = human?.isActive && availableActions;

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
          {human?.winProbability != null && human.winProbability > 0 && (
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

      {/* Pot + players status */}
      <div style={{ padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 700 }}>POT</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#fbbf24", fontVariantNumeric: "tabular-nums" }}>${pot.toLocaleString()}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
          {state.players.filter(p => !p.isEliminated && !p.isHuman).map(p => (
            <div key={p.id} style={{ fontSize: 10, color: p.isFolded ? "#4b5563" : "#d1d5db", display: "flex", gap: 6 }}>
              <span>{p.name}</span>
              <span style={{ color: "#fbbf24", fontWeight: 700 }}>${p.stack.toLocaleString()}</span>
              {p.lastAction && <span style={{ color: "#9ca3af" }}>{p.lastAction.toUpperCase()}</span>}
            </div>
          ))}
        </div>
      </div>

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
        ) : (
          <div style={{ textAlign: "center", fontSize: 11, color: "#6b7280", padding: "8px 0" }}>
            {state.isWaitingForAI ? "AI is thinking..." : state.phase === "showdown" ? "Hand complete" : "Waiting..."}
          </div>
        )}
      </div>
    </div>,
    pipRoot
  );
}
