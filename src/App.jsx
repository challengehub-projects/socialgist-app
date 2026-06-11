// ================= APP.JSX =================

import React, { useEffect, useState } from "react";

import { registerPush } from "./utils/registerPush";
import { initNotifications } from "./utils/notifications";
import { initChatDB } from "./utils/chatStorage";

import { supabase } from "./configs/supbase";

import { Network } from "@capacitor/network";
import { Toast } from "@capacitor/toast";
import { Capacitor } from "@capacitor/core";

import WelcomePage from "./pages/welcome";
import LoginPage from "./pages/login";
import SignupPage from "./pages/signup";

import HomeFeedPage from "./pages/feed";
import TopNavbar from "./pages/navbar";

import Messages from "./pages/messages";
import ProfilePage from "./pages/profile";
import ProfileModal from "./pages/profileModal";
import NotificationsPage from "./pages/notifications";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  const [page, setPage] = useState("welcome");
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // ================= AUTH =================

  useEffect(() => {
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session) {
        setPage("feed");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setSession(session);

    if (session) {
      setPage("feed");
      registerPush(session.user.id);
    }

    setLoading(false);
  };

  // ================= INIT =================

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      initChatDB();
    }

    initNotifications();
    Notification.requestPermission();
  }, []);

  // ================= NETWORK =================

  useEffect(() => {
    let firstRun = true;

    const setupNetwork = async () => {
      Network.addListener("networkStatusChange", async (status) => {
        if (firstRun) {
          firstRun = false;
          return;
        }

        await Toast.show({
          text: status.connected
            ? "You're back online"
            : "You're offline",
          duration: "short",
          position: "bottom",
        });
      });
    };

    setupNetwork();
  }, []);

  // ================= NAV =================

  const openMessages = (post) => {
    setSelectedPost(post);
    setPage("messages");
  };

  const openNotif = (post) => {
    setSelectedPost(post);
    setPage("notifications");
  };


  // ================= SPLASH =================

  if (showSplash) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <img src="/icon.png" className="w-24 h-24 animate-pulse" />
          <h1 className="mt-4 text-2xl font-black text-purple-700">
            SocialGist
          </h1>
        </div>
      </div>
    );
  }

  // ================= LOADING =================

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <img src="/icon.png" className="w-24 h-24 animate-pulse" />
          <h1 className="mt-4 text-2xl font-black text-purple-700">
            SocialGist
          </h1>
        </div>
      </div>
    );
  }

  // ================= ROUTES =================

  if (page === "welcome") return <WelcomePage onNavigate={setPage} />;
  if (page === "login") return <LoginPage onNavigate={setPage} />;
  if (page === "signup") return <SignupPage onNavigate={setPage} />;
  if (page === "messages")
    return <Messages post={selectedPost} onBack={() => setPage("feed")} />;
  if (page === "profile") return <ProfilePage onNavigate={setPage} />;
  if (page === "profileModal") return <ProfileModal onNavigate={setPage} />;
  if (page === "notifications")
    return <NotificationsPage post={selectedPost} onBack={() => setPage("feed")} />;

  // ================= FEED FIX (IMPORTANT) =================

  return (
    <>
      <TopNavbar onOpenMessages={openMessages} onOpenNotif={openNotif} onNavigate={setPage} />

      {/* FEED IS ALWAYS MOUNTED (NO RELOAD ANYMORE) */}
      <div className={page === "feed" ? "block" : "hidden"}>
        <HomeFeedPage onOpenMessages={openMessages}  />
      </div>
    </>
  );
}