import React, {
  useEffect,
  useState,
} from "react";

import {
  Heart,
  MessageCircle,
  Send,
  Share2,
  Wifi,
  WifiOff,
  RefreshCcw,
} from "lucide-react";

import { supabase } from "../configs/supbase";

import InstallPrompt from "../components/InstallPrompt";

import { Preferences } from "@capacitor/preferences";
import { Network } from "@capacitor/network";
import { Toast } from "@capacitor/toast";

export default function Feed() {
  const [posts, setPosts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [isOnline, setIsOnline] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  // ================= MOBILE TOAST =================

  const showToast = async (
    message
  ) => {
    await Toast.show({
      text: message,
      duration: "short",
      position: "bottom",
    });
  };

  // ================= CACHE POSTS =================

  const cachePosts = async (
    postsData
  ) => {
    try {
      await Preferences.set({
        key: "feed_cache",
        value: JSON.stringify(
          postsData
        ),
      });
    } catch (err) {
      console.log(err);
    }
  };

  // ================= LOAD CACHE =================

  const loadCachedPosts =
    async () => {
      try {
        const { value } =
          await Preferences.get({
            key: "feed_cache",
          });

        if (value) {
          setPosts(
            JSON.parse(value)
          );
        }
      } catch (err) {
        console.log(err);
      }
    };

  // ================= FETCH POSTS =================

  const fetchPosts = async (
    showLoader = false
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setRefreshing(true);

      const { data, error } =
        await supabase
          .from("posts")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

      if (!error && data) {
        setPosts(data);

        // SAVE TO CACHE
        await cachePosts(data);
      }
    } catch (err) {
      console.log(err);
    }

    setRefreshing(false);
    setLoading(false);
  };

  // ================= START FEED =================

  useEffect(() => {
    const startFeed = async () => {

      // LOAD CACHE FIRST
      await loadCachedPosts();

      // THEN FETCH NEW POSTS
      await fetchPosts(true);
    };

    startFeed();
  }, []);

  // ================= REALTIME =================

  useEffect(() => {
    const channel = supabase
      .channel("feed-realtime")

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },

        () => {
          fetchPosts();
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ================= NETWORK =================

  useEffect(() => {
    let firstRun = true;

    const setupNetwork =
      async () => {
        const status =
          await Network.getStatus();

        setIsOnline(
          status.connected
        );

        Network.addListener(
          "networkStatusChange",

          async (status) => {
            setIsOnline(
              status.connected
            );

            if (firstRun) {
              firstRun = false;
              return;
            }

            if (
              status.connected
            ) {
              await showToast(
                "You're back online"
              );

              fetchPosts();
            } else {
              await showToast(
                "You're offline"
              );
            }
          }
        );
      };

    setupNetwork();
  }, []);

  // ================= LIKE =================

  const likePost = async (
    postId
  ) => {
    try {
      const { data } =
        await supabase.auth.getUser();

      const user = data.user;

      if (!user) {
        showToast(
          "Please login first"
        );

        return;
      }

      await supabase
        .from("likes")
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      showToast("Post liked");

      fetchPosts();
    } catch (err) {
      console.log(err);
    }
  };

  // ================= SHARE =================

  const sharePost = async (
    text
  ) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "SocialGist",
          text,
        });
      } else {
        await navigator.clipboard.writeText(
          text
        );

        showToast(
          "Copied to clipboard"
        );
      }
    } catch (err) {
      console.log(err);
    }
  };

  // ================= LOADING =================

  if (loading) {
    return (
      <div className="h-screen bg-white dark:bg-[#0f0f10] flex flex-col items-center justify-center">

        <img
          src="/icon.png"
          className="w-24 h-24 animate-pulse"
        />

        <p className="mt-5 text-gray-500 font-semibold">
          Loading your feed...
        </p>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0f0f10] pb-20">

      <InstallPrompt />

      {/* TOP STATUS BAR */}

      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-[#111]/80 border-b border-gray-200 dark:border-white/10">

        <div className="h-14 px-4 flex items-center justify-between">

          <div>

            <h1 className="text-xl font-black bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
              SocialGist
            </h1>

          </div>

          <div className="flex items-center gap-3">

            {/* REFRESH */}

            <button
              onClick={() =>
                fetchPosts()
              }
              className="h-10 w-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center"
            >

              <RefreshCcw
                size={18}
                className={`${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

            </button>

            {/* NETWORK */}

            <div
              className={`flex items-center gap-2 px-3 h-10 rounded-full text-xs font-bold ${
                isOnline
                  ? "bg-green-500/10 text-green-500"
                  : "bg-red-500/10 text-red-500"
              }`}
            >

              {isOnline ? (
                <Wifi size={14} />
              ) : (
                <WifiOff size={14} />
              )}

              {isOnline
                ? "Online"
                : "Offline"}

            </div>

          </div>

        </div>

      </div>

      {/* FEED */}

      <div className="w-full max-w-2xl mx-auto">

        {posts.length === 0 && (
          <div className="h-[70vh] flex items-center justify-center">

            <div className="text-center px-6">

              <img
                src="/icon.png"
                className="w-24 h-24 mx-auto opacity-70"
              />

              <h2 className="text-2xl font-black mt-6 text-gray-800 dark:text-white">
                No posts yet
              </h2>

              <p className="text-gray-500 mt-2">
                Be the first to post on SocialGist
              </p>

            </div>

          </div>
        )}

        {posts.map((post) => {

          const parsed =
            post.content || {};

          return (
            <div
              key={post.id}
              className="bg-white dark:bg-[#18191A] mb-3 sm:rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/5"
            >

              {/* HEADER */}

              <div className="flex items-center gap-3 px-4 py-4">

                {/* AVATAR */}

                {post.profile_image ? (
                  <img
                    src={
                      post.profile_image
                    }
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
                    {(
                      post.profile_name ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                {/* INFO */}

                <div className="flex-1">

                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                    {post.profile_name ||
                      "Anonymous"}
                  </h3>

                  <p className="text-xs text-gray-500">
                    {new Date(
                      post.created_at
                    ).toLocaleString()}
                  </p>

                </div>

              </div>

              {/* DESCRIPTION */}

              {post.description && (
                <div className="px-4 pb-4">

                  <p className="text-[15px] leading-relaxed text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
                    {post.description}
                  </p>

                </div>
              )}

              {/* IMAGE */}

              {post.image && (
                <div className="relative overflow-hidden bg-black">

                  <img
                    src={post.image}
                    alt=""
                    className="w-full max-h-[700px] object-cover"
                  />

                  {/* EDITOR TEXT */}

                  {parsed?.layers?.map(
                    (layer) => (
                      <div
                        key={layer.id}
                        className="absolute font-black"
                        style={{
                          left: layer.x,
                          top: layer.y,
                          color:
                            layer.color,
                          fontSize:
                            layer.fontSize,
                          textShadow:
                            "0 3px 15px rgba(0,0,0,0.6)",
                        }}
                      >
                        {layer.text}
                      </div>
                    )
                  )}

                </div>
              )}

              {/* TEXT ONLY POST */}

              {!post.image &&
                parsed?.background && (
                  <div
                    className="relative min-h-[280px] flex items-center justify-center overflow-hidden"
                    style={{
                      background:
                        parsed.background,
                    }}
                  >

                    {parsed?.layers?.map(
                      (layer) => (
                        <div
                          key={layer.id}
                          className="absolute font-black"
                          style={{
                            left: layer.x,
                            top: layer.y,
                            color:
                              layer.color,
                            fontSize:
                              layer.fontSize,
                            textShadow:
                              "0 3px 15px rgba(0,0,0,0.6)",
                          }}
                        >
                          {layer.text}
                        </div>
                      )
                    )}

                  </div>
                )}

              {/* ACTIONS */}

              <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100 dark:border-white/5">

                {/* LIKE */}

                <button
                  onClick={() =>
                    likePost(post.id)
                  }
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-200 active:scale-95 transition"
                >

                  <Heart size={22} />

                  <span className="text-sm font-medium">
                    Like
                  </span>

                </button>

                {/* COMMENT */}

                <button className="flex items-center gap-2 text-gray-700 dark:text-gray-200 active:scale-95 transition">

                  <MessageCircle
                    size={22}
                  />

                  <span className="text-sm font-medium">
                    Comment
                  </span>

                </button>

                {/* SEND */}

                <button className="flex items-center gap-2 text-gray-700 dark:text-gray-200 active:scale-95 transition">

                  <Send size={22} />

                  <span className="text-sm font-medium">
                    Send
                  </span>

                </button>

                {/* SHARE */}

                <button
                  onClick={() =>
                    sharePost(
                      post.description ||
                        "Check out this post on SocialGist"
                    )
                  }
                  className="flex items-center gap-2 text-purple-600 active:scale-95 transition"
                >

                  <Share2 size={22} />

                  <span className="text-sm font-medium">
                    Share
                  </span>

                </button>

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}
