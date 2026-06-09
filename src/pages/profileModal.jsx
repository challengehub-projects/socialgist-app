// ProfileModal.jsx

import React, { useEffect } from "react";
import {
  X,
  MessageCircle,
  User2,
  ChevronRight,
  UserPlus,
  UserCheck,
} from "lucide-react";

export default function ProfileModal({
  open,
  onClose,
  profile,
  onNavigate,
  isFollowing = false,
  onFollowToggle,
}) {
  // ESC CLOSE
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!open) return null;

  const username =
    profile?.profile_name
      ?.replace(/\s+/g, "")
      .toLowerCase() || "user";

  return (
    <div className="fixed inset-0 z-[99999] flex items-end justify-center">

      {/* BACKDROP */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />

      {/* SHEET */}
      <div className="relative w-full h-[88vh] rounded-t-[40px] overflow-hidden shadow-[0_-10px_60px_rgba(0,0,0,0.6)] bg-gradient-to-b from-[#1b002f] via-[#4a0ea3] to-[#7a2cf5] flex flex-col">

        {/* glow */}
        <div className="absolute top-0 left-0 w-full h-72 bg-white/10 blur-3xl opacity-40" />

        {/* HANDLE */}
        <div className="relative z-20 flex justify-center pt-3">
          <div className="w-20 h-1.5 rounded-full bg-white/30" />
        </div>

        {/* CLOSE */}
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={onClose}
            className="h-11 w-11 rounded-full bg-white/10 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white active:scale-95 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="relative z-20 flex-1 overflow-y-auto px-6 pt-10 pb-10 flex flex-col items-center text-center">

          {/* AVATAR */}
          {profile?.profile_image ? (
            <img
              src={profile.profile_image}
              alt={profile.profile_name || "User"}
              className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-[0_10px_40px_rgba(255,255,255,0.25)]"
            />
          ) : (
            <div className="w-36 h-36 rounded-full bg-white/15 border-4 border-white flex items-center justify-center text-white text-6xl font-black shadow-2xl">
              {(profile?.profile_name || "U").charAt(0).toUpperCase()}
            </div>
          )}

          {/* NAME */}
          <h1 className="mt-6 text-4xl font-black text-white break-words">
            {profile?.profile_name || "Anonymous User"}
          </h1>

          {/* USERNAME */}
          <p className="text-white/70 text-sm mt-2">
            @{username}
          </p>

          {/* BIO */}
          <p className="text-white/85 text-sm mt-6 max-w-sm leading-relaxed">
            {profile?.bio ||
              "This user hasn’t added a bio yet."}
          </p>

          {/* STATS CARD */}
          <div className="w-full mt-8 rounded-[32px] bg-white/10 border border-white/10 backdrop-blur-2xl p-6 text-left">

            <div className="flex items-center gap-2 text-white mb-4">
              <User2 size={18} />
              <span className="font-black text-lg">
                About
              </span>
            </div>

            <div className="text-white/85 text-sm space-y-2">
              <p>
                Posts:{" "}
                <span className="font-bold">
                  {profile?.posts ?? 0}
                </span>
              </p>

              <p>
                Followers:{" "}
                <span className="font-bold">
                  {profile?.followers ?? 0}
                </span>
              </p>

              <p>
                Following:{" "}
                <span className="font-bold">
                  {profile?.following ?? 0}
                </span>
              </p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="w-full flex items-center gap-4 mt-8">

            {/* MESSAGE */}
            <button
              onClick={() =>
                onNavigate?.("messages", profile)
              }
              className="flex-1 h-16 rounded-3xl bg-white text-purple-700 font-black flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition"
            >
              <MessageCircle size={22} />
              <span>Message</span>
            </button>

            {/* FOLLOW */}
            <button
              onClick={() => onFollowToggle?.(profile)}
              className="flex-1 h-16 rounded-3xl bg-black/20 border border-white/10 backdrop-blur-2xl text-white font-black flex items-center justify-center gap-3 active:scale-95 transition"
            >
              {isFollowing ? (
                <>
                  <UserCheck size={22} />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus size={22} />
                  <span>Follow</span>
                </>
              )}
            </button>
          </div>

          {/* VIEW FULL PROFILE */}
          <button
            onClick={() => onNavigate?.("profile", profile)}
            className="mt-6 flex items-center gap-2 text-white/80 hover:text-white transition active:scale-95"
          >
            <span className="font-semibold">
              View full profile
            </span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}