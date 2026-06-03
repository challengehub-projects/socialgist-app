
import { supabase } from "../configs/supbase";
import { useState, useEffect } from "react";
import { Preferences } from "@capacitor/preferences";
import { Network } from "@capacitor/network";
import { Toast } from "@capacitor/toast";
/* import { Share } from "@capacitor/share"; */
import { Filesystem, Directory, } from "@capacitor/filesystem";
import {
  MessageCircle,
  Wifi,
  WifiOff,
  RefreshCcw,
  ThumbsUp,
  Heart,
  Share,
  Send,
  Share2,
  Flame,
  Sparkles,
  Users,
  CornerUpRight,
  CornerUpLeftIcon
} from "lucide-react";
import { GiConsoleController } from "react-icons/gi";
import ProfileModal from "./profileModal"
import { sendNotification } from "../utils/sendNotifications";
import { initNotifications, showNotification } from "../utils/notifications";


export default function Feed({
  onOpenMessages,
}) {
  const [me, setMe] =
    useState(null);

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



  const [openProfile, setOpenProfile] =
    useState(false);

  const [selectedProfile, setSelectedProfile] =
    useState(null);


  const openProfileModal = (post) => {
    setSelectedProfile(post);
    setOpenProfile(true);
  };



  const [page, setPage] = useState(0);
  const POSTS_PER_PAGE = 5;
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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





  // ================= IMAGE CACHE =================

  const cacheImageLocally = async (
    imageUrl,
    fileName
  ) => {
    try {
      if (!imageUrl) return imageUrl;

      const existing =
        await Preferences.get({
          key: `image_${fileName}`,
        });

      // ALREADY CACHED

      if (existing.value) {
        return existing.value;
      }

      // DOWNLOAD

      const response =
        await fetch(imageUrl);

      const blob =
        await response.blob();

      const reader =
        new FileReader();

      return new Promise(
        (resolve) => {
          reader.onloadend =
            async () => {
              try {
                const base64 =
                  reader.result.split(
                    ","
                  )[1];

                const filePath = `socialgist/${fileName}`;

                // SAVE FILE

                await Filesystem.writeFile(
                  {
                    path: filePath,
                    data: base64,
                    directory:
                      Directory.Data,
                  }
                );

                // GET REAL URI

                const uriResult =
                  await Filesystem.getUri(
                    {
                      path: filePath,
                      directory:
                        Directory.Data,
                    }
                  );

                const localPath =
                  uriResult.uri;

                await Preferences.set(
                  {
                    key: `image_${fileName}`,
                    value:
                      localPath,
                  }
                );

                resolve(
                  localPath
                );
              } catch (err) {
                console.log(err);

                resolve(
                  imageUrl
                );
              }
            };

          reader.readAsDataURL(
            blob
          );
        }
      );
    } catch (err) {
      console.log(
        "CACHE IMAGE ERROR:",
        err
      );

      return imageUrl;
    }
  };
  // ================= CACHE ALL POST IMAGES =================

  const cachePostImages =
    async (postsData) => {
      try {
        const updated =
          await Promise.all(
            postsData.map(
              async (post) => {
                if (
                  !post.image
                ) {
                  return post;
                }

                const fileName = `post_${post.id}.jpg`;

                const cachedImage =
                  await cacheImageLocally(
                    post.image,
                    fileName
                  );

                return {
                  ...post,
                  cached_image:
                    cachedImage ||
                    post.image,
                };
              }
            )
          );

        return updated;
      } catch (err) {
        console.log(
          "CACHE POSTS ERROR:",
          err
        );

        return postsData;
      }
    };

  // ================= OFFLINE LIKE QUEUE =================

  const savePendingLike = async (postId) => {
    try {
      const { value } = await Preferences.get({
        key: "pending_likes",
      });

      const pending = value
        ? JSON.parse(value)
        : [];

      pending.push({
        postId,
        type: "like",
      });

      await Preferences.set({
        key: "pending_likes",
        value: JSON.stringify(pending),
      });
    } catch (err) {
      console.log(err);
    }
  };


  const loadMorePosts = async () => {
    if (
      loadingMore ||
      !hasMore ||
      refreshing
    )
      return;

    setLoadingMore(true);

    const nextPage = page + 1;

    try {
      const from =
        nextPage * POSTS_PER_PAGE;

      const to =
        from + POSTS_PER_PAGE - 1;

      const { data, error } =
        await supabase
          .from("posts")
          .select("*")
          .order("created_at", {
            ascending: false,
          })
          .range(from, to);

      if (error) {
        console.log(error);
        return;
      }

      if (data?.length) {
        setPosts((prev) => {
          const existingIds = new Set(
            prev.map((p) => p.id)
          );

          const newPosts = data.filter(
            (post) => !existingIds.has(post.id)
          );

          return [...prev, ...newPosts];
        });
        setPage(nextPage);

        if (
          data.length <
          POSTS_PER_PAGE
        ) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.log(err);
    }

    setLoadingMore(false);
  };

  // ================= SYNC OFFLINE LIKES =================

  const syncOfflineLikes = async () => {
    try {
      const { value } =
        await Preferences.get({
          key: "pending_likes",
        });

      if (!value) return;

      const pending =
        JSON.parse(value);

      for (const item of pending) {
        const {
          data: currentPost,
        } = await supabase
          .from("posts")
          .select("likes_count")
          .eq("id", item.postId)
          .single();

        const currentLikes =
          currentPost?.likes_count || 0;

        const newLikes =
          item.action === "unlike"
            ? Math.max(
              0,
              currentLikes - 1
            )
            : currentLikes + 1;

        await supabase
          .from("posts")
          .update({
            likes_count: newLikes,
          })
          .eq(
            "id",
            item.postId
          );
      }

      await Preferences.remove({
        key: "pending_likes",
      });

      await fetchPosts();
    } catch (err) {
      console.log(err);
    }
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
      const { datas, errorlogs } =
        await supabase
          .from("notifications")
          .insert({
            title: "Test",
            body: "Hello World",
            user_id: me.id,
          });

      console.log(datas, errorlogs);
      if (showLoader) {
        setLoading(true);
      }

      setRefreshing(true);

      const status =
        await Network.getStatus();

      // OFFLINE

      if (!status.connected) {
        await loadCachedPosts();


        setRefreshing(false);
        setLoading(false);

        return;
      }

      const from = page * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      const { data, error } =
        await supabase
          .from("posts")
          .select("*")
          .order("created_at", {
            ascending: false,
          })
          .range(from, to);
      /*      const { data, error } =
             await supabase
               .from("posts")
               .select("*")
               .order("created_at", {
                 ascending: false,
               }); */

      if (error) {
        console.log(error);

        setRefreshing(false);
        setLoading(false);

        return;
      }


      console.log(data)

      if (data) {
        let formatted =
          data.map((post) => ({
            ...post,
            likes_count:
              post.likes_count,
          }));



        // CACHE IMAGES

        formatted =
          await cachePostImages(
            formatted
          );

        /*   setPosts(formatted); */

        setPosts((prev) => {
          const merged =
            page === 0
              ? formatted
              : [...prev, ...formatted];

          const uniquePosts =
            merged.filter(
              (post, index, self) =>
                index ===
                self.findIndex(
                  (p) => p.id === post.id
                )
            );

          return uniquePosts;
        });


        if (
          !data ||
          data.length < POSTS_PER_PAGE
        ) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

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

  useEffect(() => {

    const getUser =
      async () => {

        const { data } =
          await supabase.auth.getUser();

        setMe(
          data?.user || null
        );

      };

    getUser();

  }, []);

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

        async (payload) => {

          console.log(
            "🔥 FEED UPDATE:",
            payload
          );

          // =========================
          // IGNORE NEW POSTS
          // =========================

          if (
            payload.eventType ===
            "INSERT"
          ) {

            return;

          }

          // =========================
          // POST UPDATED
          // =========================

          if (
            payload.eventType ===
            "UPDATE"
          ) {

            setPosts((prev) =>

              prev.map((post) =>

                post.id ===
                  payload.new.id

                  ? {

                    ...post,

                    ...payload.new,

                  }

                  : post

              )

            );

            // =========================
            // LIKE NOTIFICATION
            // =========================

            const oldLikes =
              payload.old
                ?.likes_count || 0;

            const newLikes =
              payload.new
                ?.likes_count || 0;




            if (

              newLikes > oldLikes &&

              payload.new.user_id ===
              me?.id
            ) {

              await showNotification(
                "❤️ New Like",
                "Someone liked your post"
              );

              await sendNotification({

                title:
                  "❤️ New Like",

                body:
                  "Someone liked your post",

              });

              console.log("SOMEONE LIKED YOUR POST");

            }

            else {

         /*      await showNotification(
                "❤️ Unlike Like Message",
                "Someone unliked your post"
              );

              await sendNotification({

                title:
                  "❤️ Unlike Like Message",

                body:
                  "Someone unliked your post",

              });
 */
              console.log("LIKE COUNT CHANGED:", {
                old: oldLikes,
                new: newLikes
              });


            }

            // =========================
            // SHARE NOTIFICATION
            // =========================

            const oldShares =
              payload.old
                ?.shares_count || 0;

            const newShares =
              payload.new
                ?.shares_count || 0;

            if (

              newShares > oldShares &&

              payload.new.user_id ===
              me?.id

            ) {

              await showNotification(
                "New Share",
                "Someone Share your post"
              );

              await sendNotification({

                title:
                  "📤 New Share",

                body:
                  "Someone shared your post",

              });

            }

            return;

          }

          // =========================
          // DELETE POST
          // =========================

          if (
            payload.eventType ===
            "DELETE"
          ) {

            setPosts((prev) =>

              prev.filter(

                (post) =>

                  post.id !==
                  payload.old.id

              )

            );

          }

        }
      )

      .subscribe((status) => {

        console.log(
          "📡 Feed Status:",
          status
        );

      });

    return () => {

      supabase.removeChannel(
        channel
      );

    };

  }, [me?.id]);

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

        if (
          status.connected
        ) {
          await syncOfflineLikes();
        }

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

              // SYNC OFFLINE LIKES

              await syncOfflineLikes();

              // REFRESH POSTS

              fetchPosts();
            } else {
              setHasMore(false)
              await showToast(
                "You're offline"
              );
            }
          }
        );
      };

    setupNetwork();
  }, []);




  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.scrollY;

      const windowHeight =
        window.innerHeight;

      const fullHeight =
        document.documentElement
          .scrollHeight;

      if (
        scrollTop +
        windowHeight >=
        fullHeight - 500
      ) {
        loadMorePosts();
      }
    };

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () =>
      window.removeEventListener(
        "scroll",
        handleScroll
      );
  }, [posts, hasMore]);

  // ================= LIKE =================

  // ================= LIKE POST =================
  const likePost = async (postId) => {
    try {
      const alreadyLiked = likedPosts[postId];

      setAnimatingLike(postId);

      setTimeout(() => {
        setAnimatingLike(null);
      }, 400);

      // UPDATE UI IMMEDIATELY

      const updatedPosts = posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            likes_count: alreadyLiked
              ? Math.max(
                0,
                (post.likes_count || 0) - 1
              )
              : (post.likes_count || 0) + 1,
          };
        }

        return post;
      });

      //APP NOTIFICATION

      await showNotification(
        "Message",
        "You liked a post!"
      );

      // BROWSER NOTIFICATION

      await sendNotification({

        title:
          "Message",

        body:
          "You Liked a post!",

      });

      setPosts(updatedPosts);

      await cachePosts(updatedPosts);

      // SAVE LOCAL LIKE STATE

      const updatedLikes = {
        ...likedPosts,
        [postId]: !alreadyLiked,
      };

      setLikedPosts(updatedLikes);

      await cacheLikes(updatedLikes);

      // CHECK NETWORK

      const status =
        await Network.getStatus();

      // OFFLINE

      if (!status.connected) {
        const { value } =
          await Preferences.get({
            key: "pending_likes",
          });

        const pending = value
          ? JSON.parse(value)
          : [];

        pending.push({
          postId,
          action: alreadyLiked
            ? "unlike"
            : "like",
        });

        await Preferences.set({
          key: "pending_likes",
          value: JSON.stringify(
            pending
          ),
        });

        return;
      }

      // ONLINE

      const {
        data: currentPost,
        error: fetchError,
      } = await supabase
        .from("posts")
        .select("likes_count")
        .eq("id", postId)
        .single();

      if (fetchError) {
        console.log(fetchError);
        return;
      }

      const currentLikes =
        currentPost?.likes_count || 0;

      const newLikes = alreadyLiked
        ? Math.max(
          0,
          currentLikes - 1
        )
        : currentLikes + 1;

      const { error } =
        await supabase
          .from("posts")
          .update({
            likes_count: newLikes,
          })
          .eq("id", postId);

      if (error) {
        console.log(error);
      }


      const {
        data: updatedPost,
      } = await supabase
        .from("posts")
        .select("likes_count")
        .eq("id", postId)
        .single();


      console.log(
        "LATEST DB LIKE COUNT:",
        updatedPost.likes_count
      );

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
        post.image ||
        `https://socialgist-app.vercel.app/post/${post.id}`;

      const caption = `${post.description ||
        "Check this post on SocialGist"
        }

${post.likes_count || 0} likes
@${(
          post.profile_name ||
          "user"
        )
          .replace(/\s+/g, "")
          .toLowerCase()}`;

      await Share.share({
        title: "SocialGist",
        text: caption,
        url: shareUrl,
        dialogTitle:
          "Share Post",
      });
    } catch (err) {
      console.log(
        "Share error:",
        err
      );
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

      <div className="w-full max-w-2xl mx-auto p-2 sm:p-4">
        {/* WELCOME CARD */}

        <div className="mb-4 overflow-hidden rounded-3xl bg-gradient-to-br from-purple-700 via-fuchsia-600 to-pink-500 p-6 shadow-2xl text-white relative">
          <div className="absolute top-0 right-0 opacity-10">
            <Sparkles size={150} />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center">
                <Flame size={28} />
              </div>

              <div>
                <h1 className="text-2xl font-black">
                  Welcome to
                  SocialGist
                </h1>

                <p className="text-sm text-white/80 mt-1">
                  Connect • Vibe •
                  Gist
                </p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-white/90 mb-5">
              Share photos,
              thoughts, vibes,
              moments and connect
              with people in
              real-time.
            </p>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/15 px-4 py-2 rounded-full backdrop-blur-xl">
                <Users size={16} />

                <span className="text-sm font-semibold">
                  Social Community
                </span>
              </div>

              <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full backdrop-blur-xl">
                <Sparkles size={16} />

                <span className="text-sm font-semibold">
                  Trending Vibes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* EMPTY */}

        {posts.length === 0 && (
          <div className="h-[60vh] flex items-center justify-center">
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

        {/* POSTS */}

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
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm"
                  >
                    {(
                      post.profile_name ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white"
                    onClick={() =>
                      openProfileModal({
                        profile_name: "Emzy",
                        profile_image:
                          "https://i.pravatar.cc/155?img=12",
                        bio: "Connect • Vibe • Gist",
                        posts: posts?.length || 0,
                      })
                    }
                  >
                    {
                      post.profile_name ||
                      "Anonymous"
                    }
                  </h3>

                  <p className="text-xs text-gray-500">
                    {new Date(
                      post.created_at
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* DESCRIPTION */}

              {
                post.description && (
                  <div className="px-4 pb-4">
                    <p className="text-[15px] leading-relaxed text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
                      {
                        post.description
                      }
                    </p>
                  </div>
                )
              }

              {/* IMAGE */}

              {
                post.image && (
                  <div className="relative overflow-hidden bg-black -mx-4">
                    <img
                      src={
                        post.cached_image ||
                        post.image
                      }
                      alt=""
                      className="w-full max-w-2xl mx-auto sm:p-4"
                    />

                    {parsed?.layers?.map(
                      (layer) => (
                        <div
                          key={layer.id}
                          className="absolute font-black w-full"
                          style={{
                            left:
                              layer.x,
                            top: layer.y,
                            color:
                              layer.color,
                            fontSize:
                              layer.fontSize,
                            textShadow:
                              "none",
                          }}
                        >
                          {layer.text}
                        </div>
                      )
                    )}
                  </div>
                )
              }
              {
                !post.image &&
                parsed?.background && (
                  <div
                    className="relative min-h-[280px] flex items-center justify-center overflow-hidden p-8"
                    style={{
                      background: parsed.background,
                    }}
                  >
                    {parsed?.text ? (
                      <div
                        className="
            text-white
            text-center
            font-black
            text-3xl
            sm:text-4xl
            whitespace-pre-wrap
            break-words
            w-full
          "
                        style={{
                          textShadow:
                            "none",
                        }}
                      >
                        {parsed.text}
                      </div>
                    ) : (
                      parsed?.layers?.map(
                        (layer) => (
                          <div
                            key={layer.id}
                            className="absolute font-black"
                            style={{
                              left: layer.x,
                              top: layer.y,
                              color: layer.color,
                              fontSize: layer.fontSize,
                              textShadow:
                                "none",
                            }}
                          >
                            {layer.text}
                          </div>
                        )
                      )
                    )}
                  </div>
                )
              }
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
                      {post.likes_count ||
                        0}{" "}
                      likes
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

                  {/* MESSAGE */}

                  <button
                    onClick={() =>
                      onOpenMessages(
                        post
                      )
                    }
                    className="flex items-center justify-center gap-2 h-12 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 active:scale-95 transition"
                  >
                    <MessageCircle
                      size={20}
                    />

                    <span className="text-sm font-semibold">
                      Message
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
                    <CornerUpRight size={20} />

                    <span className="text-sm font-semibold">
                      Share
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {
          loadingMore && (
            <div className="py-8 flex justify-center">
              <RefreshCcw
                size={24}
                className="animate-spin text-purple-600"
              />
            </div>
          )
        }
      </div>
    </div >
  );
}