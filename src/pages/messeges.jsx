import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { supabase } from "../configs/supbase";

import {
  ArrowLeft,
  Send,
  LogOut,
  Search,
  MoreVertical,
} from "lucide-react";

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

  // ================= SIGN OUT =================

  const signOut = async () => {

    await supabase.auth.signOut();

    window.location.reload();

  };

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

  const loadChats = async (
    userId
  ) => {

    const { data, error } =
      await supabase
        .from("conversation_members")
        .select(`
          conversation_id,
          conversations (
            id
          )
        `)
        .eq("user_id", userId);

    if (error) {
      console.log(error);
      return;
    }

    const formatted =
      await Promise.all(

        (data || []).map(
          async (item, index) => {

            const convo =
              item.conversations;

            const {
              data: lastMsg,
            } = await supabase
              .from("messages")
              .select("*")
              .eq(
                "conversation_id",
                convo.id
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
                convo.id,

              name:
                `Chat ${index + 1}`,

              lastMessage:
                lastMsg?.content ||
                "Start chatting",

            };
          }
        )
      );

    setChats(formatted);
  };

  // ================= LOAD MESSAGES =================

  const loadMessages = async (
    conversationId
  ) => {

    const { data, error } =
      await supabase
        .from("messages")
        .select("*")
        .eq(
          "conversation_id",
          conversationId
        )
        .order("created_at", {
          ascending: true,
        });

    if (error) {
      console.log(error);
      return;
    }

    setMessages(data || []);
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

    await loadMessages(
      chat.conversation_id
    );

    setupTyping(
      chat.conversation_id
    );
  };

  // ================= TYPING =================

  const setupTyping = (
    conversationId
  ) => {

    if (channelRef.current) {

      supabase.removeChannel(
        channelRef.current
      );

    }

    const channel =
      supabase.channel(
        `typing-${conversationId}`
      );

    channel

      .on(
        "broadcast",
        {
          event: "typing",
        },

        ({ payload }) => {

          if (
            payload.userId ===
            me?.id
          )
            return;

          setTypingUsers([
            payload.userId,
          ]);

          clearTimeout(
            typingTimeoutRef.current
          );

          typingTimeoutRef.current =
            setTimeout(() => {

              setTypingUsers([]);

            }, 1500);
        }
      )

      .subscribe();

    channelRef.current =
      channel;
  };

  const sendTyping = () => {

    if (
      !channelRef.current ||
      !me
    )
      return;

    channelRef.current.send({

      type: "broadcast",

      event: "typing",

      payload: {
        userId: me.id,
      },

    });
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
        className={`w-full md:w-[360px] border-r border-gray-200 dark:border-white/10 flex flex-col bg-white dark:bg-[#111] ${
          mobileChatOpen
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

              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white flex items-center justify-center font-bold">

                {chat.name
                  .charAt(0)
                  .toUpperCase()}

              </div>

              <div className="text-left flex-1 min-w-0">

                <div className="font-semibold dark:text-white truncate">

                  {chat.name}

                </div>

                <div className="text-sm text-gray-500 truncate">

                  {chat.lastMessage}

                </div>

              </div>

            </button>
          ))}
        </div>

      </div>

      {/* CHAT */}

      <div
        className={`flex-1 flex flex-col bg-[#f5f7fb] dark:bg-[#0f0f10] ${
          mobileChatOpen
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
                    className={`flex ${
                      isMe
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <div className="max-w-[75%] flex flex-col">

                      <div
                        className={`px-4 py-2.5 text-[14px] rounded-[22px] shadow-sm ${
                          isMe
                            ? "bg-purple-600 text-white"
                            : "bg-white dark:bg-[#1b1b1d] border border-gray-200 dark:border-white/5 text-black dark:text-white"
                        }`}
                      >

                        {m.content}

                      </div>

                      <div
                        className={`text-[10px] mt-1 text-gray-500 ${
                          isMe
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