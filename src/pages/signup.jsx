import React, { useState } from "react";
import {
  Mail,
  Lock,
  User,
  Phone,
  Sparkles,
  School,
  Users,
  Globe,
} from "lucide-react";
import { supabase } from "../configs/supbase";

export default function SignupPage({ onNavigate }) {
  const [method, setMethod] = useState("email");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (method === "email") {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: form.fullName,
            },
          },
        });

        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          phone: form.phone,
        });

        if (error) throw error;
      }

      onNavigate("login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-100 via-white to-fuchsia-100 p-6">

      {/* BACKGROUND OBJECTS (social vibe) */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-purple-300 rounded-full blur-3xl opacity-40" />
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-fuchsia-300 rounded-full blur-3xl opacity-40" />
      <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-indigo-200 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2" />

      {/* FLOATING ICONS */}
      <div className="absolute top-20 right-20 text-purple-400 opacity-40">
        <Users size={40} />
      </div>
      <div className="absolute bottom-20 left-20 text-fuchsia-400 opacity-40">
        <Globe size={40} />
      </div>

      {/* MAIN CARD */}
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8 z-10">

        {/* HEADER */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg">
              <School />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-purple-950">
            Join ScoilGist
          </h1>

          <p className="text-sm text-purple-500 mt-2">
            Connect. Share. Discover your campus world ✨
          </p>

          <div className="flex justify-center mt-3 text-purple-400">
            <Sparkles size={16} />
          </div>
        </div>

        {/* METHOD TOGGLE */}
        <div className="flex bg-purple-50 rounded-2xl p-1 mb-6">
          <button
            onClick={() => setMethod("email")}
            className={`flex-1 py-2 text-sm rounded-xl flex items-center justify-center gap-1 ${
              method === "email"
                ? "bg-white shadow text-purple-700"
                : "text-purple-400"
            }`}
          >
            <Mail size={14} /> Email
          </button>

          <button
            onClick={() => setMethod("phone")}
            className={`flex-1 py-2 text-sm rounded-xl flex items-center justify-center gap-1 ${
              method === "phone"
                ? "bg-white shadow text-purple-700"
                : "text-purple-400"
            }`}
          >
            <Phone size={14} /> Phone
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSignup} className="space-y-4">

          {/* NAME */}
          <div className="relative">
            <User className="absolute left-4 top-3 text-purple-400 w-4 h-4" />
            <input
              name="fullName"
              placeholder="Your full name"
              onChange={handleChange}
              className="w-full pl-10 p-3 rounded-2xl bg-white/60 border border-purple-100 focus:outline-none"
            />
          </div>

          {/* EMAIL / PHONE */}
          {method === "email" ? (
            <div className="relative">
              <Mail className="absolute left-4 top-3 text-purple-400 w-4 h-4" />
              <input
                name="email"
                placeholder="University email"
                onChange={handleChange}
                className="w-full pl-10 p-3 rounded-2xl bg-white/60 border border-purple-100"
              />
            </div>
          ) : (
            <div className="relative">
              <Phone className="absolute left-4 top-3 text-purple-400 w-4 h-4" />
              <input
                name="phone"
                placeholder="+234 phone number"
                onChange={handleChange}
                className="w-full pl-10 p-3 rounded-2xl bg-white/60 border border-purple-100"
              />
            </div>
          )}

          {/* PASSWORD */}
          <div className="relative">
            <Lock className="absolute left-4 top-3 text-purple-400 w-4 h-4" />
            <input
              name="password"
              type="password"
              placeholder="Create password"
              onChange={handleChange}
              className="w-full pl-10 p-3 rounded-2xl bg-white/60 border border-purple-100"
            />
          </div>

          {/* ERROR */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">
              {error}
            </div>
          )}

          {/* BUTTON */}
          <button
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white py-3 rounded-2xl font-semibold shadow-lg active:scale-[0.98]"
          >
            {loading ? "Creating your space..." : "Create account"}
          </button>
        </form>

        {/* FOOTER */}
        <p className="text-center text-sm mt-6 text-purple-500">
          Already part of ScoilGist?{" "}
          <button
            onClick={() => onNavigate("login")}
            className="text-purple-700 font-semibold"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}