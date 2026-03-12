import Link from "next/link";

const FEATURES = [
  {
    icon: "🤖",
    title: "AI-Powered Opponents",
    desc: "Face off against 5 distinct AI personalities — TAG, LAG, Nit, Fish, and Maniac — each powered by a different language model.",
  },
  {
    icon: "💡",
    title: "Real-Time Advisor",
    desc: "Get pot odds and hand-strength hints on every decision. Learn when to fold, call, or raise with data-driven guidance.",
  },
  {
    icon: "🎯",
    title: "Training Mode",
    desc: "Every decision is scored. See what the advisor recommended, compare it to your choice, and track your accuracy over time.",
  },
  {
    icon: "📊",
    title: "Deep Stats",
    desc: "Track VPIP, PFR, win rate, biggest pots, profit curves, and decision accuracy across all your sessions.",
  },
  {
    icon: "🃏",
    title: "Pre-flop Quizzes",
    desc: "40+ GTO-based scenarios covering every position. Master the fundamentals before sitting at a live table.",
  },
  {
    icon: "📱",
    title: "Play Anywhere",
    desc: "Seamlessly switch between web and mobile. Your sessions, stats, and progress follow you across devices.",
  },
];

const TESTIMONIAL_SUITS = ["♠", "♥", "♦", "♣"];

