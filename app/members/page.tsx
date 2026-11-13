"use client";

import { useEffect, useState } from "react"; import { useRouter } from "next/navigation"; import { supabase } from "../../lib/supabase";

const FOUNDER_UID = "6e7d3965-9eaa-4dea-a353-fa35c5e2a90d";

type Member = { id: string; username: string | null; full_name: string | null; bio: string | null; avatar_url: string | null; };

export default function MembersPage() { const router = useRouter();

const [members, setMembers] = useState<Member[]>([]); const [followingIds, setFollowingIds] = useState<string[]>([]); const [followerCounts, setFollowerCounts] = useState<Record<string, number>>({}); const [search, setSearch] = useState("");

const [currentUserId, setCurrentUserId] = useState<string | null>(null); const [loading, setLoading] = useState(true); const [followLoading, setFollowLoading] = useState<string | null>(null); const [error, setError] = useState("");

useEffect(() => { async function loadMembers() { const { data: authData } = await supabase.auth.getUser(); const userId = authData.user?.id || null;

  setCurrentUserId(userId);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, bio, avatar_url")
    .order("full_name", { ascending: true })
    .limit(100);

  if (error) {
    setError(error.message);
    setLoading(false);
    return;
  }

  const memberList = data || [];
  setMembers(memberList);

  if (memberList.length > 0) {
    const ids = memberList.map((member) => member.id);

    const { data: countData, error: countError } = await supabase
      .from("user_follows")
      .select("following_id")
      .in("following_id", ids);

    if (countError) {
      setError(countError.message);
    } else {
      const counts: Record<string, number> = {};

      (countData || []).forEach((follow) => {
        counts[follow.following_id] =
          (counts[follow.following_id] || 0) + 1;
      });

      setFollowerCounts(counts);
    }

    if (userId) {
      const { data: followData, error: followError } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", userId)
        .in("following_id", ids);

      if (followError) {
        setError(followError.message);
      } else {
        setFollowingIds(
          (followData || []).map((follow) => follow.following_id)
        );
      }
    }
  }

  setLoading(false);
}

loadMembers();


}, []);

async function toggleFollow(memberId: string) { if (!currentUserId) { router.push("/"); return; }

if (currentUserId === memberId || followLoading) return;

setFollowLoading(memberId);
setError("");

const currentlyFollowing = followingIds.includes(memberId);

if (currentlyFollowing) {
  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", currentUserId)
    .eq("following_id", memberId);

  if (error) {
    setError(error.message);
  } else {
    setFollowingIds((previous) =>
      previous.filter((id) => id !== memberId)
    );

    setFollowerCounts((previous) => ({
      ...previous,
      [memberId]: Math.max(0, (previous[memberId] || 0) - 1),
    }));
  }
} else {
  const { error } = await supabase
    .from("user_follows")
    .insert({
      follower_id: currentUserId,
      following_id: memberId,
    });

  if (error) {
    setError(
      error.code === "23505"
        ? "You are already following this member."
        : error.message
    );
  } else {
    setFollowingIds((previous) => [...previous, memberId]);

    setFollowerCounts((previous) => ({
      ...previous,
      [memberId]: (previous[memberId] || 0) + 1,
    }));
  }
}

setFollowLoading(null);


}

const filteredMembers = members.filter((member) => { const query = search.trim().toLowerCase();

return (
  !query ||
  member.full_name?.toLowerCase().includes(query) ||
  member.username?.toLowerCase().includes(query)
);


});

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

  <section className="max-w-5xl mx-auto px-5 py-12">

    <div className="mb-10">

      <p className="text-red-500 text-sm tracking-widest">
        NEXA COMMUNITY
      </p>

      <h2 className="text-4xl font-bold mt-3">
        Discover Members
      </h2>

      <p className="text-gray-400 mt-3">
        Discover people, explore identities and build connections.
      </p>

    </div>

    <input
      type="search"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search by name or username..."
      className="w-full bg-[#211313] border border-red-900/50 rounded-2xl px-6 py-5 outline-none focus:border-red-500 transition"
    />

    <p className="text-gray-500 text-sm mt-3 mb-8">
      {filteredMembers.length} members found
    </p>

    {error && (
      <div className="bg-red-950 border border-red-700 rounded-xl p-4 text-red-300 mb-6">
        {error}
      </div>
    )}

    {loading ? (

      <div className="text-center py-20 text-gray-400">
        Loading NEXA community...
      </div>

    ) : filteredMembers.length === 0 ? (

      <div className="text-center py-20 bg-[#211313] rounded-3xl">
        <h3 className="text-2xl font-bold">No Members Found</h3>
        <p className="text-gray-400 mt-3">
          Try another search.
        </p>
      </div>

    ) : (

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {filteredMembers.map((member) => {

          const isFounder = member.id === FOUNDER_UID;
          const isCurrentUser = member.id === currentUserId;
          const isFollowing = followingIds.includes(member.id);

          const displayName =
            member.full_name || member.username || "NEXA Member";

          return (

            <article
              key={member.id}
              className="bg-[#211313] border border-red-900/40 rounded-3xl p-7 hover:border-red-500/70 transition"
            >

              <div className="flex items-center gap-5">

                {member.avatar_url ? (

                  <img
                    src={member.avatar_url}
                    alt={displayName}
                    className="w-20 h-20 rounded-full object-cover border-2 border-red-500/40"
                  />

                ) : (

                  <div className="w-20 h-20 shrink-0 rounded-full bg-red-800 border-2 border-red-500/40 flex items-center justify-center text-3xl font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>

                )}

                <div className="min-w-0">

                  <h3 className="text-xl font-bold truncate">
                    {displayName}
                  </h3>

                  <p className="text-red-400 text-sm mt-1 truncate">
                    @{member.username || "member"}
                  </p>

                  {isFounder && (
                    <span className="inline-block mt-2 px-3 py-1 rounded-full bg-red-950 border border-red-500/40 text-red-300 text-xs font-bold">
                      👑 FOUNDER & CEO
                    </span>
                  )}

                </div>

              </div>

              <p className="text-gray-400 text-sm mt-6 min-h-10">
                {member.bio || "A member of the NEXA community."}
              </p>

              <div className="flex items-center justify-between mt-6 gap-3">

                <span className="text-sm text-gray-400">
                  <strong className="text-white">
                    {followerCounts[member.id] || 0}
                  </strong>{" "}
                  Followers
                </span>

                {!isCurrentUser && (
                  <button
                    onClick={() => toggleFollow(member.id)}
                    disabled={followLoading !== null}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 ${
                      isFollowing
                        ? "bg-[#160d0d] border border-red-500 text-red-400"
                        : "bg-red-700 hover:bg-red-600 text-white"
                    }`}
                  >
                    {followLoading === member.id
                      ? "Please wait..."
                      : isFollowing
                        ? "Following ✓"
                        : "Follow +"}
                  </button>
                )}

              </div>

              <button
                onClick={() =>
                  router.push(
                    `/members/${encodeURIComponent(member.username || "")}`
                  )
                }
                className="w-full mt-5 border border-red-900/50 hover:border-red-500 rounded-xl py-3 font-semibold transition"
              >
                {isCurrentUser ? "View My Profile →" : "View Profile →"}
              </button>

            </article>

          );
        })}

      </div>

    )}

  </section>

  <footer className="text-center text-xs text-gray-600 py-8">
    © 2026 NEXA · ONE UNIVERSE. ENDLESS POSSIBILITIES.
  </footer>

</main>


); }