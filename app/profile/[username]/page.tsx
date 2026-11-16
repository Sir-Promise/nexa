"use client";

import { Suspense, useEffect, useState } from "react"; import { useParams, useRouter } from "next/navigation"; import { supabase } from "../../../lib/supabase";

const FOUNDER_UID = "6e7d3965-9eaa-4dea-a353-fa35c5e2a90d";

type Profile = { id: string; username: string | null; full_name: string | null; bio: string | null; avatar_url: string | null; };

type Post = { id: string; content: string; created_at: string; };

function PublicProfileContent() { const params = useParams<{ username: string }>(); const router = useRouter();

const username = decodeURIComponent(params.username);

const [profile, setProfile] = useState<Profile | null>(null); const [posts, setPosts] = useState<Post[]>([]);

const [currentUserId, setCurrentUserId] = useState<string | null>(null); const [isFollowing, setIsFollowing] = useState(false);

const [followers, setFollowers] = useState(0); const [following, setFollowing] = useState(0);

const [loading, setLoading] = useState(true); const [followLoading, setFollowLoading] = useState(false); const [error, setError] = useState("");

useEffect(() => { let cancelled = false;

async function loadPublicProfile() {
  setLoading(true);
  setError("");

  const { data: authData } = await supabase.auth.getUser();

  if (cancelled) return;

  const viewerId = authData.user?.id || null;
  setCurrentUserId(viewerId);

  const { data: profileData, error: profileError } =
    await supabase
      .from("profiles")
      .select("id, username, full_name, bio, avatar_url")
      .eq("username", username)
      .maybeSingle();

  if (cancelled) return;

  if (profileError) {
    setError(profileError.message);
    setLoading(false);
    return;
  }

  if (!profileData) {
    setProfile(null);
    setLoading(false);
    return;
  }

  setProfile(profileData);

  const [
    followersResult,
    followingResult,
    postsResult,
    followResult,
  ] = await Promise.all([
    supabase
      .from("user_follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", profileData.id),

    supabase
      .from("user_follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", profileData.id),

    supabase
      .from("posts")
      .select("id, content, created_at")
      .eq("user_id", profileData.id)
      .order("created_at", { ascending: false }),

    viewerId && viewerId !== profileData.id
      ? supabase
          .from("user_follows")
          .select("id")
          .eq("follower_id", viewerId)
          .eq("following_id", profileData.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (cancelled) return;

  const queryError =
    followersResult.error ||
    followingResult.error ||
    postsResult.error ||
    followResult.error;

  if (queryError) {
    setError(queryError.message);
    setLoading(false);
    return;
  }

  setFollowers(followersResult.count || 0);
  setFollowing(followingResult.count || 0);
  setPosts(postsResult.data || []);
  setIsFollowing(!!followResult.data);

  setLoading(false);
}

loadPublicProfile();

return () => {
  cancelled = true;
};


}, [username]);

async function toggleFollow() { if (!profile || !currentUserId || followLoading) return;

if (currentUserId === profile.id) return;

setFollowLoading(true);
setError("");

if (isFollowing) {
  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", currentUserId)
    .eq("following_id", profile.id);

  if (error) {
    setError(error.message);
  } else {
    setIsFollowing(false);
    setFollowers((count) => Math.max(0, count - 1));
  }
} else {
  const { error } = await supabase
    .from("user_follows")
    .insert({
      follower_id: currentUserId,
      following_id: profile.id,
    });

  if (error) {
    setError(error.message);
  } else {
    setIsFollowing(true);
    setFollowers((count) => count + 1);
  }
}

setFollowLoading(false);


}

if (loading) { return ( <main className="min-h-screen bg-[#100909] text-white flex items-center justify-center"> Loading NEXA profile... </main> ); }

if (error && !profile) { return ( <main className="min-h-screen bg-[#100909] text-white flex flex-col items-center justify-center px-5"> <p className="text-red-400">{error}</p>

    <button
      onClick={() => router.push("/feed")}
      className="mt-5 text-red-400"
    >
      Back to Feed
    </button>
  </main>
);


}

if (!profile) { return ( <main className="min-h-screen bg-[#100909] text-white flex flex-col items-center justify-center"> <h2 className="text-3xl font-bold"> Profile Not Found </h2>

    <p className="text-gray-400 mt-3">
      This NEXA member does not exist.
    </p>

    <button
      onClick={() => router.push("/feed")}
      className="mt-6 bg-red-700 px-6 py-3 rounded-xl"
    >
      Return to Feed
    </button>
  </main>
);


}

const isFounder = profile.id === FOUNDER_UID;

const displayName = profile.full_name || profile.username || "NEXA Member";

return ( <main className="min-h-screen bg-[#100909] text-white">

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

  <section className="max-w-3xl mx-auto px-5 py-12">

    <div className="bg-[#211313] border border-red-900/40 rounded-3xl p-8 mb-10">

      <div className="flex flex-col sm:flex-row items-center gap-6">

        <div className="w-28 h-28 rounded-full bg-red-800 border-4 border-red-500/40 flex items-center justify-center text-5xl font-bold">
          {displayName.charAt(0).toUpperCase()}
        </div>

        <div className="text-center sm:text-left">

          <h2 className="text-3xl font-bold">
            {displayName}
          </h2>

          <p className="text-red-400 mt-2">
            @{profile.username}
          </p>

          {isFounder && (
            <div className="inline-flex items-center mt-3 px-4 py-2 rounded-full bg-red-950 border border-red-500/50 text-red-300 text-xs font-bold tracking-widest">
              👑 NEXA FOUNDER & CEO
            </div>
          )}

          {currentUserId !== profile.id && (
            <div className="mt-5">

              {currentUserId ? (
                <button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  className={`px-7 py-3 rounded-xl font-semibold transition disabled:opacity-50 ${
                    isFollowing
                      ? "bg-[#160d0d] border border-red-500 text-red-400 hover:bg-red-950"
                      : "bg-red-700 hover:bg-red-600 text-white"
                  }`}
                >
                  {followLoading
                    ? "Please wait..."
                    : isFollowing
                      ? "Following ✓"
                      : "Follow +"}
                </button>
              ) : (
                <button
                  onClick={() => router.push("/")}
                  className="bg-red-700 hover:bg-red-600 px-7 py-3 rounded-xl font-semibold"
                >
                  Sign in to Follow
                </button>
              )}

            </div>
          )}

        </div>

      </div>

      <div className="grid grid-cols-2 gap-4 mt-9 border-t border-red-900/30 pt-7">

        <div className="text-center">
          <p className="text-3xl font-bold text-white">
            {followers}
          </p>

          <p className="text-sm text-gray-400 mt-1">
            Followers
          </p>
        </div>

        <div className="text-center">
          <p className="text-3xl font-bold text-white">
            {following}
          </p>

          <p className="text-sm text-gray-400 mt-1">
            Following
          </p>
        </div>

      </div>

      <div className="border-t border-red-900/30 mt-7 pt-6">

        <h3 className="font-semibold text-red-400 mb-3">
          About
        </h3>

        <p className="text-gray-300 whitespace-pre-wrap">
          {profile.bio || "This member hasn't added a bio yet."}
        </p>

      </div>

    </div>

    {error && (
      <div className="bg-red-950 border border-red-700 rounded-xl p-4 mb-6 text-red-300">
        {error}
      </div>
    )}

    <div className="flex justify-between items-center mb-7">

      <h3 className="text-2xl font-bold">
        Posts
      </h3>

      <span className="text-red-400 text-sm">
        {posts.length} Posts
      </span>

    </div>

    {posts.length === 0 ? (

      <div className="text-center py-16 bg-[#211313] rounded-2xl border border-red-900/30">

        <h3 className="text-xl font-semibold">
          Nothing here yet.
        </h3>

        <p className="text-gray-400 mt-2">
          This member hasn't shared any posts.
        </p>

      </div>

    ) : (

      <div className="space-y-5">

        {posts.map((post) => (

          <article
            key={post.id}
            className="bg-[#211313] border border-red-900/30 rounded-2xl p-6"
          >

            <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>

            <p className="text-xs text-gray-500 mt-5">
              {new Date(post.created_at).toLocaleString()}
            </p>

          </article>

        ))}

      </div>

    )}

    <button
      onClick={() => router.push("/feed")}
      className="mt-10 text-red-400 hover:text-red-300"
    >
      ← Back to Feed
    </button>

  </section>

  <footer className="text-center text-xs text-gray-600 py-8">
    © 2026 NEXA · ONE UNIVERSE. ENDLESS POSSIBILITIES.
  </footer>

</main>


); }

export default function PublicProfilePage() { return ( <Suspense fallback={ <main className="min-h-screen bg-[#100909] text-white flex items-center justify-center"> Loading NEXA profile... </main> }

>
  <PublicProfileContent />
</Suspense>


); }