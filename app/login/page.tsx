"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      login,
      password,
      redirect: false,
    });

    setLoading(false);
    if (res?.error) {
      setError("Invalid email/username or password.");
    } else {
      router.push("/home");
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(160deg, #020810 0%, #050A14 50%, #040d1a 100%)" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">♠</span>
            <span className="font-black uppercase tracking-[0.2em] text-sm" style={{ color: "#c9a84c" }}>
              Poker Training
            </span>
          </Link>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Email or Username
            </label>
            <input
              type="text"
              value={login}
              onChange={e => setLogin(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-4 py-3 rounded-xl text-sm text-white font-medium outline-none transition-all focus:ring-2 focus:ring-yellow-500/50"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              placeholder="amalio1000 or you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl text-sm text-white font-medium outline-none transition-all focus:ring-2 focus:ring-yellow-500/50"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs font-medium text-center py-2 px-3 rounded-lg" style={{ background: "rgba(239,68,68,0.1)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all active:scale-95 hover:brightness-110 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #78350f, #c9a84c, #78350f)",
              backgroundSize: "200% 100%",
              color: "#000",
              boxShadow: "0 4px 20px rgba(201,168,76,0.3)",
            }}
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-8">
          No account?{" "}
          <Link href="/register" className="font-bold hover:text-yellow-400 transition-colors" style={{ color: "#c9a84c" }}>
            Register here
          </Link>
        </p>
      </div>
    </main>
  );
}
