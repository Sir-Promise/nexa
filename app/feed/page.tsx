"use client";

import { useEffect, useState } from "react"; import { useRouter } from "next/navigation"; import { supabase } from "../../lib/supabase";

type Post = { id: string; user_id: string; author_name: string; content: string; image_url: string | null; created_at: string; };

type Like = { post_id: string; user_id: string; };

type Comment = { id: string; post_id: string; user_id: string; author_name: string; content: string; created_at: string; };

type User = { id: string; email?: string; user_metadata?: { full_name?: string; }; };

export default function Feed() { const router = useRouter();

const [posts, setPosts] = useState<Post[]>([]); const [likes, setLikes] = useState<Like[]>([]); const [comments, setComments] = useState<Comment[]>([]); const [user, setUser] = useState<User | null>(null);

const [content, setContent] = useState("");

const [commentInputs, setCommentInputs] = useState<{ [key: string]: string; }>({});

const [openComments, setOpenComments] = useState<{ [key: string]: boolean; }>({});

const [loading, setLoading] = useState(true); const [publishing, setPublishing] = useState(false); const [error, setError] = useState(""); const [likingPost, setLikingPost] = useState<string | null>(null); const [commentingPost, setCommentingPost] = useState<string | null>(null);

useEffect(() => { let active = true;

async function initializeFeed() {
  const { data, error } = await supabase.auth.getUser();

  if (!active) return;

  if (error || !data.user) {
    router.replace("/");
    return;
  }

  setUser(data.user as User);

  const [postsResult, likesResult, commentsResult] =
    await Promise.all([
      supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("post_likes")
        .select("post_id, user_id"),

      supabase
        .from("post_comments")
        .select("*")
        .order("created_at", { ascending: true }),
    ]);

  if (!active) return;

  if (postsResult.error) {
    setError(postsResult.error.message);
  } else {
    setPosts((postsResult.data || []) as Post[]);
  }

  if (likesResult.error) {
    setError(likesResult.error.message);
  } else {
    setLikes((likesResult.data || []) as Like[]);
  }

  if (commentsResult.error) {
    setError(commentsResult.error.message);
  } else {
    setComments((commentsResult.data || []) as Comment[]);
  }

  setLoading(false);
}

initializeFeed();

const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") {
    router.replace("/");
  }
});

return () => {
  active = false;
  subscription.unsubscribe();
};


}, [router]);

async function fetchPosts() { const { data, error } = await supabase .from("posts") .select("*") .order("created_at", { ascending: false });

if (error) {
  setError(error.message);
  return;
}

setPosts((data || []) as Post[]);


}

async function publishPost(e: React.FormEvent<HTMLFormElement>) { e.preventDefault();

if (!content.trim() || !user || publishing) return;

setPublishing(true);
setError("");

try {
  const authorName =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "NEXA Member";

  const { error } = await supabase.from("posts").insert({
    user_id: user.id,
    author_name: authorName,
    content: content.trim(),
  });

  if (error) throw error;

  setContent("");
  await fetchPosts();
} catch (err) {
  setError(
    err instanceof Error ? err.message : "Unable to publish post."
  );
} finally {
  setPublishing(false);
}


}

async function toggleLike(postId: string) { if (!user || likingPost === postId) return;

setLikingPost(postId);
setError("");

try {
  const alreadyLiked = likes.some(
    (like) =>
      like.post_id === postId &&
      like.user_id === user.id
  );

  if (alreadyLiked) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);

    if (error) throw error;

    setLikes((current) =>
      current.filter(
        (like) =>
          !(
            like.post_id === postId &&
            like.user_id === user.id
          )
      )
    );
  } else {
    const { error } = await supabase
      .from("post_likes")
      .insert({
        post_id: postId,
        user_id: user.id,
      });

    if (error) throw error;

    setLikes((current) => [
      ...current,
      { post_id: postId, user_id: user.id },
    ]);
  }
} catch (err) {
  setError(
    err instanceof Error ? err.message : "Unable to update like."
  );
} finally {
  setLikingPost(null);
}


}

async function publishComment(postId: string) { const commentText = commentInputs[postId]?.trim();

if (!commentText || !user || commentingPost === postId) return;

setCommentingPost(postId);
setError("");

try {
  const authorName =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "NEXA Member";

  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      author_name: authorName,
      content: commentText,
    })
    .select()
    .single();

  if (error) throw error;

  setComments((current) => [...current, data as Comment]);

  setCommentInputs((current) => ({
    ...current,
    [postId]: "",
  }));
} catch (err) {
  setError(
    err instanceof Error ? err.message : "Unable to publish comment."
  );
} finally {
  setCommentingPost(null);
}


}

async function deleteComment(commentId: string) { if (!user) return;

setError("");

const { error } = await supabase
  .from("post_comments")
  .delete()
  .eq("id", commentId)
  .eq("user_id", user.id);

if (error) {
  setError(error.message);
  return;
}

setComments((current) =>
  current.filter((comment) => comment.id !== commentId)
);


}

async function deletePost(postId: string) { if (!user) return;

const { error } = await supabase
  .from("posts")
  .delete()
  .eq("id", postId)
  .eq("user_id", user.id);

if (error) {
  setError(error.message);
  return;
}

setPosts((current) =>
  current.filter((post) => post.id !== postId)
);

setLikes((current) =>
  current.filter((like) => like.post_id !== postId)
);

setComments((current) =>
  current.filter((comment) => comment.post_id !== postId)
);


}

