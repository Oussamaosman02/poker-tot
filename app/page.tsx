"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GameMode } from "@/lib/poker/types";

const MODES: { id: GameMode; label: string; description: string; color: string; icon: string }[] = [
  {
    id: "normal",
    label: "Normal",
    description: "Play like a real game — no extra info, just your cards and reads",
    color: "from-gray-800 to-gray-700",
    icon: "♠",
  },
  {
    id: "vision",
    label: "Vision",
    description: "See all players' hole cards — great for studying hand matchups",
    color: "from-purple-900 to-purple-800",
    icon: "👁",
  },
  {
    id: "advisor",
    label: "Advisor",
    description: "Get real-time hints on every decision based on pot odds & hand strength",
    color: "from-blue-900 to-blue-800",
    icon: "💡",
  },
  {
    id: "training",
    label: "Training",
    description: "Play with advisor hints AND get feedback on your decisions after each action",
    color: "from-green-900 to-green-800",
    icon: "🎯",
  },
];

export default function Home() {
  const router = useRouter();
  const [selected, setSelected] = useState<GameMode>("normal");
  const [loading, setLoading] = useState(false);

  const startGame = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", mode: selected, startStack: 10000 }),
      });
      const { sessionId } = await res.json();
      router.push(`/game?mode=${selected}&session=${sessionId}`);
    } catch {
      router.push(`/game?mode=${selected}`);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{
        background: "linear-gradient(160deg, #020810 0%, #050A14 40%, #040d1a 100%)",
      }}
    >
      {/* Logo / Title */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-5xl">♠</span>
          <div>
            <h1
              className="text-4xl font-black uppercase tracking-[0.15em] leading-none"
              style={{ color: "#c9a84c" }}
            >
              Poker Training
            </h1>
            <p className="text-gray-500 text-sm tracking-[0.3em] uppercase mt-1">
              Learn · Play · Improve
            </p>
          </div>
          <span className="text-5xl">♣</span>
        </div>
        <p className="text-gray-400 max-w-md text-sm leading-relaxed">
          Practice Texas Hold'em against AI opponents powered by different language models.
          Each AI has a unique playing style — tight, loose, aggressive, or unpredictable.
        </p>
      </div>

      {/* Mode selector */}
      <div className="w-full max-w-2xl mb-8">
        <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-4 text-center">
          Choose Your Mode
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => setSelected(mode.id)}
              className={`
                relative p-4 rounded-2xl text-left transition-all duration-200 active:scale-[0.98]
                bg-gradient-to-br ${mode.color}
                ${selected === mode.id
                  ? "ring-2 ring-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                  : "ring-1 ring-white/5 opacity-70 hover:opacity-90"
                }
              `}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xl">{mode.icon}</span>
                <span className="font-black text-white text-sm uppercase tracking-wider">{mode.label}</span>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">{mode.description}</p>
              {selected === mode.id && (
                <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="#000" stroke="none">
                    <path d="M20 6L9 17l-5-5" strokeWidth="3" stroke="#000" fill="none" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* AI players preview */}
      <div className="w-full max-w-2xl mb-8">
        <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-4 text-center">
          Your Opponents (AI-Powered)
        </h2>
        <div className="flex gap-3 justify-center flex-wrap">
          {[
            { name: "Viktor", style: "TAG", model: "Gemini / GPT / Grok", color: "from-red-900" },
            { name: "Maria", style: "LAG", model: "Gemini / DeepSeek / Kimi", color: "from-orange-900" },
            { name: "Chen", style: "Nit", model: "GPT-4.1 / Grok / MiniMax", color: "from-cyan-900" },
            { name: "Sofia", style: "Fish", model: "Gemini / GPT / DeepSeek", color: "from-pink-900" },
            { name: "James", style: "Maniac", model: "Kimi / Grok / MiniMax", color: "from-yellow-900" },
          ].map(ai => (
            <div
              key={ai.name}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-gradient-to-b ${ai.color} to-gray-900 border border-white/5`}
            >
              <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-white font-black text-xs border border-yellow-800/40">
                {ai.name[0]}
              </div>
              <span className="text-white text-[11px] font-bold">{ai.name}</span>
              <span className="text-yellow-500 text-[9px] font-bold uppercase tracking-wider">{ai.style}</span>
              <span className="text-gray-500 text-[8px]">{ai.model}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={startGame}
        disabled={loading}
        className="px-12 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-base transition-all active:scale-95 hover:brightness-110 disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, #78350f, #c9a84c, #78350f)",
          backgroundSize: "200% 100%",
          color: "#000",
          boxShadow: "0 4px 30px rgba(201,168,76,0.4), 0 0 60px rgba(201,168,76,0.1)",
        }}
      >
        {loading ? "Starting..." : "Deal Me In →"}
      </button>

      {/* Stats link */}
      <a
        href="/stats"
        className="mt-6 text-gray-600 hover:text-yellow-500 transition-colors text-xs uppercase tracking-[0.2em] font-bold"
      >
        View My Stats →
      </a>
    </main>
  );
}
