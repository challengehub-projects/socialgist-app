import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { supabase } from "../configs/supbase";
import { sendNotification } from "../utils/sendNotifications";
import {
  initNotifications,
  showNotification,
} from "../utils/notifications";

import {
  ArrowLeft,
  Send,
  LogOut,
  Search,
  MoreVertical,
} from "lucide-react";


import {
  getOrCreateConversation,
} from "../utils/uilts";

export default function Messages({
  onBack,
  post,
}) {



  const messagesEndRef =
    useRef(null);

  const typingTimeoutRef =
    useRef(null);

  const channelRef =
    useRef(null);

  const [me, setMe] =
    useState(null);

  const [chats, setChats] =
    useState([]);

  const [activeChat, setActiveChat] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [text, setText] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const [mobileChatOpen, setMobileChatOpen] =
    useState(false);

  const [typingUsers, setTypingUsers] =
    useState([]);


  // ================= SCROLL =================

  const scrollToBottom = () => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  };

  useEffect(() => {

    if (!me?.id) return;

    const channel = supabase
      .channel(`incoming-${me.id}`)

      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },

        async (payload) => {

          if (
            payload.new.sender_id ===
            me.id
          ) {
            return;
          }

          await showNotification(
            "New Message",
            payload.new.content,
          );

          await sendNotification({

            title: "New Message",

            body:
              payload.new.content,

          });

        }
      );

    channel.subscribe();

    return () => {

      supabase.removeChannel(
        channel
      );

    };

  }, [me]);

  useEffect(() => {

    scrollToBottom();

  }, [messages, typingUsers]);

  // ================= USER =================

  useEffect(() => {

    const initUser = async () => {

      const { data } =
        await supabase.auth.getUser();

      setMe(data?.user || null);

    };

    initUser();

  }, []);


  useEffect(() => {

    if (!me?.id) return;

    const channel = supabase

      .channel(`notifications-${me.id}`)

      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },

        async (payload) => {

          const message =
            payload.new;

          if (
            message.sender_id ===
            me.id
          ) {
            return;
          }

          // CHAT OPEN?

          if (
            activeChat?.conversation_id ===
            message.conversation_id
          ) {

            setMessages((prev) => {

              const exists =
                prev.some(
                  (m) =>
                    m.id ===
                    message.id
                );

              if (exists)
                return prev;

              return [
                ...prev,
                message,
              ];

            });

            return;
          }


          //APP NOTIFICATION

          await showNotification(
            "New Message",
            message.content,
          );

          // BROWSER NOTIFICATION

          await sendNotification({

            title:
              "New Message",

            body:
              message.content,

          });

          // REFRESH CHAT LIST

          loadChats(me.id);

        }
      );

    channel.subscribe();

    return () => {

      supabase.removeChannel(
        channel
      );

    };

  }, [
    me,
    activeChat,
  ]);

  useEffect(() => {
    if (!conversationId)
      return;

    loadMessages(
      conversationId
    );

    const channel =
      subscribeToMessages(
        conversationId
      );

    return () => {
      if (channel) {
        supabase.removeChannel(
          channel
        );
      }
    };
  }, [conversationId]);

  useEffect(() => {

    const startChat = async () => {

      console.log("Starting chat with post", post);

      if (
        !me?.id ||
        !post?.user_id
      ) return;

      if (
        me.id === post.user_id
      ) return;

      const result =
        await getOrCreateConversation(
          me.id,
          post.user_id
        );

      if (!result) return;

      const chat = {
        conversation_id:
          result.conversationId,

        name:
          post.profile_name ||
          "User",

        profile_image:
          post.profile_image,
      };

      await showNotification(
        "Message",
        "New Chat Created"
      );

      await sendNotification({

        title:
          "Message",

        body:
          "New Chat Created",

      });

      setActiveChat(chat);

      setMobileChatOpen(true);

      await loadMessages(
        result.conversationId
      );

      setupTyping(
        result.conversationId
      );
    };

    startChat();

  }, [me, post]);

  // ================= SIGN OUT =================

  const signOut = async () => {

    await supabase.auth.signOut();

    window.location.reload();

  };

  // utils/getUnreadMessagesCount.js
  2

  /*  export default async function getUnreadMessagesCount(userId) {
 
     if (!userId) return 0;
 
     const {
       data: conversations, error,
     } = await supabase
       .from("conversation_members")
       .select("conversation_id")
       .eq("user_id", userId);
 
     if (error) {
 
       console.log(error);
 
       return 0;
 
     }
 
     let totalUnread = 0;
 
     for (const chat of conversations || []) {
 
       const { count } = await supabase
         .from("messages")
         .select("*", {
           count: "exact",
           head: true,
         })
         .eq(
           "conversation_id",
           chat.conversation_id
         )
         .neq(
           "sender_id",
           userId
         )
         .eq(
           "is_read",
           false
         );
 
       totalUnread +=
         count || 0;
 
     }
 
     return totalUnread;
 
   } */
  // ================= TIME =================

  const formatTime = (date) => {

    if (!date) return "";

    return new Date(date).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ================= LOAD CHATS =================

  const loadChats = async (userId) => {

    const { data, error } =
      await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", userId);

    if (error) {

      console.log(error);

      return;

    }

    const formatted =
      await Promise.all(

        (data || []).map(
          async (item) => {

            const conversationId =
              item.conversation_id;

            // UNREAD COUNT

            const { count } =
              await supabase
                .from("messages")
                .select("*", {
                  count: "exact",
                  head: true,
                })
                .eq(
                  "conversation_id",
                  conversationId
                )
                .neq(
                  "sender_id",
                  userId
                )
                .eq(
                  "is_read",
                  false
                );

            // FIND OTHER MEMBER

            const {
              data: members,
            } = await supabase
              .from(
                "conversation_members"
              )
              .select("user_id")
              .eq(
                "conversation_id",
                conversationId
              );

            const otherMember =
              members?.find(
                (m) =>
                  m.user_id !==
                  userId
              );

            if (!otherMember)
              return null;

            // PROFILE

            const {
              data: profile,
            } = await supabase
              .from("profiles")
              .select(`
              id,
              full_name,
              avatar_url
            `)
              .eq(
                "id",
                otherMember.user_id
              )
              .maybeSingle();

            // LAST MESSAGE

            const {
              data: lastMsg,
            } = await supabase
              .from("messages")
              .select("*")
              .eq(
                "conversation_id",
                conversationId
              )
              .order(
                "created_at",
                {
                  ascending: false,
                }
              )
              .limit(1)
              .maybeSingle();

            return {

              conversation_id:
                conversationId,

              user_id:
                profile?.id,

              name:
                profile?.full_name ||
                "Unknown User",

              avatar:
                profile?.avatar_url,

              lastMessage:
                lastMsg?.content ||
                "Start chatting",

              unreadCount:
                count || 0,

            };

          }
        )
      );

    setChats(
      formatted.filter(Boolean)
    );

  };

  // ================= LOAD MESSAGES =================

  const loadMessages = async (
    conversationId
  ) => {
    try {

      // 1. LOAD SQLITE FIRST
      const cached =
        await getLocalMessages(
          conversationId
        );

      setMessages(
        cached || []
      );

      // 2. CHECK INTERNET
      const online =
        await isOnline();

      if (!online) {
        console.log(
          "Offline: using SQLite messages"
        );
        return;
      }

      // 3. SYNC ONLY NEW MESSAGES
      await syncConversation(
        conversationId
      );

      // 4. RELOAD SQLITE AFTER SYNC
      const fresh =
        await getLocalMessages(
          conversationId
        );

      setMessages(
        fresh || []
      );

    } catch (err) {
      console.log(
        "loadMessages error:",
        err
      );
    }
  };

  // ================= START =================

  useEffect(() => {

    if (me?.id) {

      loadChats(me.id);

    }

  }, [me]);


  // ================= OPEN CHAT =================

  const openChat = async (
    chat
  ) => {

    setActiveChat(chat);

    setMobileChatOpen(true);

    // MARK ALL RECEIVED
    // MESSAGES AS READ

    await supabase
      .from("messages")
      .update({
        is_read: true,
      })
      .eq(
        "conversation_id",
        chat.conversation_id
      )
      .neq(
        "sender_id",
        me.id
      );

    // REFRESH SIDEBAR

    await loadChats(
      me.id
    );

    await loadMessages(
      chat.conversation_id
    );

    // REMOVE OLD CHANNEL

    if (channelRef.current) {

      await supabase.removeChannel(
        channelRef.current
      );

      channelRef.current =
        null;

    }

    const channel =
      supabase.channel(
        `chat-${chat.conversation_id}-${Date.now()}`
      );

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${chat.conversation_id}`,
      },

      async (payload) => {

        const newMessage =
          payload.new;

        // IF MESSAGE FROM OTHER USER
        // MARK IT READ IMMEDIATELY

        if (
          newMessage.sender_id !==
          me.id
        ) {

          await supabase
            .from("messages")
            .update({
              is_read: true,
            })
            .eq(
              "id",
              newMessage.id
            );

        }

        setMessages(
          (prev) => {

            const exists =
              prev.some(
                (m) =>
                  m.id ===
                  newMessage.id
              );

            if (exists)
              return prev;

            return [
              ...prev,
              newMessage,
            ];

          }
        );

        // UPDATE CHAT LIST

        loadChats(
          me.id
        );

      }
    );

    channel.subscribe(
      (status) => {

        console.log(
          "Chat Channel:",
          status
        );

      }
    );

    channelRef.current =
      channel;

  };
  // ================= SEND TYPING =================

  const sendTyping = async () => {

    if (
      !channelRef.current ||
      !me
    ) {
      return;
    }

    try {

      await channelRef.current.send({

        type: "broadcast",

        event: "typing",

        payload: {
          userId: me.id,
        },

      });

    } catch (err) {

      console.log(err);

    }

  };

  // ================= SEND =================

  const send = async () => {

    if (
      !text.trim() ||
      !activeChat
    )
      return;

    setSending(true);

    const tempId =
      crypto.randomUUID();

    const optimistic = {

      id: tempId,

      sender_id: me.id,

      content: text,

      created_at:
        new Date().toISOString(),

      conversation_id:
        activeChat.conversation_id,

      status: "sending",

    };


    await sendNotification({

      title:
        "Message Sent",

      body:
        text,

    });

    setMessages((prev) => [
      ...prev,
      optimistic,
    ]);

    const messageText = text;

    setText("");

    const {
      data,
      error,
    } = await supabase

      .from("messages")

      .insert({

        conversation_id:
          activeChat.conversation_id,

        sender_id: me.id,

        content: messageText,

      })

      .select()

      .single();

    if (!error && data) {

      await saveMessage(
        data
      );

      const msgs =
        await getLocalMessages(
          conversationId
        );

      setMessages(
        msgs
      );

      setMessages((prev) =>

        prev.map((m) =>

          m.id === tempId
            ? data
            : m
        )
      );
    }

    setSending(false);
  };


  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-[#0f0f10]">

      {/* SIDEBAR */}

      <div
        className={`w-full md:w-[360px] border-r border-gray-200 dark:border-white/10 flex flex-col bg-white dark:bg-[#111] ${mobileChatOpen
          ? "hidden md:flex"
          : "flex"
          }`}
      >

        {/* TOP */}

        <div className="px-4 pt-6 pb-4 border-b border-gray-200 dark:border-white/10">

          <div className="flex justify-between items-center mb-4">

            <div className="flex items-center gap-3">

              <button
                onClick={onBack}
                className="h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center"
              >

                <ArrowLeft size={20} />

              </button>

              <h1 className="text-2xl font-black dark:text-white">
                Messages
              </h1>

            </div>

            <button
              onClick={signOut}
              className="h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center dark:text-white"
            >

              <LogOut size={18} />

            </button>

          </div>

          {/* SEARCH */}

          <div className="h-11 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center px-3">

            <Search
              size={16}
              className="text-gray-500"
            />

            <input
              className="ml-2 bg-transparent flex-1 outline-none text-sm dark:text-white"
              placeholder="Search chats"
            />

          </div>

        </div>

        {/* CHATS */}

        <div className="flex-1 overflow-y-auto">

          {chats.map((chat) => (

            <button
              key={
                chat.conversation_id
              }
              onClick={() =>
                openChat(chat)
              }
              className="w-full flex gap-3 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition"
            >
              {chat.avatar ? (
                <img
                  src={chat.avatar}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white flex items-center justify-center font-bold">
                  {chat.name
                    ?.charAt(0)
                    ?.toUpperCase()}
                </div>
              )}

              <div className="text-left flex-1 min-w-0 flex justify-between items-center gap-2">

                <div className="min-w-0 flex-1">

                  <div className="font-semibold dark:text-white truncate">

                    {chat.name}

                  </div>

                  <div className="text-sm text-gray-500 truncate">

                    {chat.lastMessage}

                  </div>

                </div>

                {chat.unreadCount > 0 && (

                  <div className="h-6 min-w-[24px] px-2 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">

                    {chat.unreadCount}

                  </div>

                )}

              </div>

            </button>
          ))}
        </div>

      </div>

      {/* CHAT */}

      <div
        className={`flex-1 flex flex-col bg-[#f5f7fb] dark:bg-[#0f0f10] ${mobileChatOpen
          ? "flex"
          : "hidden md:flex"
          }`}
      >

        {!activeChat ? (

          <div className="m-auto text-gray-400 text-center px-6">

            <h2 className="text-2xl font-black mb-2">
              Open a chat
            </h2>

            <p>
              Start messaging on
              SocialGist
            </p>

          </div>

        ) : (

          <>
            {/* HEADER */}

            <div className="bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/10 px-4 py-3 flex justify-between items-center">

              <div className="flex items-center gap-3">

                <button
                  onClick={() =>
                    setMobileChatOpen(
                      false
                    )
                  }
                  className="md:hidden h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center dark:text-white"
                >

                  <ArrowLeft
                    size={20}
                  />

                </button>

                <div>

                  <div className="font-bold dark:text-white">

                    {
                      activeChat.name
                    }

                  </div>

                  {typingUsers.length >
                    0 ? (

                    <div className="text-xs text-green-500 italic">

                      typing...

                    </div>

                  ) : (

                    <div className="text-xs text-green-500">

                      Active now

                    </div>
                  )}
                </div>

              </div>

              <button className="h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center dark:text-white">

                <MoreVertical
                  size={18}
                />

              </button>

            </div>

            {/* MESSAGES */}

            <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-2">

              {messages.map((m) => {

                const isMe =
                  m.sender_id ===
                  me?.id;

                return (

                  <div
                    key={m.id}
                    className={`flex ${isMe
                      ? "justify-end"
                      : "justify-start"
                      }`}
                  >

                    <div className="max-w-[75%] flex flex-col">

                      <div
                        className={`px-4 py-2.5 text-[14px] rounded-[22px] shadow-sm ${isMe
                          ? "bg-purple-600 text-white"
                          : "bg-white dark:bg-[#1b1b1d] border border-gray-200 dark:border-white/5 text-black dark:text-white"
                          }`}
                      >

                        {m.content}

                      </div>

                      <div
                        className={`text-[10px] mt-1 text-gray-500 ${isMe
                          ? "text-right"
                          : "text-left"
                          }`}
                      >

                        {formatTime(
                          m.created_at
                        )}

                      </div>

                    </div>

                  </div>
                );
              })}

              <div
                ref={messagesEndRef}
              />

            </div>

            {/* INPUT */}

            <div className="bg-white dark:bg-[#111] border-t border-gray-200 dark:border-white/10 p-3 flex gap-2">

              <input
                value={text}
                onChange={(e) => {

                  setText(
                    e.target.value
                  );

                  sendTyping();

                }}
                className="flex-1 bg-gray-100 dark:bg-white/5 rounded-full px-4 py-3 outline-none dark:text-white"
                placeholder="Message..."
              />

              <button
                onClick={send}
                disabled={sending}
                className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white flex items-center justify-center active:scale-95 transition disabled:opacity-50"
              >

                <Send size={18} />

              </button>

            </div>

          </>
        )}
      </div>
    </div>
  );
}