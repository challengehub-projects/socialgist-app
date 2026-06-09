import { useEffect, useState } from "react";
import { supabase } from "../configs/supbase";
import { FiEdit2, FiCheck, FiCamera, FiRefreshCw, FiArrowLeft } from "react-icons/fi";
import { nanoid } from "nanoid";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState({});
  const [loading, setLoading] = useState(true);

  // FETCH PROFILE
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (!userId) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error) {
        let updated = { ...data };

        // AUTO USERNAME GENERATOR
        if (!updated.username) {
          updated.username = "user_" + nanoid(6);

          await supabase
            .from("profiles")
            .update({ username: updated.username })
            .eq("id", userId);
        }

        setProfile(updated);
      }

      setLoading(false);
    };

    fetchProfile();
  }, []);


  useEffect(() => {
  const fetchProfile = async () => {

    const cached = sessionStorage.getItem("profile");

    if (cached) {
      setProfile(JSON.parse(cached));
      setLoading(false);
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;

    if (!userId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(data);

      sessionStorage.setItem(
        "profile",
        JSON.stringify(data)
      );
    }

    setLoading(false);
  };

  fetchProfile();
}, []);


  // UPDATE FIELD
  const updateField = async (field, value) => {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;

    const updated = { ...profile, [field]: value };
    setProfile(updated);

    await supabase
      .from("profiles")
      .update({ [field]: value, updated_at: new Date() })
      .eq("id", userId);
  };

  const toggleEdit = (field) => {
    setEditing((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const compressImage = (file, maxWidth = 600, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = (e) => {
        img.src = e.target.result;
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.\w+$/, ".jpg"),
              {
                type: "image/jpeg",
              }
            );

            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };
    });
  };

  // UPLOAD AVATAR
  const uploadAvatar = async (file) => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (!userId || !file) return;

      // COMPRESS IMAGE
      const compressedFile = await compressImage(
        file,
        600, // max width
        0.7 // quality
      );

      const fileName = `${userId}/${Date.now()}.jpg`;

      const { error } = await supabase.storage
        .from("profile-images")
        .upload(fileName, compressedFile, {
          upsert: true,
          contentType: "image/jpeg",
        });

      if (error) {
        console.error(error);
        return alert("Upload failed");
      }

      const { data } = supabase.storage
        .from("profile-images")
        .getPublicUrl(fileName);

      const url = data.publicUrl;

      setProfile((prev) => ({
        ...prev,
        avatar_url: url,
      }));

      await supabase
        .from("profiles")
        .update({
          avatar_url: url,
          updated_at: new Date(),
        })
        .eq("id", userId);

    } catch (err) {
      console.error(err);
    }
  };

  const regenerateUsername = async () => {
    const newName = "user_" + nanoid(6);
    await updateField("username", newName);
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-white px-4 py-8">
        <div className="max-w-xl mx-auto animate-pulse">

          {/* COVER SKELETON */}
          <div className="h-28 bg-gray-200 rounded-xl"></div>

          {/* AVATAR + NAME */}
          <div className="flex items-end gap-4 -mt-10 px-3">
            <div className="w-20 h-20 bg-gray-300 rounded-full border-4 border-white"></div>

            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-300 rounded"></div>
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-3 mt-6 gap-2">
            <div className="h-14 bg-gray-200 rounded-xl"></div>
            <div className="h-14 bg-gray-200 rounded-xl"></div>
            <div className="h-14 bg-gray-200 rounded-xl"></div>
          </div>

          {/* FIELDS */}
          <div className="mt-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-200 rounded-lg"
              ></div>
            ))}
          </div>

        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-screen flex items-center justify-center bg-white text-red-500">
        No profile found
      </div>
    );
  }

  const Field = ({ label, value, field }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-200">
      <div className="w-full">
        <p className="text-xs text-gray-400 uppercase">{label}</p>

        {editing[field] ? (
          <input
            className="w-full mt-1 border border-gray-300 px-2 py-1 rounded text-black outline-none"
            defaultValue={value || ""}
            onBlur={(e) => {
              updateField(field, e.target.value);
              toggleEdit(field);
            }}
            autoFocus
          />
        ) : (
          <p className="text-sm text-gray-900 mt-1">
            {value || "Not set"}
          </p>
        )}
      </div>

      <button
        onClick={() => toggleEdit(field)}
        className="text-gray-500 hover:text-black"
      >
        {editing[field] ? <FiCheck /> : <FiEdit2 />}
      </button>
    </div>
  );

  return (
    
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 text-black px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 mb-4">

  <div className="h-14 flex items-center gap-3 px-2">

    <button
      onClick={() => navigate(-1)}
      className="
        h-9
        w-9
        rounded-full
        hover:bg-gray-100
        flex
        items-center
        justify-center
        transition
      "
    >
      <FiArrowLeft size={20} />
    </button>

    <div>
      <h1 className="font-semibold">
        Profile
      </h1>

      <p className="text-xs text-gray-500">
        @{profile?.username}
      </p>
    </div>

  </div>

</div>

        {/* COVER */}
        <div className="h-32 rounded-2xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 shadow-sm border border-gray-200"></div>

        {/* PROFILE HEADER */}
        <div className="flex items-end gap-4 -mt-10 px-4">

          {/* AVATAR */}
          <div className="relative">
            <img
              src={
                profile.avatar_url ||
                "https://ui-avatars.com/api/?name=" + profile.full_name
              }
              className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-lg"
            />

            <label className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full border border-gray-200 cursor-pointer shadow hover:scale-105 transition">
              <FiCamera size={14} />
              <input
                type="file"
                hidden
                onChange={(e) => uploadAvatar(e.target.files[0])}
              />
            </label>
          </div>

          {/* NAME SECTION */}
          <div className="pb-2">
            <h1 className="text-xl font-semibold tracking-tight">
              {profile.full_name || "No name"}
            </h1>

            <p className="text-sm text-gray-500 flex items-center gap-2">
              @{profile.username}

              <button
                onClick={regenerateUsername}
                className="text-gray-400 hover:text-black transition"
              >
                <FiRefreshCw size={12} />
              </button>
            </p>
          </div>
        </div>

        {/* STATS CARD */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 grid grid-cols-3 text-center overflow-hidden">

          <div className="py-4">
            <p className="font-bold text-lg">{profile.posts_count || 0}</p>
            <p className="text-xs text-gray-500">Posts</p>
          </div>

          <div className="py-4 border-x border-gray-100">
            <p className="font-bold text-lg">{profile.followers_count || 0}</p>
            <p className="text-xs text-gray-500">Followers</p>
          </div>

          <div className="py-4">
            <p className="font-bold text-lg">{profile.following_count || 0}</p>
            <p className="text-xs text-gray-500">Following</p>
          </div>

        </div>

        {/* PROFILE FIELDS */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-1">

          <Field label="Bio" value={profile.bio} field="bio" />
          <Field label="Website" value={profile.website} field="website" />
          <Field label="Location" value={profile.location} field="location" />
          <Field label="Phone" value={profile.phone} field="phone" />
          <Field label="School" value={profile.school} field="school" />
          <Field label="Department" value={profile.department} field="department" />
          <Field label="Work" value={profile.work} field="work" />
          <Field label="Hobby" value={profile.hobby} field="hobby" />
          <Field
            label="Relationship"
            value={profile.relationship_status}
            field="relationship_status"
          />
          <Field label="Age" value={profile.age} field="age" />

        </div>

      </div>
    </div>
  );
}