"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FollowButton({ username, initialFollowing }) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const method = following ? "DELETE" : "POST";

    await fetch("/api/follow", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    setFollowing(!following);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-sm px-4 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
        following
          ? "border-white/20 text-white/60 hover:border-red-500/50 hover:text-red-400"
          : "border-violet-500 bg-violet-600 hover:bg-violet-500 text-white"
      }`}
    >
      {loading ? "..." : following ? "Following" : "Follow"}
    </button>
  );
}
