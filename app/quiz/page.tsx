"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  PreflopScenario,
  QuizAction,
  getRandomScenario,
  getSituationLabel,
  describeSituation,
} from "@/lib/poker/preflop-quiz";
import { Card, Suit } from "@/lib/poker/types";

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠",
};
const SUIT_COLORS: Record<Suit, string> = {
  hearts: "#ef4444", diamonds: "#ef4444", clubs: "#111827", spades: "#111827",
};

function BigCard({ card }: { card: Card }) {
  const rank = card.rank === "T" ? "10" : card.rank;
  const color = SUIT_COLORS[card.suit];
  const symbol = SUIT_SYMBOLS[card.suit];
  return (
    <div
      className="relative select-none rounded-xl bg-white shadow-2xl flex flex-col items-start justify-between"
      style={{ width: 88, height: 124, padding: "10px 10px" }}
    >
      <div style={{ color }}>
        <div className="text-2xl font-black leading-none">{rank}</div>
        <div className="text-lg leading-none">{symbol}</div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-5xl font-bold" style={{ color, opacity: 0.12 }}>{symbol}</span>
      </div>
      <div className="self-end rotate-180" style={{ color }}>
        <div className="text-2xl font-black leading-none">{rank}</div>
        <div className="text-lg leading-none">{symbol}</div>
      </div>
    </div>
  );
}

const ACTION_CONFIG: Record<QuizAction, { label: string; icon: string; bg: string; border: string }> = {
  fold:  { label: "Fold",         icon: "✗", bg: "from-red-950 to-red-900",   border: "border-red-800" },
  call:  { label: "Call / Limp",  icon: "→", bg: "from-blue-950 to-blue-900", border: "border-blue-800" },
  raise: { label: "Raise / 3-Bet",icon: "↑", bg: "from-green-950 to-green-900",border: "border-green-800" },
};

const POSITION_DESC: Record<string, string> = {
  UTG: "First to act preflop — tightest range required",
  MP:  "Middle position — moderately tight range",
  CO:  "Cutoff — one before the button, wide range",
  BTN: "Button — last to act post-flop, widest range",
  SB:  "Small Blind — forced bet, out of position post-flop",
  BB:  "Big Blind — last preflop, first post-flop, getting a discount",
};

interface SessionStats {
  answered: number;
  correct: number;
  streak: number;
  bestStreak: number;
}

