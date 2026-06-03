// ================= APP.JSX =================

import React, {
  useEffect,
  useState,
  lazy
} from "react";

import {
  registerPush,
} from "./utils/registerPush";

import {
  initNotifications,
  showNotification,
} from "./utils/notifications";

/* import initChatDB from "./utils/chatDB";

 */
/* import listenNotifications from "./utils/sendNotifications"; */


import { supabase } from "./configs/supbase";

import { Network } from "@capacitor/network";
import { Toast } from "@capacitor/toast";

import WelcomePage from "./pages/welcome";
import LoginPage from "./pages/login";
import SignupPage from "./pages/signup";

import HomeFeedPage from "./pages/feed";
import TopNavbar from "./pages/navbar";

import Messages from "./pages/messages";
import ProfilePage from "./pages/profile";
import ProfileModal from "./pages/profileModal";

export default function App() {

  const [session, setSession] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [showSplash, setShowSplash] =
    useState(true);

  // ================= ROUTING =================

  const [page, setPage] =
    useState("welcome");

  // COMMENT CHAT DATA
  const [selectedPost, setSelectedPost] =
    useState(null);



  // ================= SPLASH =================

  useEffect(() => {

    const timer = setTimeout(() => {

      setShowSplash(false);

    }, 2500);

    return () => clearTimeout(timer);

  }, []);


  useEffect(() => {
    const setup = async () => {
      if (
        Capacitor.isNativePlatform()
      ) {
        await StatusBar.setOverlaysWebView({
          overlay: true,
        });
      }
    };

    setup();
  }, []);

  useEffect(() => {

    Notification.requestPermission();

  }, []);

  /*   useEffect(() => {
      initChatDB();
    }, []); */

  useEffect(async () => {
    await initNotifications();
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

    return () =>
      subscription.unsubscribe();

  }, []);

  // ================= CHECK SESSION =================

  const checkSession = async () => {

    const {
      data: { session },
    } =
      await supabase.auth.getSession();

    console.log(session)

    setSession(session);

    if (session) {
      setPage("feed");


      registerPush(
        session.user.id
      );
      /* listenNotifications(); */
    }

    setLoading(false);
  };

  // ================= NETWORK =================

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

  // ================= OPEN MESSAGES =================

  const openMessages = (post) => {

    setSelectedPost(post);

    setPage("messages");
  };

  // ================= SPLASH =================

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
      /*  <div className="h-screen bg-white flex items-center justify-center">
         <div className="flex items-center justify-center py-10">
           <div className="w-12 h-12 border-[5px] border-purple-200 border-t-fuchsia-600 rounded-full animate-spin"></div>
         </div>
 
       </div> */
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

  // ================= ROUTING =================

  if (page === "welcome") {

    return (
      <WelcomePage
        onNavigate={setPage}
      />
    );
  }

  if (page === "login") {

    return (
      <LoginPage
        onNavigate={setPage}
      />
    );
  }

  if (page === "signup") {

    return (
      <SignupPage
        onNavigate={setPage}
      />
    );
  }

  // ================= MESSAGES =================

  if (page === "messages") {

    return (
      <Messages
        post={selectedPost}
        onBack={() =>
          setPage("feed")
        }
      />
    );
  }




  // ============ profile =============

  if (page === "profile") {

    return (
      <ProfilePage

        onNavigate={setPage}

      />
    );
  }


  if (page === "profileModal") {

    return (
      <ProfileModal
        onNavigate={setPage}
      />
    );
  }

  // ================= FEED =================

  return (
    <>

      <TopNavbar
        onOpenMessages={openMessages}
        onNavigate={setPage}
      />

      <HomeFeedPage

        onOpenMessages={
          openMessages
        }

      />

    </>
  );
}