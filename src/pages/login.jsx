import React, { useState } from "react";

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

import { supabase } from "../configs/supbase";

export default function LoginPage({ onNavigate }) {

  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ================= LOGIN =================

  const handleLogin = async (e) => {

    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      onNavigate("feed");

    } catch (err) {

      setError(err.message || "Unable to login");

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className="min-h-screen bg-[#faf7ff] flex items-center justify-center px-5 py-10 overflow-hidden relative">

      {/* BACKGROUND GLOW */}
      <div className="absolute top-[-100px] right-[-100px] w-[250px] h-[250px] bg-purple-300/30 blur-3xl rounded-full" />

      <div className="absolute bottom-[-100px] left-[-100px] w-[250px] h-[250px] bg-fuchsia-300/20 blur-3xl rounded-full" />

      {/* CARD */}
      <div className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-xl border border-purple-100 rounded-[32px] shadow-2xl shadow-purple-200/40 p-7">

        {/* LOGO */}
        <div className="flex flex-col items-center text-center mb-8">

          <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-300/40 mb-5">

            <img
              src="/icon.png"
              alt="logo"
              className="w-10 h-10"
            />

          </div>

          <h1 className="text-3xl font-black tracking-tight text-purple-950">
            Welcome Back
          </h1>

          <p className="text-sm text-purple-500 mt-2 leading-6 max-w-xs">
            Sign in to continue exploring campus conversations,
            confessions and trending gists.
          </p>

        </div>

        {/* FORM */}
        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >

          {/* EMAIL */}
          <div>

            <label className="text-xs font-bold uppercase text-purple-500 tracking-wide">
              Email Address
            </label>

            <div className="relative mt-2">

              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-purple-50 border border-purple-100 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all"
              />

            </div>

          </div>

          {/* PASSWORD */}
          <div>

            <label className="text-xs font-bold uppercase text-purple-500 tracking-wide">
              Password
            </label>

            <div className="relative mt-2">

              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />

              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-14 pl-12 pr-14 rounded-2xl bg-purple-50 border border-purple-100 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400"
              >

                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}

              </button>

            </div>

          </div>

          {/* ERROR */}
          {error && (

            <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-2xl">
              {error}
            </div>

          )}

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-300/40 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-70"
          >

            {loading ? "Signing in..." : "Sign In"}

            {!loading && <ArrowRight size={18} />}

          </button>

        </form>

        {/* FOOTER */}
        <div className="mt-7 text-center">

          <p className="text-sm text-purple-500">

            Don’t have an account?{" "}

            <button
              onClick={() => onNavigate("signup")}
              className="text-purple-700 font-semibold"
            >
              Create account
            </button>

          </p>

        </div>

      </div>

    </div>
  );
}