export default function QuizPage() {
  const [scenario, setScenario] = useState<PreflopScenario | null>(null);
  const [answered, setAnswered] = useState<QuizAction | null>(null);
  const [played, setPlayed] = useState<string[]>([]);
  const [stats, setStats] = useState<SessionStats>({ answered: 0, correct: 0, streak: 0, bestStreak: 0 });
  const [elapsed, setElapsed] = useState(0);
  const questionStart = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsed(0);
    questionStart.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - questionStart.current) / 1000));
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const loadNextScenario = useCallback((currentPlayed: string[]) => {
    let next = getRandomScenario(currentPlayed);
    let resetPlayed = currentPlayed;
    if (!next) {
      resetPlayed = [];
      next = getRandomScenario([]);
    }
    setPlayed(resetPlayed);
    setScenario(next);
    setAnswered(null);
    startTimer();
  }, []);

  useEffect(() => {
    loadNextScenario([]);
    return () => stopTimer();
  }, []);

  const handleAnswer = async (action: QuizAction) => {
    if (answered || !scenario) return;
    stopTimer();

    const isCorrect = action === scenario.correctAction;
    const timeSpentMs = Date.now() - questionStart.current;

    setAnswered(action);
    const newPlayed = [...played, scenario.id];
    setPlayed(newPlayed);

    setStats(prev => {
      const streak = isCorrect ? prev.streak + 1 : 0;
      return {
        answered: prev.answered + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
        streak,
        bestStreak: Math.max(prev.bestStreak, streak),
      };
    });

    try {
      await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCorrect, timeSpentMs }),
      });
    } catch {}
  };

  if (!scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050A14" }}>
        <div className="text-yellow-500 animate-pulse font-bold tracking-widest">LOADING...</div>
      </div>
    );
  }

  const isCorrect = answered !== null && answered === scenario.correctAction;
  const accuracy = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : null;

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-8"
      style={{ background: "linear-gradient(160deg, #020810 0%, #050A14 100%)" }}
    >
      {/* Header */}
      <div className="w-full max-w-xl flex items-center justify-between mb-6">
        <Link
          href="/"
          className="text-gray-500 hover:text-yellow-400 transition-colors text-xs font-bold uppercase tracking-widest border border-gray-700 hover:border-yellow-700 px-3 py-2 rounded-lg"
        >
          ← Back
        </Link>
        <div className="text-center">
          <h1 className="text-base font-black uppercase tracking-[0.2em]" style={{ color: "#c9a84c" }}>
            Pre-flop Quiz
          </h1>
          <p className="text-gray-600 text-[10px] tracking-widest uppercase">6-max Texas Hold'em</p>
        </div>
        <Link
          href="/stats"
          className="text-gray-500 hover:text-yellow-400 transition-colors text-xs font-bold uppercase tracking-widest border border-gray-700 hover:border-yellow-700 px-3 py-2 rounded-lg"
        >
          Stats →
        </Link>
      </div>

      {/* Session stats */}
      <div className="w-full max-w-xl grid grid-cols-4 gap-2 mb-5">
        {[
          { label: "Asked", value: String(stats.answered), color: "#c9a84c" },
          { label: "Correct", value: stats.answered ? `${stats.correct}/${stats.answered}` : "—", color: "#4ade80" },
          {
            label: "Accuracy",
            value: accuracy !== null ? `${accuracy}%` : "—",
            color: accuracy === null ? "#c9a84c" : accuracy >= 70 ? "#4ade80" : accuracy >= 50 ? "#fcd34d" : "#f87171",
          },
          {
            label: "Streak 🔥",
            value: String(stats.streak),
            color: stats.streak >= 5 ? "#f59e0b" : stats.streak >= 3 ? "#fcd34d" : "#c9a84c",
          },
        ].map(s => (
          <div
            key={s.label}
            className="px-2 py-2 rounded-xl text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="text-[9px] text-gray-600 uppercase tracking-widest font-bold mb-0.5">{s.label}</div>
            <div className="text-sm font-black" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div
        className="w-full max-w-xl rounded-3xl p-6"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Situation header */}
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Situation</div>
            <div className="text-yellow-400 font-black text-sm uppercase tracking-wider">
              {getSituationLabel(scenario.situation)}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="px-3 py-1.5 rounded-xl text-center"
              style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)" }}
            >
              <div className="text-[9px] text-yellow-700 uppercase tracking-widest font-bold">Position</div>
              <div className="text-yellow-400 font-black text-xl leading-none mt-0.5">{scenario.position}</div>
            </div>
            <div
              className="px-2.5 py-1.5 rounded-xl text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="text-[9px] text-gray-600 uppercase tracking-widest font-bold">Stack</div>
              <div className="text-white font-black text-sm">{scenario.stackBB}BB</div>
            </div>
            <div
              className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                scenario.difficulty === "easy"
                  ? "text-green-400 bg-green-900/20 border border-green-900"
                  : scenario.difficulty === "medium"
                  ? "text-yellow-400 bg-yellow-900/20 border border-yellow-900"
                  : "text-red-400 bg-red-900/20 border border-red-900"
              }`}
            >
              {scenario.difficulty}
            </div>
          </div>
        </div>

        {/* Scenario description */}
        <p className="text-gray-400 text-sm leading-relaxed mb-6">{describeSituation(scenario)}</p>

        {/* Hole cards + timer */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <BigCard card={scenario.holeCards[0]} />
          <BigCard card={scenario.holeCards[1]} />
          <div className="text-right">
            <div className="text-[9px] text-gray-600 uppercase tracking-widest font-bold mb-1">Timer</div>
            <div className="text-2xl font-black tabular-nums" style={{ color: elapsed > 15 ? "#f87171" : "#c9a84c" }}>
              {elapsed}s
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {!answered ? (
          <div className="grid grid-cols-3 gap-3">
            {(["fold", "call", "raise"] as QuizAction[]).map(action => {
              const cfg = ACTION_CONFIG[action];
              return (
                <button
                  key={action}
                  onClick={() => handleAnswer(action)}
                  className={`py-4 rounded-2xl font-black uppercase tracking-wider text-sm bg-gradient-to-br ${cfg.bg} border ${cfg.border} transition-all hover:brightness-125 active:scale-95`}
                >
                  <div className="text-2xl mb-1">{cfg.icon}</div>
                  <div className="text-white text-xs">{cfg.label}</div>
                </button>
              );
            })}
          </div>
        ) : (
          <>
            {/* Feedback */}
            <div
              className={`rounded-2xl p-5 mb-4 ${
                isCorrect
                  ? "bg-green-950 border border-green-800"
                  : "bg-red-950 border border-red-800"
              }`}
            >
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div className={`text-xl font-black ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                  {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
                </div>
                {!isCorrect && (
                  <div className="text-gray-300 text-sm">
                    Correct:{" "}
                    <span className="font-black text-yellow-400">
                      {ACTION_CONFIG[scenario.correctAction].label}
                    </span>
                  </div>
                )}
                <div className="ml-auto text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                  {elapsed}s
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{scenario.explanation}</p>
              <div className="mt-3 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                Concept: {scenario.concept}
              </div>
            </div>

            {/* Next button */}
            <button
              onClick={() => loadNextScenario(played)}
              className="w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #78350f, #c9a84c, #78350f)",
                color: "#000",
                boxShadow: "0 4px 20px rgba(201,168,76,0.25)",
              }}
            >
              Next Hand →
            </button>
          </>
        )}
      </div>

      {/* Position description */}
      <div className="w-full max-w-xl mt-4 text-center">
        <p className="text-gray-700 text-[10px] leading-relaxed">{POSITION_DESC[scenario.position]}</p>
      </div>

      {/* Best streak */}
      {stats.bestStreak > 0 && (
        <div className="mt-4 text-center text-[10px] text-gray-700 font-bold uppercase tracking-widest">
          Best streak this session: {stats.bestStreak}
        </div>
      )}
    </main>
  );
}