export default function LandingPage() {
  return (
    <main
      className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #020810 0%, #050A14 50%, #040d1a 100%)" }}
    >
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♠</span>
          <span className="font-black uppercase tracking-[0.2em] text-sm" style={{ color: "#c9a84c" }}>
            Poker Training
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-bold text-gray-400 hover:text-white transition-colors px-4 py-2"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="text-sm font-black px-5 py-2 rounded-xl transition-all hover:brightness-110 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #78350f, #c9a84c)",
              color: "#000",
            }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-bold uppercase tracking-widest" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", color: "#c9a84c" }}>
          <span>✦</span> AI-Powered Texas Hold&apos;em Training
        </div>

        <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tight leading-none mb-6" style={{ color: "#fff" }}>
          Train Smarter.
          <br />
          <span style={{
            background: "linear-gradient(90deg, #c9a84c, #f5d78e, #c9a84c)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Play Better.
          </span>
        </h1>

        <p className="text-gray-400 max-w-xl text-lg leading-relaxed mb-10">
          Practice Texas Hold&apos;em against AI opponents powered by GPT, Gemini, DeepSeek, and more.
          Get real-time hints, decision feedback, and track every hand you play.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/register"
            className="px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-base transition-all active:scale-95 hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #78350f, #c9a84c, #78350f)",
              backgroundSize: "200% 100%",
              color: "#000",
              boxShadow: "0 4px 30px rgba(201,168,76,0.4), 0 0 60px rgba(201,168,76,0.1)",
            }}
          >
            Start Playing Free →
          </Link>
          <Link
            href="/login"
            className="px-10 py-4 rounded-2xl font-bold text-gray-400 hover:text-white transition-colors text-sm uppercase tracking-[0.15em] border border-white/10 hover:border-white/20"
          >
            I have an account
          </Link>
        </div>
      </section>

      {/* AI opponents preview */}
      <section className="px-8 pb-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs font-bold text-gray-600 uppercase tracking-[0.3em] mb-6">
            5 AI Opponents · Each Powered by a Different LLM
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            {[
              { name: "Viktor", style: "TAG", model: "Gemini / GPT", color: "from-red-900/60" },
              { name: "Maria", style: "LAG", model: "DeepSeek / Kimi", color: "from-orange-900/60" },
              { name: "Chen", style: "Nit", model: "GPT-4.1 / MiniMax", color: "from-cyan-900/60" },
              { name: "Sofia", style: "Fish", model: "Gemini / GPT", color: "from-pink-900/60" },
              { name: "James", style: "Maniac", model: "Kimi / Grok", color: "from-yellow-900/60" },
            ].map(ai => (
              <div
                key={ai.name}
                className={`flex flex-col items-center gap-1 px-4 py-3 rounded-2xl bg-gradient-to-b ${ai.color} to-transparent border border-white/5`}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm" style={{ background: "rgba(255,255,255,0.08)" }}>
                  {ai.name[0]}
                </div>
                <span className="text-white text-xs font-bold">{ai.name}</span>
                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#c9a84c" }}>{ai.style}</span>
                <span className="text-[9px] text-gray-500">{ai.model}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="px-8 py-16" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl font-black uppercase tracking-[0.1em] mb-2 text-white">
            Everything you need to improve
          </h2>
          <p className="text-center text-gray-500 text-sm mb-12">From beginner to winning player</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="p-5 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-black text-white text-sm uppercase tracking-wider mb-2">{f.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Game modes */}
      <section className="px-8 py-16" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-black uppercase tracking-[0.1em] mb-2 text-white">4 Ways to Train</h2>
          <p className="text-gray-500 text-sm mb-10">Pick the experience that matches your goals</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "♠", label: "Normal", desc: "Real game, no extra info", color: "from-gray-800 to-gray-700" },
              { icon: "👁", label: "Vision", desc: "See all players' hole cards", color: "from-purple-900 to-purple-800" },
              { icon: "💡", label: "Advisor", desc: "Real-time hints every decision", color: "from-blue-900 to-blue-800" },
              { icon: "🎯", label: "Training", desc: "Hints + scored decisions", color: "from-green-900 to-green-800" },
            ].map(m => (
              <div
                key={m.label}
                className={`p-4 rounded-2xl text-left bg-gradient-to-br ${m.color} border border-white/5`}
              >
                <div className="text-2xl mb-2">{m.icon}</div>
                <div className="font-black text-white text-sm uppercase tracking-wider mb-1">{m.label}</div>
                <div className="text-[11px] text-gray-300">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download App */}
      <section className="px-8 py-16" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-3xl mx-auto">
          <div
            className="flex flex-col sm:flex-row items-center gap-8 p-8 rounded-3xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-[10px] font-bold uppercase tracking-widest" style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80" }}>
                <span>▲</span> Android APK
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-3">
                Play on Your Phone
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-2">
                Install the Android app and play anywhere. Your account, sessions, and stats sync automatically between web and mobile.
              </p>
              <p className="text-gray-600 text-xs">
                Enable &quot;Install from unknown sources&quot; in Android settings before installing.
              </p>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-3">
              <a
                href="/PokerTraining.apk"
                download="PokerTraining.apk"
                className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-sm transition-all hover:brightness-110 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #14532d, #16a34a)",
                  color: "#fff",
                  boxShadow: "0 4px 20px rgba(22,163,74,0.3)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download APK
              </a>
              <span className="text-gray-600 text-[10px]">Android · ~66 MB</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-20 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div
          className="max-w-2xl mx-auto p-10 rounded-3xl"
          style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.06), rgba(201,168,76,0.02))", border: "1px solid rgba(201,168,76,0.15)" }}
        >
          <div className="flex justify-center gap-2 text-3xl mb-6">
            {TESTIMONIAL_SUITS.map((s, i) => (
              <span key={i} style={{ opacity: 0.3 + i * 0.17, color: i % 2 === 0 ? "#c9a84c" : "#fff" }}>{s}</span>
            ))}
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-4">
            Ready to sit at the table?
          </h2>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">
            Create a free account in seconds. No credit card required.
            Your progress is saved and syncs across web and mobile.
          </p>
          <Link
            href="/register"
            className="inline-block px-12 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-base transition-all active:scale-95 hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #78350f, #c9a84c, #78350f)",
              backgroundSize: "200% 100%",
              color: "#000",
              boxShadow: "0 4px 30px rgba(201,168,76,0.4)",
            }}
          >
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 text-center border-t border-white/5">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-lg">♠</span>
          <span className="font-black text-xs uppercase tracking-[0.2em]" style={{ color: "#c9a84c" }}>Poker Training</span>
        </div>
        <p className="text-gray-700 text-xs">Practice · Improve · Win</p>
      </footer>
    </main>
  );
}