if (loading) { return ( <main className="min-h-screen bg-[#100909] text-white flex items-center justify-center"> Entering NEXA... </main> ); }

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

  <section className="max-w-3xl mx-auto px-5 py-10">

    <div className="mb-10">
      <p className="text-red-500 text-sm tracking-widest">
        YOUR COMMUNITY
      </p>

      <h2 className="text-4xl font-bold mt-3">
        The NEXA Feed
      </h2>

      <p className="text-gray-400 mt-2">
        Discover ideas. Share experiences. Connect with the world.
      </p>
    </div>

    <form
      onSubmit={publishPost}
      className="bg-[#211313] border border-red-900/40 rounded-2xl p-6 mb-10"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-full bg-red-700 flex items-center justify-center font-bold">
          {user?.email?.charAt(0).toUpperCase() || "N"}
        </div>

        <div>
          <p className="font-semibold">
            {user?.user_metadata?.full_name || "NEXA Member"}
          </p>

          <p className="text-xs text-gray-400">
            Share something with your universe
          </p>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's happening in your universe?"
        className="w-full min-h-32 bg-[#160d0d] border border-red-900/30 rounded-xl p-4 text-white outline-none focus:border-red-500 resize-none"
        maxLength={5000}
      />

      <div className="flex justify-between items-center mt-4">
        <span className="text-xs text-gray-500">
          {content.length}/5000
        </span>

        <button
          type="submit"
          disabled={publishing || !content.trim()}
          className="bg-red-700 hover:bg-red-600 disabled:opacity-50 px-7 py-3 rounded-xl font-semibold transition"
        >
          {publishing ? "Publishing..." : "Publish Post →"}
        </button>
      </div>
    </form>

    {error && (
      <div className="bg-red-950 border border-red-700 rounded-xl p-4 mb-6 text-red-300">
        {error}
      </div>
    )}

    <div className="space-y-6">

      {posts.length === 0 ? (
        <div className="text-center py-16 bg-[#211313] rounded-2xl border border-red-900/30">
          <h3 className="text-xl font-semibold">
            Your universe is waiting.
          </h3>

          <p className="text-gray-400 mt-2">
            Be the first to share something with NEXA.
          </p>
        </div>
      ) : (
        posts.map((post) => {
          const postLikes = likes.filter(
            (like) => like.post_id === post.id
          );

          const likedByUser = postLikes.some(
            (like) => like.user_id === user?.id
          );

          const postComments = comments.filter(
            (comment) => comment.post_id === post.id
          );

          return (
            <article
              key={post.id}
              className="bg-[#211313] border border-red-900/30 rounded-2xl p-6"
            >
              <div className="flex justify-between items-start">

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-red-800 flex items-center justify-center font-bold">
                    {post.author_name?.charAt(0).toUpperCase() || "N"}
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      {post.author_name || "NEXA Member"}
                    </h3>

                    <p className="text-xs text-gray-500">
                      {new Date(post.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {post.user_id === user?.id && (
                  <button
                    onClick={() => deletePost(post.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>

              <p className="mt-5 text-gray-200 whitespace-pre-wrap leading-relaxed">
                {post.content}
              </p>

              <div className="border-t border-red-900/30 mt-6 pt-4 flex items-center justify-between">

                <button
                  onClick={() => toggleLike(post.id)}
                  disabled={likingPost === post.id}
                  className={`flex items-center gap-2 transition ${
                    likedByUser
                      ? "text-red-400"
                      : "text-gray-400 hover:text-red-400"
                  }`}
                >
                  <span className="text-xl">
                    {likedByUser ? "❤️" : "🤍"}
                  </span>

                  <span className="font-semibold">
                    {likedByUser ? "Liked" : "Like"}
                  </span>
                </button>

                <span className="text-sm text-gray-400">
                  {postLikes.length} Likes
                </span>

                <button
                  onClick={() =>
                    setOpenComments((current) => ({
                      ...current,
                      [post.id]: !current[post.id],
                    }))
                  }
                  className="text-gray-400 hover:text-red-400 transition flex items-center gap-2"
                >
                  💬 Comments ({postComments.length})
                </button>
              </div>

              {openComments[post.id] && (
                <div className="mt-5 pt-5 border-t border-red-900/30">

                  <h4 className="font-semibold mb-4">
                    Comments
                  </h4>

                  <div className="space-y-4 mb-5">

                    {postComments.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No comments yet. Start the conversation!
                      </p>
                    ) : (
                      postComments.map((comment) => (
                        <div
                          key={comment.id}
                          className="flex justify-between items-start gap-3 bg-[#160d0d] p-4 rounded-xl"
                        >
                          <div>
                            <p className="text-sm font-semibold text-red-300">
                              {comment.author_name}
                            </p>

                            <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap">
                              {comment.content}
                            </p>

                            <p className="text-xs text-gray-600 mt-2">
                              {new Date(comment.created_at).toLocaleString()}
                            </p>
                          </div>

                          {comment.user_id === user?.id && (
                            <button
                              onClick={() => deleteComment(comment.id)}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      publishComment(post.id);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={commentInputs[post.id] || ""}
                      onChange={(e) =>
                        setCommentInputs((current) => ({
                          ...current,
                          [post.id]: e.target.value,
                        }))
                      }
                      placeholder="Write a comment..."
                      maxLength={2000}
                      className="flex-1 min-w-0 bg-[#160d0d] border border-red-900/40 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-500"
                    />

                    <button
                      type="submit"
                      disabled={
                        commentingPost === post.id ||
                        !commentInputs[post.id]?.trim()
                      }
                      className="bg-red-700 hover:bg-red-600 disabled:opacity-50 px-4 rounded-xl text-sm font-semibold"
                    >
                      {commentingPost === post.id ? "..." : "Send"}
                    </button>
                  </form>
                </div>
              )}
            </article>
          );
        })
      )}
    </div>
  </section>

  <footer className="text-center text-xs text-gray-600 py-8">
    © 2026 NEXA · ONE UNIVERSE. ENDLESS POSSIBILITIES.
  </footer>
</main>


); }