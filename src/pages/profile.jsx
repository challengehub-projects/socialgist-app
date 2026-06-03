import React, { useState } from "react";

import {
Camera,
Edit3,
Link,
MapPin,
Briefcase,
ArrowLeft,
Heart,
GraduationCap,
Cake,
Users,
Globe,
Calendar,
Share2,
} from "lucide-react";

export default function ProfilePage({
onNavigate,
}) {
const [activeTab, setActiveTab] =
useState("posts");

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
"Campus WiFi still acting like it's on strike 😭",
time: "1d",
},
];

const user = {
name: "Prince",
username: "@socialgist",

bio: "Building SocialGist • Computer Science Student • Love tech, memes & campus gist 💜",

location: "Imo State, Nigeria",
work: "Student Developer",
website: "socialgist.app",

age: 22,
department:
  "Computer Science",
school:
  "Federal University of Technology",
relationship: "Single",
hobby:
  "Coding, Football, Gaming",
joined: "January 2026",

followers: 2400,
following: 180,
posts: posts.length,

avatar:
  "https://i.pravatar.cc/150?img=12",

cover:
  "https://images.unsplash.com/photo-1503264116251-35a269479413?w=1200",

};

return ( <div className="min-h-screen bg-gray-100">

  {/* TOP BAR */}

  <div className="sticky top-0 z-50 bg-white shadow-sm">

    <div className="max-w-5xl mx-auto h-16 px-4 flex items-center gap-4">

      <button
        onClick={() =>
          onNavigate("feed")
        }
        className="h-10 w-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div>

        <h2 className="font-bold">
          {user.name}
        </h2>

        <p className="text-xs text-gray-500">
          {user.posts} Posts
        </p>

      </div>

    </div>

  </div>

  {/* COVER */}

  <div className="relative h-64 md:h-80">

    <img
      src={user.cover}
      alt=""
      className="w-full h-full object-cover"
    />

    <button className="absolute bottom-4 right-4 bg-black/50 text-white p-3 rounded-full">
      <Camera className="h-5 w-5" />
    </button>

  </div>

  <div className="max-w-5xl mx-auto px-4 pb-10">

    {/* PROFILE */}

    <div className="relative flex flex-col md:flex-row md:justify-between md:items-end">

      <div className="-mt-16 flex items-end gap-4">

        <div className="relative">

          <img
            src={user.avatar}
            alt=""
            className="h-32 w-32 rounded-full border-4 border-white object-cover"
          />

          <button className="absolute bottom-2 right-2 bg-purple-600 text-white p-2 rounded-full">
            <Camera className="h-4 w-4" />
          </button>

        </div>

        <div>

          <h1 className="text-3xl font-bold">
            {user.name}
          </h1>

          <p className="text-gray-500">
            {user.username}
          </p>

        </div>

      </div>

      <div className="mt-4 flex gap-2">

        <button className="bg-purple-600 text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2">
          <Edit3 className="h-4 w-4" />
          Edit Profile
        </button>

        <button className="bg-white border px-5 py-3 rounded-xl font-semibold flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </button>

      </div>

    </div>

    {/* STATS */}

    <div className="mt-6 bg-white rounded-3xl p-5 shadow-sm grid grid-cols-3 text-center">

      <div>
        <h3 className="font-black text-xl">
          {user.posts}
        </h3>
        <p className="text-xs text-gray-500">
          Posts
        </p>
      </div>

      <div>
        <h3 className="font-black text-xl">
          {user.followers}
        </h3>
        <p className="text-xs text-gray-500">
          Followers
        </p>
      </div>

      <div>
        <h3 className="font-black text-xl">
          {user.following}
        </h3>
        <p className="text-xs text-gray-500">
          Following
        </p>
      </div>

    </div>

    {/* ABOUT */}

    <div className="mt-4 bg-white rounded-3xl p-6 shadow-sm">

      <h2 className="font-bold text-lg mb-4">
        About Me
      </h2>

      <p className="text-gray-700 mb-5">
        {user.bio}
      </p>

      <div className="space-y-3">

        <div className="flex items-center gap-3">
          <MapPin size={16} />
          {user.location}
        </div>

        <div className="flex items-center gap-3">
          <Briefcase size={16} />
          {user.work}
        </div>

        <div className="flex items-center gap-3">
          <GraduationCap size={16} />
          {user.department}
        </div>

        <div className="flex items-center gap-3">
          <Cake size={16} />
          {user.age} Years Old
        </div>

        <div className="flex items-center gap-3">
          <Heart size={16} />
          {user.relationship}
        </div>

        <div className="flex items-center gap-3">
          <Users size={16} />
          {user.hobby}
        </div>

        <div className="flex items-center gap-3">
          <Calendar size={16} />
          Joined {user.joined}
        </div>

        <div className="flex items-center gap-3 text-purple-600">
          <Globe size={16} />
          {user.website}
        </div>

      </div>

    </div>

    {/* SOCIALGIST ACTIVITY */}

    <div className="mt-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-3xl p-6">

      <h2 className="font-bold text-lg mb-4">
        SocialGist Activity
      </h2>

      <div className="grid grid-cols-2 gap-4">

        <div className="bg-white/10 rounded-2xl p-4">
          <div className="text-3xl font-black">
            {user.posts}
          </div>
          <div>Total Posts</div>
        </div>

        <div className="bg-white/10 rounded-2xl p-4">
          <div className="text-3xl font-black">
            {user.followers}
          </div>
          <div>Followers</div>
        </div>

        <div className="bg-white/10 rounded-2xl p-4">
          <div className="text-3xl font-black">
            {user.following}
          </div>
          <div>Following</div>
        </div>

        <div className="bg-white/10 rounded-2xl p-4">
          <div className="text-3xl font-black">
            🔥
          </div>
          <div>Active Member</div>
        </div>

      </div>

    </div>

    {/* TABS */}

    <div className="mt-6 flex gap-2 bg-white p-2 rounded-2xl">

      {[
        "posts",
        "about",
        "photos",
      ].map((tab) => (

        <button
          key={tab}
          onClick={() =>
            setActiveTab(tab)
          }
          className={`flex-1 py-3 rounded-xl font-semibold ${
            activeTab === tab
              ? "bg-purple-600 text-white"
              : "text-gray-600"
          }`}
        >
          {tab}
        </button>

      ))}

    </div>

    <div className="mt-6">

      {activeTab === "posts" &&
        posts.map((p) => (

          <div
            key={p.id}
            className="bg-white p-5 rounded-2xl shadow-sm mb-4"
          >

            <p>
              {p.content}
            </p>

            <p className="text-xs text-gray-400 mt-2">
              {p.time} ago
            </p>

          </div>

        ))}

      {activeTab === "about" && (

        <div className="bg-white rounded-2xl p-5">

          Full profile information goes here.

        </div>

      )}

      {activeTab === "photos" && (

        <div className="grid grid-cols-2 gap-3">

          {[1, 2, 3, 4].map(
            (i) => (

              <img
                key={i}
                src={`https://picsum.photos/500/500?random=${i}`}
                alt=""
                className="rounded-2xl h-40 object-cover w-full"
              />

            )
          )}

        </div>

      )}

    </div>

  </div>

</div>

);
}
