"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    // Auto sign-in after register
    const signInRes = await signIn("credentials", {
      login: email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (signInRes?.error) {
      router.push("/login");
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
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Start your poker training journey</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl text-sm text-white font-medium outline-none transition-all focus:ring-2 focus:ring-yellow-500/50"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-4 py-3 rounded-xl text-sm text-white font-medium outline-none transition-all focus:ring-2 focus:ring-yellow-500/50"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              placeholder="amalio1000"
            />
            <p className="text-gray-600 text-[10px] mt-1.5">Letters, numbers, and underscores only</p>
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
              autoComplete="new-password"
              minLength={6}
              className="w-full px-4 py-3 rounded-xl text-sm text-white font-medium outline-none transition-all focus:ring-2 focus:ring-yellow-500/50"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              placeholder="At least 6 characters"
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
            {loading ? "Creating account..." : "Create Account →"}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-8">
          Already have an account?{" "}
          <Link href="/login" className="font-bold hover:text-yellow-400 transition-colors" style={{ color: "#c9a84c" }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
