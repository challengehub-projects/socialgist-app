import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../configs/supbase";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  LogOut,
  Search,
  Phone,
  Video,
  MoreVertical,
  Reply,
  Smile,
  Copy,
  Trash2,
} from "lucide-react";

export default function Messages() {
  const location = useLocation();
  const navigate = useNavigate();

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const channelRef = useRef(null);

  const [me, setMe] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const [replyTo, setReplyTo] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  // ✅ typing state FIXED
  const [typingUsers, setTypingUsers] = useState([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  useEffect(() => {
    const initUser = async () => {
      const { data } = await supabase.auth.getUser();
      setMe(data?.user || null);
    };
    initUser();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const loadChats = async (userId) => {
    const { data } = await supabase
      .from("conversation_members")
      .select(`conversation_id, conversations ( id )`)
      .eq("user_id", userId);

    const formatted = await Promise.all(
      data.map(async (item, index) => {
        const convo = item.conversations;

        const { data: lastMsg } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", convo.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          conversation_id: convo.id,
          name: `User ${index + 1}`,
          lastMessage: lastMsg?.content || "Start chatting",
        };
      })
    );

    setChats(formatted);
  };

  const loadMessages = async (conversationId) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  };

  useEffect(() => {
    if (me?.id) loadChats(me.id);
  }, [me]);

  const openChat = async (chat) => {
    setActiveChat(chat);
    setMobileChatOpen(true);
    await loadMessages(chat.conversation_id);
    setupTyping(chat.conversation_id);
  };

  // ================= FIXED TYPING SYSTEM =================
  const setupTyping = (conversationId) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`typing-${conversationId}`);

    channel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.userId === me?.id) return;

        setTypingUsers([payload.userId]);

        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUsers([]);
        }, 1500);
      })
      .subscribe();

    channelRef.current = channel;
  };

  const sendTyping = () => {
    if (!channelRef.current || !me) return;

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
    if (!text.trim() || !activeChat) return;

    setSending(true);

    const tempId = crypto.randomUUID();

    const optimistic = {
      id: tempId,
      sender_id: me.id,
      content: text,
      created_at: new Date().toISOString(),
      conversation_id: activeChat.conversation_id,
      status: "sending",
      reply_to: replyTo,
    };

    setMessages((prev) => [...prev, optimistic]);

    const messageText = text;
    setText("");
    setReplyTo(null);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: activeChat.conversation_id,
        sender_id: me.id,
        content: messageText,
        reply_to: replyTo?.id || null,
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? data : m))
      );
    }

    setSending(false);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-white">

      {/* SIDEBAR */}
      <div className={`w-full md:w-[360px] border-r flex flex-col ${mobileChatOpen ? "hidden md:flex" : "flex"}`}>
        <div className="px-4 pt-6 pb-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-black">Messages</h1>
            <button onClick={signOut}>
              <LogOut size={16} />
            </button>
          </div>

          <div className="h-11 bg-gray-100 rounded-xl flex items-center px-3">
            <Search size={16} />
            <input className="ml-2 bg-transparent flex-1 outline-none text-sm" placeholder="Search" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <button
              key={chat.conversation_id}
              onClick={() => openChat(chat)}
              className="w-full flex gap-3 p-4 hover:bg-gray-50"
            >
              <div className="h-12 w-12 rounded-full bg-purple-500 text-white flex items-center justify-center">
                {chat.name.charAt(0)}
              </div>

              <div className="text-left flex-1">
                <div className="font-semibold">{chat.name}</div>
                <div className="text-sm text-gray-500 truncate">{chat.lastMessage}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CHAT */}
      <div className={`flex-1 flex flex-col bg-[#f5f7fb] ${mobileChatOpen ? "flex" : "hidden md:flex"}`}>

        {!activeChat ? (
          <div className="m-auto text-gray-400">Open a chat</div>
        ) : (
          <>
            {/* HEADER */}
            <div className="bg-white border-b px-4 py-3 flex justify-between items-center">
              <div>
                <div className="font-bold">{activeChat.name}</div>

                {/* ✅ TYPING FIX HERE */}
                {typingUsers.length > 0 ? (
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

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-2">

              {messages.map((m) => {
                const isMe = m.sender_id === me?.id;

                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>

                    <div className="max-w-[75%] flex flex-col">
                      <div className={`px-3 py-2 text-[14px] rounded-[18px]
                        ${isMe ? "bg-purple-600 text-white" : "bg-white border text-black"}`}>
                        {m.content}
                      </div>
                    </div>

                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <div className="bg-white border-t p-3 flex gap-2">

              <input
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  sendTyping(); // ✅ FIXED
                }}
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 outline-none"
                placeholder="Message..."
              />

              <button
                onClick={send}
                className="bg-purple-600 text-white px-4 rounded-full"
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