"use client";

import { GameState, GameMode } from "@/lib/poker/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

const MODE_LABELS: Record<GameMode, string> = {
  normal: "Normal",
  vision: "Vision",
  advisor: "Advisor",
  training: "Training",
};

const MODE_COLORS: Record<GameMode, string> = {
  normal: "text-gray-400",
  vision: "text-purple-400",
  advisor: "text-blue-400",
  training: "text-green-400",
};

interface InfoBarProps {
  state: GameState;
  onPip?: () => void;
  pipSupported?: boolean;
}

export function InfoBar({ state, onPip, pipSupported }: InfoBarProps) {
  const aliveCount = state.players.filter(p => !p.isEliminated).length;

  return (
    <div
      className="flex items-center justify-between px-4 py-2 text-xs"
      style={{
        background: "linear-gradient(90deg, #050A14 0%, #0a1020 50%, #050A14 100%)",
        borderTop: "1px solid rgba(201,168,76,0.2)",
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">BLINDS</span>
          <span className="text-yellow-400 font-mono font-bold">
            {state.smallBlind.toLocaleString()} / {state.bigBlind.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">HAND</span>
          <span className="text-white font-mono">#{state.handNumber}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">PLAYERS</span>
          <span className="text-white font-mono">{aliveCount}</span>
        </div>
      </div>

      {/* Center — phase */}
      <div className="font-black uppercase tracking-widest text-[10px]" style={{ color: "#c9a84c" }}>
        {state.phase === "idle" ? "POKER TRAINING" :
         state.phase === "preflop" ? "PRE-FLOP" :
         state.phase === "flop" ? "FLOP" :
         state.phase === "turn" ? "TURN" :
         state.phase === "river" ? "RIVER" :
         "SHOWDOWN"}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <span className={cn("font-bold uppercase tracking-wider", MODE_COLORS[state.mode])}>
          {MODE_LABELS[state.mode]}
        </span>
        <Link
          href="/stats"
          className="text-gray-500 hover:text-yellow-400 transition-colors font-bold"
        >
          STATS
        </Link>
        {pipSupported && (
          <button
            onClick={onPip}
            className="text-gray-500 hover:text-yellow-400 transition-colors font-bold flex items-center gap-1"
            title="Picture in Picture"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <rect x="12" y="10" width="10" height="7" rx="1" fill="currentColor" stroke="none" opacity="0.6" />
            </svg>
            PiP
          </button>
        )}
      </div>
    </div>
  );
}
