"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import Image from "next/image";

const TYPE_TEXT = {
  FOLLOW:      "followed you",
  LIKE_REVIEW: "liked your review",
  LIKE_LIST:   "liked your list",
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (hrs < 24) return `${hrs}h`;
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch on mount + poll every 60s
  useEffect(() => {
    async function fetchNotifs() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
          setUnread(data.unreadCount);
          setLoaded(true);
        }
      } catch { /* silent */ }
    }

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, []);

  async function handleOpen() {
    setOpen(!open);
    if (!open && unread > 0) {
      // Mark all as read
      setUnread(0);
      await fetch("/api/notifications", { method: "PATCH" });
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative text-white/40 hover:text-white transition-colors p-1.5"
      >
        <Bell className="w-4.5 h-4.5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-violet-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {!loaded ? (
              <div className="py-8 text-center text-white/20 text-xs">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-white/20 text-xs">No notifications yet</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 ${
                    !n.read ? "bg-violet-500/5" : ""
                  }`}
                >
                  {n.actor?.image ? (
                    <Image
                      src={n.actor.image}
                      alt={n.actor.name ?? n.actor.username}
                      width={28}
                      height={28}
                      className="rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white/5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/70">
                      <span className="font-medium text-white">
                        {n.actor?.name ?? n.actor?.username ?? "Someone"}
                      </span>{" "}
                      {TYPE_TEXT[n.type] ?? n.type}
                    </p>
                    <p className="text-[10px] text-white/25 mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
