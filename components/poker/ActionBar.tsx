"use client";

import { useState } from "react";
import { AvailableActions, PlayerAction } from "@/lib/poker/types";
import { cn } from "@/lib/utils";

interface ActionBarProps {
  actions: AvailableActions;
  onAction: (action: PlayerAction, amount?: number) => void;
  advisorHint?: string | null;
  trainingFeedback?: string | null;
  pot: number;
  bigBlind: number;
  isCompact?: boolean;
}

export function ActionBar({ actions, onAction, advisorHint, trainingFeedback, pot, bigBlind, isCompact }: ActionBarProps) {
  const [raiseAmount, setRaiseAmount] = useState(actions.minRaise);
  const [showRaiseSlider, setShowRaiseSlider] = useState(false);

  const potBet = Math.min(Math.round(pot), actions.maxRaise);
  const halfPot = Math.min(Math.round(pot * 0.5), actions.maxRaise);
  const thirdPot = Math.min(Math.round(pot * 0.33), actions.maxRaise);

  const handleRaise = () => {
    if (showRaiseSlider) {
      onAction("raise", raiseAmount);
      setShowRaiseSlider(false);
    } else {
      setRaiseAmount(actions.minRaise);
      setShowRaiseSlider(true);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", isCompact ? "px-2" : "px-4")}>
      {/* Advisor hint */}
      {advisorHint && (
        <div className="text-center text-xs font-medium py-1.5 px-3 rounded-lg bg-blue-900/60 text-blue-200 border border-blue-700/40">
          💡 {advisorHint}
        </div>
      )}

      {/* Raise slider */}
      {showRaiseSlider && actions.canRaise && (
        <div className="flex flex-col gap-1.5 p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(201,168,76,0.2)" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Raise to</span>
            <span className="text-yellow-400 font-mono font-bold text-sm">${raiseAmount.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={actions.minRaise}
            max={actions.maxRaise}
            value={raiseAmount}
            step={bigBlind}
            onChange={e => setRaiseAmount(Number(e.target.value))}
            className="w-full accent-yellow-500 h-1.5"
          />
          {/* Quick bet sizes */}
          <div className="flex gap-1">
            {[
              { label: "Min", val: actions.minRaise },
              { label: "1/3", val: thirdPot },
              { label: "½", val: halfPot },
              { label: "Pot", val: potBet },
              { label: "All-in", val: actions.maxRaise },
            ].map(({ label, val }) => (
              <button
                key={label}
                onClick={() => setRaiseAmount(Math.max(actions.minRaise, Math.min(val, actions.maxRaise)))}
                className={cn(
                  "flex-1 text-[9px] font-bold py-1 rounded transition-colors",
                  raiseAmount === val
                    ? "bg-yellow-600 text-black"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className={cn("flex gap-2", isCompact ? "gap-1" : "gap-2")}>
        {/* Fold */}
        {actions.canFold && (
          <button
            onClick={() => { onAction("fold"); setShowRaiseSlider(false); }}
            className={cn(
              "flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95",
              isCompact ? "py-2 text-[10px]" : ""
            )}
            style={{
              background: "linear-gradient(135deg, #7f1d1d, #991b1b)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            Fold
          </button>
        )}

        {/* Check */}
        {actions.canCheck && (
          <button
            onClick={() => { onAction("check"); setShowRaiseSlider(false); }}
            className={cn(
              "flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95",
              isCompact ? "py-2 text-[10px]" : ""
            )}
            style={{
              background: "linear-gradient(135deg, #14532d, #166534)",
              border: "1px solid rgba(34,197,94,0.3)",
              color: "#86efac",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            Check
          </button>
        )}

        {/* Call */}
        {actions.canCall && (
          <button
            onClick={() => { onAction("call"); setShowRaiseSlider(false); }}
            className={cn(
              "flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95",
              isCompact ? "py-2 text-[10px]" : ""
            )}
            style={{
              background: "linear-gradient(135deg, #1e3a5f, #1e40af)",
              border: "1px solid rgba(96,165,250,0.3)",
              color: "#93c5fd",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            Call ${actions.callAmount.toLocaleString()}
          </button>
        )}

        {/* Raise */}
        {actions.canRaise && (
          <button
            onClick={handleRaise}
            className={cn(
              "flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95",
              showRaiseSlider ? "ring-2 ring-yellow-400" : "",
              isCompact ? "py-2 text-[10px]" : ""
            )}
            style={{
              background: "linear-gradient(135deg, #78350f, #92400e)",
              border: "1px solid rgba(251,191,36,0.3)",
              color: "#fcd34d",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            {showRaiseSlider ? `Raise $${raiseAmount.toLocaleString()}` : "Raise"}
          </button>
        )}

        {/* All-in */}
        {actions.canAllIn && (
          <button
            onClick={() => { onAction("all-in"); setShowRaiseSlider(false); }}
            className={cn(
              "flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95",
              isCompact ? "py-2 text-[10px]" : ""
            )}
            style={{
              background: "linear-gradient(135deg, #7f1d1d, #dc2626)",
              border: "1px solid rgba(239,68,68,0.5)",
              color: "#ffffff",
              boxShadow: "0 2px 12px rgba(220,38,38,0.3)",
            }}
          >
            All-In
          </button>
        )}
      </div>
    </div>
  );
}
