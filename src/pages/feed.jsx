import React, {
  useEffect,
  useState,
} from "react";

import {
  MessageCircle,
  Wifi,
  WifiOff,
  RefreshCcw,
  ThumbsUp,
  Heart,
  Share2,
} from "lucide-react";

import { supabase } from "../configs/supbase";

import { Preferences } from "@capacitor/preferences";
import { Network } from "@capacitor/network";
import { Toast } from "@capacitor/toast";
import { Share } from "@capacitor/share";

export default function Feed({
  onOpenComments,
}) {

  const [posts, setPosts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [isOnline, setIsOnline] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [likedPosts, setLikedPosts] =
    useState({});

  const [animatingLike, setAnimatingLike] =
    useState(null);

  // ================= TOAST =================

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

  // ================= CACHE LIKES =================

  const cacheLikes = async (
    likesData
  ) => {

    try {

      await Preferences.set({
        key: "liked_posts",
        value: JSON.stringify(
          likesData
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

          const parsed =
            JSON.parse(value);

          setPosts(parsed || []);
        }

      } catch (err) {

        console.log(err);

      }
    };

  // ================= LOAD LIKES =================

  const loadLikedPosts =
    async () => {

      try {

        const { value } =
          await Preferences.get({
            key: "liked_posts",
          });

        if (value) {

          const parsed =
            JSON.parse(value);

          setLikedPosts(
            parsed || {}
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

      if (error) {

        console.log(error);

        return;
      }

      if (data) {

        const formatted =
          data.map((post) => ({
            ...post,
            likes_count:
              post.likes_count || 0,
          }));

        setPosts(formatted);

        await cachePosts(
          formatted
        );
      }

    } catch (err) {

      console.log(err);

    }

    setRefreshing(false);
    setLoading(false);
  };

  // ================= START =================

  useEffect(() => {

    const startFeed =
      async () => {

        await loadCachedPosts();

        await loadLikedPosts();

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

        (payload) => {

          const updatedPost =
            payload.new;

          if (!updatedPost) return;

          setPosts((prev) => {

            const updated =
              prev.map((post) =>
                post.id ===
                updatedPost.id
                  ? {
                    ...post,
                    ...updatedPost,
                  }
                  : post
              );

            cachePosts(updated);

            return updated;
          });
        }
      )

      .subscribe();

    return () => {

      supabase.removeChannel(
        channel
      );
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

      const alreadyLiked =
        likedPosts[postId];

      setAnimatingLike(
        postId
      );

      setTimeout(() => {

        setAnimatingLike(
          null
        );

      }, 400);

      // ================= UNLIKE =================

      if (alreadyLiked) {

        const updatedPosts =
          posts.map((post) => {

            if (
              post.id === postId
            ) {

              return {
                ...post,
                likes_count:
                  Math.max(
                    0,
                    (
                      post.likes_count ||
                      0
                    ) - 1
                  ),
              };
            }

            return post;
          });

        setPosts(updatedPosts);

        await cachePosts(
          updatedPosts
        );

        const updatedLikes = {
          ...likedPosts,
          [postId]: false,
        };

        setLikedPosts(
          updatedLikes
        );

        await cacheLikes(
          updatedLikes
        );

        const targetPost =
          updatedPosts.find(
            (p) =>
              p.id === postId
          );

        await supabase
          .from("posts")
          .update({
            likes_count:
              targetPost.likes_count,
          })
          .eq("id", postId);

        return;
      }

      // ================= LIKE =================

      const updatedPosts =
        posts.map((post) => {

          if (
            post.id === postId
          ) {

            return {
              ...post,
              likes_count:
                (
                  post.likes_count ||
                  0
                ) + 1,
            };
          }

          return post;
        });

      setPosts(updatedPosts);

      await cachePosts(
        updatedPosts
      );

      const updatedLikes = {
        ...likedPosts,
        [postId]: true,
      };

      setLikedPosts(
        updatedLikes
      );

      await cacheLikes(
        updatedLikes
      );

      const targetPost =
        updatedPosts.find(
          (p) =>
            p.id === postId
        );

      await supabase
        .from("posts")
        .update({
          likes_count:
            targetPost.likes_count,
        })
        .eq("id", postId);

    } catch (err) {

      console.log(err);

    }
  };

  // ================= SHARE =================

  const sharePost = async (
    post
  ) => {

    try {

      const shareUrl =
        `https://socialgist-app.vercel.apppost/${post.id}`;

      const shareText = `🔥 SocialGist

${post.description || ""}

❤️ ${post.likes_count || 0} likes

👤 @${(
          post.profile_name ||
          "user"
        )
          .replace(/\s+/g, "")
          .toLowerCase()}

🌍 ${shareUrl}`;

      await Share.share({
        title: "SocialGist",
        text: shareText,
        url: post.image || shareUrl,
        dialogTitle:
          "Share Post",
      });

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

    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0f0f10] pb-24">

      {/* TOP */}

      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-[#111]/80 border-b border-gray-200 dark:border-white/10">

        <div className="h-14 px-4 flex items-center justify-between">

          <h1 className="text-xl font-black bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
            SocialGist
          </h1>

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
                className={`${refreshing
                    ? "animate-spin"
                    : ""
                  }`}
              />

            </button>

            {/* NETWORK */}

            <div
              className={`flex items-center gap-2 px-3 h-10 rounded-full text-xs font-bold ${isOnline
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
                Be the first to post
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
              className="bg-white dark:bg-[#18191A] mb-4 sm:rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/5"
            >

              {/* HEADER */}

              <div className="flex items-center gap-3 px-4 py-4">

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
                    src={`${post.image}?t=${Date.now()}`}
                    alt=""
                    className="w-full max-h-[700px] object-cover"
                  />

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

              {/* TEXT POST */}

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

              <div className="px-4 py-3">

                {/* COUNTS */}

                <div className="flex items-center justify-between mb-3">

                  <div className="flex items-center gap-2">

                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-r from-pink-500 to-red-500 text-white">

                      <Heart
                        size={13}
                        fill="white"
                      />

                    </div>

                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">

                      {post.likes_count || 0} likes

                    </span>

                  </div>

                  <div className="text-xs text-gray-500">
                    SocialGist
                  </div>

                </div>

                {/* BUTTONS */}

                <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-white/5 pt-3">

                  {/* LIKE */}

                  <button
                    onClick={() =>
                      likePost(
                        post.id
                      )
                    }
                    className={`flex items-center justify-center gap-2 h-12 rounded-2xl transition-all active:scale-95 ${likedPosts[
                        post.id
                      ]
                        ? "bg-blue-500/10 text-blue-500"
                        : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200"
                      }`}
                  >

                    <ThumbsUp
                      size={20}
                      className={`transition-all ${animatingLike ===
                          post.id
                          ? "scale-150 rotate-12"
                          : ""
                        }`}
                      fill={
                        likedPosts[
                          post.id
                        ]
                          ? "currentColor"
                          : "none"
                      }
                    />

                    <span className="text-sm font-semibold">
                      Like
                    </span>

                  </button>

                  {/* COMMENT */}

                  <button
                    onClick={() =>
                      onOpenComments(post)
                    }
                    className="flex items-center justify-center gap-2 h-12 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 active:scale-95 transition"
                  >

                    <MessageCircle size={20} />

                    <span className="text-sm font-semibold">
                      Comment
                    </span>

                  </button>

                  {/* SHARE */}

                  <button
                    onClick={() =>
                      sharePost(
                        post
                      )
                    }
                    className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-purple-500/10 text-purple-600 active:scale-95 transition"
                  >

                    <Share2 size={20} />

                    <span className="text-sm font-semibold">
                      Share
                    </span>

                  </button>

                </div>

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}