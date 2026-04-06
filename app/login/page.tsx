"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LoginPage = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-10 shadow-md">

        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-11 h-11 bg-ink rounded-lg flex items-center justify-center font-serif text-canvas text-sm tracking-wide">
            IG
          </div>
          <h1 className="font-serif text-2xl text-ink">Interval Guard</h1>
          <p className="text-sm text-muted">AI-Verified Outreach Platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[13px] font-medium text-ink">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-canvas text-ink text-sm outline-none focus:border-ink transition-colors placeholder:text-faint"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[13px] font-medium text-ink">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-canvas text-ink text-sm outline-none focus:border-ink transition-colors placeholder:text-faint"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="px-3 py-2.5 bg-danger-light border border-danger-mid rounded-md text-danger text-[13px]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 py-2.5 bg-ink text-canvas text-sm font-medium rounded-md cursor-pointer hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-faint">
          Interval AI — Compliance-Grade Collections Outreach
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
