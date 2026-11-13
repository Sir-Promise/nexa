"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const FOUNDER_UID = "6e7d3965-9eaa-4dea-a353-fa35c5e2a90d";

type Notification = {
  id: string;
  actor_id: string;
  recipient_id: string;
  type: "follow" | "like" | "comment";
  post_id: string | null;
  is_read: boolean;
  created_at: string;
};

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  useEffect(() => {
    let cancelled = false;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function loadNotifications() {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (cancelled) return;

      if (authError || !authData.user) {
        router.replace("/");
        return;
      }

      const currentUser = authData.user;

      const { data, error } = await supabase
        .from("notifications")
        .select(
          "id, actor_id, recipient_id, type, post_id, is_read, created_at"
        )
        .eq("recipient_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (cancelled) return;

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const notificationList = (data || []) as Notification[];

      setNotifications(notificationList);

      const actorIds = [
        ...new Set(notificationList.map((item) => item.actor_id)),
      ];

      if (actorIds.length > 0) {
        const { data: profileData, error: profileError } =
          await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url")
            .in("id", actorIds);

        if (cancelled) return;

        if (profileError) {
          setError(profileError.message);
        } else {
          const profileMap: Record<string, Profile> = {};

          (profileData || []).forEach((profile) => {
            profileMap[profile.id] = profile;
          });

          setProfiles(profileMap);
        }
      }

      if (cancelled) return;

      // REAL-TIME NEW NOTIFICATIONS

      channel = supabase
        .channel(`notifications-${currentUser.id}`)

        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${currentUser.id}`,
          },
          async (payload) => {
            const newNotification =
              payload.new as Notification;

            if (cancelled) return;

            // Prevent duplicate notifications.
            setNotifications((previous) => {
              if (
                previous.some(
                  (item) => item.id === newNotification.id
                )
              ) {
                return previous;
              }

              return [newNotification, ...previous].slice(0, 100);
            });

            // Load the person who triggered the notification.
            const { data: actorProfile } = await supabase
              .from("profiles")
              .select("id, username, full_name, avatar_url")
              .eq("id", newNotification.actor_id)
              .maybeSingle();

            if (cancelled) return;

            if (actorProfile) {
              setProfiles((previous) => ({
                ...previous,
                [actorProfile.id]: actorProfile,
              }));
            }
          }
        )

        // REAL-TIME READ STATUS UPDATES

        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${currentUser.id}`,
          },
          (payload) => {
            const updated = payload.new as Notification;

            setNotifications((previous) =>
              previous.map((notification) =>
                notification.id === updated.id
                  ? {
                      ...notification,
                      is_read: updated.is_read,
                    }
                  : notification
              )
            );
          }
        )

        .subscribe();

      setLoading(false);
    }

    loadNotifications();

    return () => {
      cancelled = true;

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [router]);

  // MARK ONE NOTIFICATION AS READ

  async function markAsRead(notificationId: string) {
    setUpdating(notificationId);
    setError("");

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      setError(error.message);
    } else {
      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    }

    setUpdating(null);
  }

  // MARK ALL AS READ

  async function markAllAsRead() {
    setUpdating("all");
    setError("");

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      setUpdating(null);
      router.replace("/");
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", authData.user.id)
      .eq("is_read", false);

    if (error) {
      setError(error.message);
    } else {
      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );
    }

    setUpdating(null);
  }

  // OPEN NOTIFICATION

  function openNotification(notification: Notification) {
    const profile = profiles[notification.actor_id];

    if (profile?.username) {
      if (!notification.is_read) {
        markAsRead(notification.id);
      }

      router.push(
        `/members/${encodeURIComponent(profile.username)}`
      );
    }
  }

  // NOTIFICATION MESSAGE

  function getNotificationText(notification: Notification) {
    const profile = profiles[notification.actor_id];

    const name =
      profile?.full_name ||
      profile?.username ||
      "A NEXA member";

    switch (notification.type) {
      case "follow":
        return `${name} started following you.`;

      case "like":
        return `${name} liked your post.`;

      case "comment":
        return `${name} commented on your post.`;

      default:
        return `${name} interacted with you.`;
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#100909] text-white flex items-center justify-center">
        Loading your NEXA notifications...
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

      <section className="max-w-3xl mx-auto px-5 py-12">

        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-5 mb-10">

          <div>
            <p className="text-red-500 text-sm tracking-widest">
              STAY CONNECTED
            </p>

            <h2 className="text-4xl font-bold mt-3">
              Notifications
            </h2>

            <p className="text-gray-400 mt-2">
              Stay updated with your NEXA community.
            </p>
          </div>

          <div className="bg-red-950 border border-red-500/30 rounded-2xl px-5 py-3">
            <p className="text-2xl font-bold text-red-400">
              {unreadCount}
            </p>

            <p className="text-xs text-gray-400">
              Unread
            </p>
          </div>

        </div>

        {error && (
          <div className="bg-red-950 border border-red-700 rounded-xl p-4 text-red-300 mb-6">
            {error}
          </div>
        )}

        {unreadCount > 0 && (
          <div className="flex justify-end mb-6">

            <button
              onClick={markAllAsRead}
              disabled={updating !== null}
              className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              {updating === "all"
                ? "Updating..."
                : "Mark all as read ✓"}
            </button>

          </div>
        )}

        {notifications.length === 0 ? (

          <div className="bg-[#211313] border border-red-900/40 rounded-3xl text-center py-20 px-6">

            <div className="text-5xl mb-5">
              🔔
            </div>

            <h3 className="text-2xl font-bold">
              You're All Caught Up
            </h3>

            <p className="text-gray-400 mt-3">
              When someone interacts with you on NEXA,
              their notifications will appear here.
            </p>

            <button
              onClick={() => router.push("/members")}
              className="mt-7 bg-red-700 hover:bg-red-600 px-7 py-3 rounded-xl font-semibold"
            >
              Discover Members →
            </button>

          </div>

        ) : (

          <div className="space-y-4">

            {notifications.map((notification) => {

              const profile = profiles[notification.actor_id];

              const name =
                profile?.full_name ||
                profile?.username ||
                "NEXA Member";

              const isFounder =
                notification.actor_id === FOUNDER_UID;

              return (

                <article
                  key={notification.id}
                  className={`bg-[#211313] border rounded-2xl p-5 transition ${
                    notification.is_read
                      ? "border-red-900/30"
                      : "border-red-500/60 bg-[#291414]"
                  }`}
                >

                  <div className="flex items-start gap-4">

                    {profile?.avatar_url ? (

                      <img
                        src={profile.avatar_url}
                        alt={name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-red-500/40"
                      />

                    ) : (

                      <div className="w-14 h-14 shrink-0 rounded-full bg-red-800 flex items-center justify-center text-xl font-bold">
                        {name.charAt(0).toUpperCase()}
                      </div>

                    )}

                    <div className="flex-1 min-w-0">

                      <div className="flex items-center gap-2 flex-wrap">

                        <h3 className="font-bold text-white">
                          {name}
                        </h3>

                        {isFounder && (
                          <span className="text-xs text-red-400">
                            👑 Founder
                          </span>
                        )}

                        {!notification.is_read && (
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                        )}

                      </div>

                      <p className="text-gray-300 text-sm mt-2">
                        {getNotificationText(notification)}
                      </p>

                      <p className="text-xs text-gray-500 mt-3">
                        {new Date(
                          notification.created_at
                        ).toLocaleString()}
                      </p>

                      <div className="flex flex-wrap gap-4 mt-4">

                        <button
                          onClick={() => openNotification(notification)}
                          disabled={!profile?.username}
                          className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                          View Profile →
                        </button>

                        {!notification.is_read && (
                          <button
                            onClick={() =>
                              markAsRead(notification.id)
                            }
                            disabled={updating !== null}
                            className="text-sm text-gray-400 hover:text-white disabled:opacity-50"
                          >
                            Mark as read
                          </button>
                        )}

                      </div>

                    </div>

                  </div>

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
  );
}
