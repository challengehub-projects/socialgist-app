import React, { useState } from "react";
import {
  Heart,
  MessageSquare,
  UserPlus,
  Share2,
  Bell,
  CheckCheck,
} from "lucide-react";

export default function NotificationsPage() {
  const [filter, setFilter] = useState("all");

  const notifications = [
    {
      id: 1,
      type: "like",
      user: "Tariq Ibrahim",
      avatar: "https://i.pravatar.cc/150?img=1",
      text: "liked your post about campus WiFi crash",
      time: "2m",
      unread: true,
    },
    {
      id: 2,
      type: "comment",
      user: "Anonymous Crush",
      avatar: "https://i.pravatar.cc/150?img=5",
      text: "commented: ‘I feel this 😭’",
      time: "15m",
      unread: true,
    },
    {
      id: 3,
      type: "follow",
      user: "Chloe Vance",
      avatar: "https://i.pravatar.cc/150?img=8",
      text: "started following you",
      time: "1h",
      unread: false,
    },
    {
      id: 4,
      type: "share",
      user: "Study Group",
      avatar: "https://i.pravatar.cc/150?img=12",
      text: "shared your post in the group",
      time: "3h",
      unread: false,
    },
  ];

  const getIcon = (type) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case "share":
        return <Share2 className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const filtered = notifications.filter((n) =>
    filter === "all" ? true : n.type === filter
  );

  return (
    <div className="max-w-xl mx-auto p-4 space-y-5">

      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bell className="h-5 w-5 text-purple-600" />
          Notifications
        </h1>

        <button className="text-xs text-purple-600 font-semibold flex items-center gap-1">
          <CheckCheck className="h-4 w-4" />
          Mark all read
        </button>
      </div>

      {/* ================= FILTER TABS ================= */}
      <div className="flex gap-2 bg-purple-100 p-1 rounded-2xl overflow-x-auto">
        {["all", "like", "comment", "follow", "share"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl capitalize whitespace-nowrap ${
              filter === tab
                ? "bg-purple-600 text-white"
                : "text-purple-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ================= NOTIFICATIONS LIST ================= */}
      <div className="space-y-3">
        {filtered.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 p-4 rounded-2xl border transition
              ${
                n.unread
                  ? "bg-purple-50 border-purple-100"
                  : "bg-white border-gray-100"
              }`}
          >

            {/* AVATAR */}
            <div className="relative">
              <img
                src={n.avatar}
                className="h-11 w-11 rounded-full object-cover"
              />

              <span className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow">
                {getIcon(n.type)}
              </span>
            </div>

            {/* CONTENT */}
            <div className="flex-1">
              <p className="text-sm text-gray-800">
                <span className="font-bold">{n.user}</span>{" "}
                {n.text}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                {n.time} ago
              </p>
            </div>

            {/* UNREAD DOT */}
            {n.unread && (
              <span className="h-2.5 w-2.5 bg-purple-600 rounded-full mt-2" />
            )}
          </div>
        ))}
      </div>

      {/* EMPTY STATE */}
      {filtered.length === 0 && (
        <div className="text-center text-gray-400 py-10">
          No notifications here
        </div>
      )}
    </div>
  );
}