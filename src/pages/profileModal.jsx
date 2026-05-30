// ProfileModal.jsx

import React, {
  useEffect,
} from "react";

import {
  X,
  MessageCircle,
  User2,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export default function ProfileModal({
  open,
  onClose,
  profile,
  onNavigate,
}) {
  // CLOSE ON ESC

  useEffect(() => {
    const handleKey =
      (e) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

    window.addEventListener(
      "keydown",
      handleKey
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKey
      );
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-end justify-center">

      {/* BACKDROP */}

      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fadeIn"
      />

      {/* MODAL */}

      <div className="relative w-full h-[90vh] rounded-t-[40px] overflow-hidden animate-slideUp shadow-[0_-10px_60px_rgba(0,0,0,0.6)] bg-gradient-to-b from-[#23003b] via-[#5b0ea8] to-[#8b2cf5] flex flex-col">

        {/* TOP GLOW */}

        <div className="absolute top-0 left-0 w-full h-72 bg-white/10 blur-3xl opacity-40" />

        {/* HANDLE */}

        <div className="relative z-20 flex justify-center pt-3">
          <div className="w-20 h-1.5 rounded-full bg-white/30" />
        </div>

        {/* HEADER */}

        <div className="relative z-20 flex items-center justify-between px-5 mt-4">

          {/* APP */}

          <div className="flex items-center gap-3">

            <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center">

              <Sparkles
                size={22}
                className="text-white"
              />

            </div>

            <div>
              <h1 className="text-white text-2xl font-black leading-none">
                SocialGist
              </h1>

              <p className="text-white/60 text-xs mt-1">
                connect • vibe • gist
              </p>
            </div>

          </div>

          {/* CLOSE */}

          <button
            onClick={onClose}
            className="h-11 w-11 rounded-full bg-white/10 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white active:scale-95 transition"
          >
            <X size={20} />
          </button>

        </div>

        {/* CONTENT */}

        <div className="relative z-20 flex-1 overflow-y-auto px-6 pt-10 pb-10 flex flex-col items-center text-center">

          {/* PROFILE IMAGE */}

          {profile?.profile_image ? (
            <img
              src={
                profile.profile_image
              }
              alt=""
              className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-[0_10px_40px_rgba(255,255,255,0.25)]"
            />
          ) : (
            <div className="w-36 h-36 rounded-full bg-white/15 border-4 border-white flex items-center justify-center text-white text-6xl font-black shadow-2xl">
              {(
                profile?.profile_name ||
                "U"
              )
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          {/* NAME */}

          <h1 className="mt-6 text-4xl font-black text-white break-words">
            {profile?.profile_name ||
              "Anonymous"}
          </h1>

          {/* USERNAME */}

          <p className="text-white/70 text-sm mt-2">
            @
            {(
              profile?.profile_name ||
              "user"
            )
              .replace(/\s+/g, "")
              .toLowerCase()}
          </p>

          {/* CARD */}

          <div className="w-full mt-8 rounded-[32px] bg-white/10 border border-white/10 backdrop-blur-2xl p-6">

            <div className="flex items-center gap-2 text-white mb-4">

              <User2 size={18} />

              <span className="font-black text-lg">
                Profile
              </span>

            </div>

            <p className="text-sm leading-relaxed text-white/85 text-left">
              Welcome to this
              SocialGist profile.
              Connect, vibe,
              gist, share moments
              and explore the
              community together.
            </p>

          </div>

          {/* ACTION BUTTONS */}

          <div className="w-full flex items-center gap-4 mt-8">

            {/* MESSAGE */}

            <button
              onClick={() =>
                
                onNavigate(
                  "messages"
                )
              }
              className="flex-1 h-16 rounded-3xl bg-white text-purple-700 font-black flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition"
            >

              <MessageCircle
                size={22}
              />

              <span className="text-base">
                Message
              </span>

            </button>

            {/* VIEW PROFILE */}

            <button
              onClick={() =>
                onNavigate(
                  "profile"
                )
              }
              className="flex-1 h-16 rounded-3xl bg-black/20 border border-white/10 backdrop-blur-2xl text-white font-black flex items-center justify-center gap-3 active:scale-95 transition"
            >

              <ChevronRight
                size={22}
              />

              <span className="text-base">
                View Profile
              </span>

            </button>

          </div>

        </div>
      </div>

      {/* ANIMATIONS */}

      <style>{`
        .animate-slideUp {
          animation: slideUp 0.4s
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            );
        }

        .animate-fadeIn {
          animation: fadeIn 0.25s
            ease;
        }

        @keyframes slideUp {
          from {
            transform: translateY(
              100%
            );
          }

          to {
            transform: translateY(
              0
            );
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}