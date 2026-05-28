import React, { useState } from "react";
import {
  Camera,
  Edit3,
  Link,
  MapPin,
  Briefcase,
} from "lucide-react";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("posts");

  const user = {
    name: "Prince",
    username: "@socialgist",
    bio: "Building SocialGist • Computer Science Student • Love tech, memes & campus gist 💜",
    location: "Imo State, Nigeria",
    work: "Student Developer",
    website: "socialgist.app",
    followers: 2400,
    following: 180,
    posts: 120,
    avatar: "https://i.pravatar.cc/150?img=12",
    cover:
      "https://images.unsplash.com/photo-1503264116251-35a269479413?w=1200",
  };

  const posts = [
    {
      id: 1,
      content:
        "Still building SocialGist. One day this will be everywhere 🔥",
      time: "2h",
    },
    {
      id: 2,
      content:
        "Campus WiFi still acting like it’s on strike 😭",
      time: "1d",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ================= COVER ================= */}
      <div className="relative h-64 md:h-80 bg-gray-300">

        <img
          src={user.cover}
          className="w-full h-full object-cover"
        />

        <button className="absolute bottom-3 right-3 bg-black/50 text-white p-2 rounded-full">
          <Camera className="h-4 w-4" />
        </button>
      </div>

      {/* ================= PROFILE HEADER ================= */}
      <div className="max-w-4xl mx-auto px-4">

        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between">

          {/* PROFILE PIC */}
          <div className="-mt-16 flex items-end gap-4">

            <div className="relative">
              <img
                src={user.avatar}
                className="h-32 w-32 rounded-full border-4 border-white object-cover"
              />

              <button className="absolute bottom-2 right-2 bg-purple-600 p-2 rounded-full text-white">
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-gray-500">{user.username}</p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-4 md:mt-0 flex gap-2">
            <button className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </button>

            <button className="bg-gray-200 px-4 py-2 rounded-xl text-sm">
              Share Profile
            </button>
          </div>
        </div>

        {/* ================= STATS ================= */}
        <div className="mt-6 grid grid-cols-3 text-center bg-white rounded-2xl p-4 shadow-sm">
          <div>
            <p className="font-bold">{user.posts}</p>
            <p className="text-xs text-gray-500">Posts</p>
          </div>
          <div>
            <p className="font-bold">{user.followers}</p>
            <p className="text-xs text-gray-500">Followers</p>
          </div>
          <div>
            <p className="font-bold">{user.following}</p>
            <p className="text-xs text-gray-500">Following</p>
          </div>
        </div>

        {/* ================= INFO CARD ================= */}
        <div className="mt-4 bg-white rounded-2xl p-4 space-y-2 text-sm">

          <p className="text-gray-700">{user.bio}</p>

          <div className="flex items-center gap-2 text-gray-500">
            <MapPin className="h-4 w-4" />
            {user.location}
          </div>

          <div className="flex items-center gap-2 text-gray-500">
            <Briefcase className="h-4 w-4" />
            {user.work}
          </div>

          <div className="flex items-center gap-2 text-purple-600">
            <Link className="h-4 w-4" />
            {user.website}
          </div>
        </div>

        {/* ================= TABS ================= */}
        <div className="mt-6 flex gap-2 bg-white p-2 rounded-2xl">
          {["posts", "about", "photos"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold ${
                activeTab === tab
                  ? "bg-purple-600 text-white"
                  : "text-gray-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ================= TAB CONTENT ================= */}
        <div className="mt-6 space-y-4">

          {/* POSTS TAB */}
          {activeTab === "posts" &&
            posts.map((p) => (
              <div
                key={p.id}
                className="bg-white p-4 rounded-2xl shadow-sm"
              >
                <p className="text-sm">{p.content}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {p.time} ago
                </p>
              </div>
            ))}

          {/* ABOUT TAB */}
          {activeTab === "about" && (
            <div className="bg-white p-4 rounded-2xl text-sm text-gray-600">
              This is the about section. You can expand this later into full profile editing, skills, education, etc.
            </div>
          )}

          {/* PHOTOS TAB */}
          {activeTab === "photos" && (
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <img
                  key={i}
                  src={`https://source.unsplash.com/400x400/?tech,${i}`}
                  className="rounded-xl object-cover h-32 w-full"
                />
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}