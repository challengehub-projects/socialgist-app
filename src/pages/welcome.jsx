import React from "react";

import {
  MessageSquare,
  Flame,
  GraduationCap,
  Heart,
  ArrowRight,
  Shield,
  TrendingUp,
} from "lucide-react";

export default function WelcomePage({ onNavigate }) {

  return (
    <div className="min-h-screen bg-[#faf7ff] text-purple-950 flex flex-col overflow-hidden">

      {/* TOP GLOW */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-purple-200/40 to-transparent pointer-events-none" />

      {/* HEADER */}
      <header className="relative z-10 px-5 pt-6 flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-300/40">
            <img
              src="/icon.png"
              alt="logo"
              className="w-7 h-7"
            />
          </div>

          <div>
            <h1 className="font-black text-lg tracking-tight">
              SocialGist
            </h1>

            <p className="text-xs text-purple-500">
              Campus conversations reimagined
            </p>
          </div>

        </div>

        <button
          onClick={() => onNavigate("login")}
          className="text-sm font-semibold text-purple-700"
        >
          Sign in
        </button>

      </header>

      {/* MAIN */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 pb-10 pt-10">

        {/* BADGE */}
        <div className="mb-6">

          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 border border-purple-200 text-xs font-semibold text-purple-700">

            <TrendingUp size={14} />

            Africa's fastest growing campus platform

          </span>

        </div>

        {/* TITLE */}
        <h1 className="text-5xl leading-[1.05] font-black tracking-tight mb-6">

          Your campus.

          <span className="block bg-gradient-to-r from-purple-700 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">
            Your people.
          </span>

          <span className="block">
            Your gist.
          </span>

        </h1>

        {/* DESCRIPTION */}
        <p className="text-[15px] leading-7 text-purple-700/80 max-w-xl mb-10">

          Connect with students around you through anonymous discussions,
          trending campus stories, relationship conversations, confessions,
          memes, school updates and real-time social vibes happening on campus.

        </p>

        {/* CTA */}
        <div className="space-y-4">

          <button
            onClick={() => onNavigate("signup")}
            className="w-full h-14 rounded-2xl bg-purple-600 hover:bg-purple-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-white font-semibold shadow-xl shadow-purple-300/40"
          >

            Get Started

            <ArrowRight size={18} />

          </button>

          <button
            onClick={() => onNavigate("login")}
            className="w-full h-14 rounded-2xl border border-purple-200 bg-white font-medium text-purple-700 hover:bg-purple-50 transition-all"
          >

            I already have an account

          </button>

        </div>

        {/* FEATURES */}
        <div className="grid grid-cols-2 gap-4 mt-14">

          {/* CARD 1 */}
          <div className="bg-white border border-purple-100 rounded-3xl p-5 shadow-sm">

            <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
              <MessageSquare size={20} />
            </div>

            <h3 className="font-bold text-sm mb-2">
              Campus Gists
            </h3>

            <p className="text-xs leading-6 text-purple-500">
              Join conversations, react to trending stories and share what’s happening around school.
            </p>

          </div>

          {/* CARD 2 */}
          <div className="bg-white border border-purple-100 rounded-3xl p-5 shadow-sm">

            <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
              <GraduationCap size={20} />
            </div>

            <h3 className="font-bold text-sm mb-2">
              Student Community
            </h3>

            <p className="text-xs leading-6 text-purple-500">
              Meet students, discover school events and stay connected to campus life.
            </p>

          </div>

          {/* CARD 3 */}
          <div className="bg-white border border-purple-100 rounded-3xl p-5 shadow-sm">

            <div className="w-11 h-11 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mb-4">
              <Heart size={20} />
            </div>

            <h3 className="font-bold text-sm mb-2">
              Relationships
            </h3>

            <p className="text-xs leading-6 text-purple-500">
              Talk about love, dating, friendships and campus relationships safely.
            </p>

          </div>

          {/* CARD 4 */}
          <div className="bg-white border border-purple-100 rounded-3xl p-5 shadow-sm">

            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Flame size={20} />
            </div>

            <h3 className="font-bold text-sm mb-2">
              Anonymous Posts
            </h3>

            <p className="text-xs leading-6 text-purple-500">
              Share opinions, confessions and experiences without revealing your identity.
            </p>

          </div>

        </div>

        {/* SAFETY */}
        <div className="mt-10 flex items-start gap-3 p-4 rounded-2xl bg-white border border-purple-100">

          <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
            <Shield size={18} />
          </div>

          <div>

            <h4 className="font-semibold text-sm mb-1">
              Safe & private community
            </h4>

            <p className="text-xs leading-6 text-purple-500">
              Your identity stays protected while you interact, post and explore campus discussions.
            </p>

          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 py-6 text-center text-xs text-purple-400">

        © {new Date().getFullYear()} SocialGist Inc.

      </footer>

    </div>
  );
}