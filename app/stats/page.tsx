"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface Stats {
  id: string;
  totalHands: number;
  handsWon: number;
  handsLost: number;
  handsFolded: number;
  totalProfit: number;
  biggestPot: number;
  biggestWin: number;
  vpipHands: number;
  pfrHands: number;
  advisorFollowed: number;
  advisorShown: number;
  sessionsPlayed: number;
  correctDecisions: number;
  totalDecisions: number;
  totalPlaytimeSeconds: number;
  quizAnswered: number;
  quizCorrect: number;
  quizPlaytimeSeconds: number;
}

function formatPlaytime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

interface Hand {
  id: string;
  handNumber: number;
  holeCards: string;
  communityCards: string;
  position: string;
  result: string;
  profitLoss: number;
  potSize: number;
  handStrength?: string;
  playerAction: string;
  createdAt: string;
}

interface Session {
  id: string;
  startedAt: string;
  endedAt?: string;
  mode: string;
  handsPlayed: number;
  profit: number;
  startStack: number;
  finalStack: number;
  hands: Hand[];
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div
      className="p-4 rounded-2xl flex flex-col gap-1"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
      <span className="text-2xl font-black" style={{ color: color ?? "#c9a84c" }}>{value}</span>
      {sub && <span className="text-[10px] text-gray-600">{sub}</span>}
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(data => {
        setStats(data.stats);
        setSessions(data.sessions ?? []);
        if (data.sessions?.length) setActiveSession(data.sessions[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Build profit chart from session hands
  const chartData = activeSession
    ? activeSession.hands.reduce<{ hand: number; profit: number }[]>((acc, h, i) => {
        const prev = acc[i - 1]?.profit ?? 0;
        acc.push({ hand: h.handNumber, profit: prev + h.profitLoss });
        return acc;
      }, [])
    : [];

  const winRate = stats?.totalHands
    ? Math.round((stats.handsWon / stats.totalHands) * 100)
    : 0;
  const vpip = stats?.totalHands
    ? Math.round((stats.vpipHands / stats.totalHands) * 100)
    : 0;
  const pfr = stats?.totalHands
    ? Math.round((stats.pfrHands / stats.totalHands) * 100)
    : 0;
  const advisorRate = stats?.advisorShown
    ? Math.round((stats.advisorFollowed / stats.advisorShown) * 100)
    : null;
  const decisionAccuracy = stats?.totalDecisions
    ? Math.round((stats.correctDecisions / stats.totalDecisions) * 100)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050A14" }}>
        <div className="text-yellow-500 animate-pulse font-bold tracking-widest">LOADING STATS...</div>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen px-6 py-10"
      style={{ background: "linear-gradient(160deg, #020810 0%, #050A14 100%)" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-[0.15em]" style={{ color: "#c9a84c" }}>
              Your Stats
            </h1>
            <p className="text-gray-500 text-xs mt-1">{stats?.sessionsPlayed ?? 0} sessions · {stats?.totalHands ?? 0} hands played</p>
          </div>
          <Link
            href="/home"
            className="text-gray-500 hover:text-yellow-400 transition-colors text-xs font-bold uppercase tracking-widest border border-gray-700 hover:border-yellow-700 px-4 py-2 rounded-lg"
          >
            ← Play
          </Link>
        </div>

        {!stats || stats.totalHands === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">♠</div>
            <p className="text-gray-500 text-sm">No hands played yet.</p>
            <Link href="/home" className="mt-4 inline-block text-yellow-500 font-bold text-sm hover:text-yellow-400">
              Start Playing →
            </Link>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <StatCard label="Hands Played" value={`${stats.totalHands}`} sub={`${stats.sessionsPlayed} sessions`} color="#c9a84c" />
              <StatCard label="Win Rate" value={`${winRate}%`} sub={`${stats.handsWon}W / ${stats.handsLost}L`} color={winRate > 50 ? "#86efac" : winRate > 40 ? "#fcd34d" : "#fca5a5"} />
              <StatCard label="Total Profit" value={`${stats.totalProfit >= 0 ? "+" : ""}$${stats.totalProfit.toLocaleString()}`} color={stats.totalProfit >= 0 ? "#86efac" : "#fca5a5"} />
              {decisionAccuracy !== null
                ? <StatCard label="Decision Accuracy" value={`${decisionAccuracy}%`} sub={`${stats.correctDecisions}/${stats.totalDecisions} correct`} color={decisionAccuracy >= 70 ? "#86efac" : decisionAccuracy >= 50 ? "#fcd34d" : "#fca5a5"} />
                : <StatCard label="VPIP" value={`${vpip}%`} sub="Voluntarily in pot" color="#c084fc" />
              }
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <StatCard label="VPIP" value={`${vpip}%`} sub="Voluntarily in pot" color="#c084fc" />
              <StatCard label="PFR" value={`${pfr}%`} sub="Preflop raise %" color="#67e8f9" />
              <StatCard label="Biggest Pot" value={`$${stats.biggestPot.toLocaleString()}`} />
              <StatCard
                label="Time Played"
                value={formatPlaytime(stats.totalPlaytimeSeconds ?? 0)}
                sub={`${stats.sessionsPlayed} session${stats.sessionsPlayed !== 1 ? "s" : ""}`}
                color="#a78bfa"
              />
            </div>

            {/* Quiz stats */}
            {(stats.quizAnswered ?? 0) > 0 && (
              <div
                className="p-5 rounded-2xl mb-8"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🃏</span>
                  <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Pre-flop Quiz</h2>
                  <a href="/quiz" className="ml-auto text-[10px] text-yellow-600 hover:text-yellow-400 font-bold uppercase tracking-widest transition-colors">
                    Practice →
                  </a>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <StatCard
                    label="Questions"
                    value={`${stats.quizAnswered}`}
                    color="#c9a84c"
                  />
                  <StatCard
                    label="Quiz Accuracy"
                    value={`${Math.round((stats.quizCorrect / stats.quizAnswered) * 100)}%`}
                    sub={`${stats.quizCorrect}/${stats.quizAnswered} correct`}
                    color={
                      Math.round((stats.quizCorrect / stats.quizAnswered) * 100) >= 70
                        ? "#86efac"
                        : Math.round((stats.quizCorrect / stats.quizAnswered) * 100) >= 50
                        ? "#fcd34d"
                        : "#fca5a5"
                    }
                  />
                  <StatCard
                    label="Quiz Time"
                    value={formatPlaytime(stats.quizPlaytimeSeconds ?? 0)}
                    color="#a78bfa"
                  />
                </div>
              </div>
            )}

            {/* Profit chart */}
            {chartData.length > 1 && (
              <div
                className="p-5 rounded-2xl mb-8"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Profit / Loss — Current Session</h2>
                  <div className="flex gap-2">
                    {sessions.slice(0, 5).map(s => (
                      <button
                        key={s.id}
                        onClick={() => setActiveSession(s)}
                        className={`text-[9px] font-bold px-2 py-1 rounded transition-colors ${activeSession?.id === s.id ? "bg-yellow-700 text-black" : "bg-gray-800 text-gray-500 hover:bg-gray-700"}`}
                      >
                        #{s.id.slice(-4)}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="hand" tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip
                      contentStyle={{ background: "#0a1020", border: "1px solid #374151", borderRadius: 8, fontSize: 11 }}
                      labelStyle={{ color: "#9ca3af" }}
                      formatter={(v: number) => [`$${v.toLocaleString()}`, "P/L"]}
                    />
                    <ReferenceLine y={0} stroke="#374151" strokeDasharray="4 2" />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#c9a84c"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: "#c9a84c" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Recent hands */}
            {activeSession && activeSession.hands.length > 0 && (
              <div
                className="p-5 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Recent Hands</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-600 text-[10px] uppercase tracking-widest">
                        <th className="pb-2 text-left font-bold">#</th>
                        <th className="pb-2 text-left font-bold">Cards</th>
                        <th className="pb-2 text-left font-bold">Pos</th>
                        <th className="pb-2 text-left font-bold">Action</th>
                        <th className="pb-2 text-left font-bold">Result</th>
                        <th className="pb-2 text-right font-bold">P/L</th>
                        <th className="pb-2 text-left font-bold">Hand</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...activeSession.hands].reverse().slice(0, 20).map(h => {
                        const cards = JSON.parse(h.holeCards) as string[];
                        const pl = h.profitLoss;
                        return (
                          <tr key={h.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                            <td className="py-1.5 text-gray-600">{h.handNumber}</td>
                            <td className="py-1.5 font-mono font-bold text-white">{cards.join(" ")}</td>
                            <td className="py-1.5 text-gray-400">{h.position}</td>
                            <td className="py-1.5 text-gray-400 uppercase">{h.playerAction}</td>
                            <td className="py-1.5">
                              <span className={`font-bold uppercase ${h.result === "won" ? "text-green-400" : h.result === "folded" ? "text-gray-500" : "text-red-400"}`}>
                                {h.result}
                              </span>
                            </td>
                            <td className={`py-1.5 text-right font-mono font-bold ${pl >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {pl >= 0 ? "+" : ""}${pl.toLocaleString()}
                            </td>
                            <td className="py-1.5 text-gray-600 text-[10px]">{h.handStrength ?? "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
