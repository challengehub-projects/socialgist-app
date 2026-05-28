import React, { useEffect, useState } from "react";
import { supabase } from "./configs/supbase";
import { Network } from "@capacitor/network";
import { Toast } from "@capacitor/toast";

import WelcomePage from "./pages/welcome";
import LoginPage from "./pages/login";
import SignupPage from "./pages/signup";
import HomeFeedPage from "./pages/feed";
import TopNavbar from "./pages/navbar";

export default function App() {

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // APP ROUTES
  const [page, setPage] = useState("welcome");

  // ================= SPLASH =================

  useEffect(() => {

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);

  }, []);

  // ================= AUTH =================

  useEffect(() => {

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {

        setSession(session);

        if (session) {
          setPage("feed");
        }
      }
    );

    return () => subscription.unsubscribe();

  }, []);

  // ================= CHECK SESSION =================

  const checkSession = async () => {

    const {
      data: { session },
    } = await supabase.auth.getSession();

    setSession(session);

    if (session) {
      setPage("feed");
    }

    setLoading(false);
  };



  useEffect(() => {

    let firstRun = true;

    const setupNetwork =
      async () => {

        const status =
          await Network.getStatus();

        console.log(
          status.connected
        );

        Network.addListener(
          "networkStatusChange",

          async (status) => {

            if (firstRun) {
              firstRun = false;
              return;
            }

            if (
              status.connected
            ) {

              await Toast.show({
                text:
                  "You're back online",

                duration:
                  "short",

                position:
                  "bottom",
              });

            } else {

              await Toast.show({
                text:
                  "You're offline",

                duration:
                  "short",

                position:
                  "bottom",
              });

            }
          }
        );
      };

    setupNetwork();

  }, []);

  // ================= SPLASH SCREEN =================

  if (showSplash) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">

        <div className="flex flex-col items-center">

          <img
            src="/icon.png"
            alt="logo"
            className="w-24 h-24 animate-pulse"
          />

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
      <div className="h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  // ================= ROUTING =================

  if (page === "welcome") {
    return <WelcomePage onNavigate={setPage} />;
  }

  if (page === "login") {
    return <LoginPage onNavigate={setPage} />;
  }

  if (page === "signup") {
    return <SignupPage onNavigate={setPage} />;
  }

  return (
    <>
      <TopNavbar />
    </>
  )
}