"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const FOUNDER_UID = "6e7d3965-9eaa-4dea-a353-fa35c5e2a90d";

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type Post = {
  id: string;
  content: string;
  created_at: string;
};

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [isFounder, setIsFounder] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        router.replace("/");
        return;
      }

      const currentUser = authData.user;
      const founder = currentUser.id === FOUNDER_UID;

      setUser(currentUser);
      setIsFounder(founder);

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (profileData) {
        setProfile(profileData);

        setUsername(
          profileData.username || (founder ? "NexaOrigin" : "")
        );

        setFullName(
          profileData.full_name ||
          (founder ? "Abel Promise" : "")
        );

        setBio(profileData.bio || "");
      } else {
        setUsername(founder ? "NexaOrigin" : "");

        setFullName(
          founder
            ? "Abel Promise"
            : currentUser.user_metadata?.full_name || ""
        );

        setEditing(true);
      }

      const { data: postData, error: postError } =
        await supabase
          .from("posts")
          .select("id, content, created_at")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

      if (postError) {
        setError(postError.message);
      } else {
        setPosts(postData || []);
      }

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function saveProfile(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!user) return;

    setSaving(true);
    setError("");
    setMessage("");

    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setError("Please enter a username.");
      setSaving(false);
      return;
    }

    if (
      isFounder &&
      (cleanUsername.length > 50 || cleanUsername.length < 3)
    ) {
      setError("Your username must be between 3 and 50 characters.");
      setSaving(false);
      return;
    }

    if (
      !isFounder &&
      !/^[a-z0-9_]{3,20}$/i.test(cleanUsername)
    ) {
      setError(
        "Username must be 3–20 characters and contain only letters, numbers and underscores."
      );
      setSaving(false);
      return;
    }

    const profileData = {
      id: user.id,
      username: cleanUsername,
      full_name: fullName.trim(),
      bio: bio.trim(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(profileData, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      setError(
        error.code === "23505"
          ? "That username is already taken. Choose another."
          : error.message
      );
    } else {
      setProfile(data);
      setUsername(data.username || "");
      setFullName(data.full_name || "");
      setBio(data.bio || "");
      setEditing(false);

      setMessage(
        "Your NEXA profile has been updated successfully!"
      );
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#100909] text-white flex items-center justify-center">
        Loading your NEXA identity...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#100909] text-white">

      <header className="border-b border-red-900/40 px-6 py-5 flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-[5px] text-red-500">
          NEXA
        </h1>

        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-gray-300 hover:text-red-400"
        >
          Dashboard →
        </button>
      </header>

      <section className="max-w-4xl mx-auto px-5 py-12">

        <div className="mb-10">
          <p className="text-red-500 text-sm tracking-widest">
            YOUR DIGITAL IDENTITY
          </p>

          <h2 className="text-4xl font-bold mt-3">
            My Profile
          </h2>

          <p className="text-gray-400 mt-2">
            Your identity. Your story. Your universe.
          </p>
        </div>

        <div className="bg-[#211313] border border-red-900/40 rounded-3xl p-8 mb-8">

          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">

            <div className="w-24 h-24 rounded-full bg-red-800 border-4 border-red-500/40 flex items-center justify-center text-4xl font-bold shadow-lg shadow-red-900/30">
              {(profile?.full_name || fullName || "N")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="text-center sm:text-left">

              <h3 className="text-2xl font-bold">
                {profile?.full_name || fullName || "NEXA Member"}
              </h3>

              <p className="text-red-400 mt-1">
                @{profile?.username || username || "username"}
              </p>

              {isFounder && (
                <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-red-950 border border-red-500/50 text-red-300 text-xs font-bold tracking-widest">
                  👑 FOUNDER & CEO
                </div>
              )}

            </div>

          </div>

          {editing ? (

            <form onSubmit={saveProfile} className="space-y-5">

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Display Name
                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your display name"
                  required
                  maxLength={80}
                  className="w-full bg-[#160d0d] border border-red-900/40 rounded-xl p-4 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Username
                </label>

                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="NexaOrigin"
                  required
                  maxLength={isFounder ? 50 : 20}
                  className="w-full bg-[#160d0d] border border-red-900/40 rounded-xl p-4 outline-none focus:border-red-500"
                />

                <p className="text-xs text-gray-500 mt-2">
                  {isFounder
                    ? "Founder privilege: Choose your username and change it whenever you like."
                    : "3–20 characters. Letters, numbers and underscores only."}
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  About Me
                </label>

                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the NEXA community about yourself..."
                  maxLength={300}
                  className="w-full min-h-28 bg-[#160d0d] border border-red-900/40 rounded-xl p-4 outline-none focus:border-red-500 resize-none"
                />

                <p className="text-xs text-gray-500 mt-1">
                  {bio.length}/300
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="bg-red-700 hover:bg-red-600 disabled:opacity-50 px-8 py-3 rounded-xl font-semibold transition"
              >
                {saving ? "Saving..." : "Save Profile →"}
              </button>

              {profile && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="ml-3 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              )}

            </form>

          ) : (

            <div>

              <div className="border-t border-red-900/30 pt-6">

                <h4 className="font-semibold text-red-400 mb-3">
                  About Me
                </h4>

                <p className="text-gray-300 whitespace-pre-wrap">
                  {profile?.bio || "You haven't added a bio yet."}
                </p>

              </div>

              <button
                onClick={() => setEditing(true)}
                className="mt-7 bg-red-700 hover:bg-red-600 px-7 py-3 rounded-xl font-semibold transition"
              >
                Edit Profile ✎
              </button>

            </div>

          )}

          {message && (
            <p className="mt-5 text-green-400 text-sm">
              ✓ {message}
            </p>
          )}

          {error && (
            <p className="mt-5 text-red-400 text-sm">
              ⚠ {error}
            </p>
          )}

        </div>

        <div className="bg-[#211313] border border-red-900/40 rounded-3xl p-8">

          <div className="flex justify-between items-center mb-7">

            <h3 className="text-2xl font-bold">
              My Posts
            </h3>

            <span className="text-red-400 text-sm">
              {posts.length} Posts
            </span>

          </div>

          {posts.length === 0 ? (

            <div className="text-center py-12">

              <p className="text-gray-400">
                Your story starts here.
              </p>

              <button
                onClick={() => router.push("/feed")}
                className="mt-5 text-red-400 hover:text-red-300"
              >
                Create your first post →
              </button>

            </div>

          ) : (

            <div className="space-y-4">

              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-[#160d0d] border border-red-900/30 rounded-2xl p-5"
                >

                  <p className="text-gray-200 whitespace-pre-wrap">
                    {post.content}
                  </p>

                  <p className="text-xs text-gray-500 mt-4">
                    {new Date(post.created_at).toLocaleString()}
                  </p>

                </article>
              ))}

            </div>

          )}

        </div>

        <div className="flex gap-4 mt-8">

          <button
            onClick={() => router.push("/feed")}
            className="text-red-400 hover:text-red-300"
          >
            ← Back to Feed
          </button>

        </div>

      </section>

      <footer className="text-center text-xs text-gray-600 py-8">
        © 2026 NEXA · ONE UNIVERSE. ENDLESS POSSIBILITIES.
      </footer>

    </main>
  );
}