"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

export default function LikeButton({ logId, listId, initialLiked = false, initialCount = 0 }) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    if (saving) return;
    setSaving(true);

    // Optimistic update
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logId ? { logId } : { listId }),
      });

      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setCount(data.count);
      } else {
        // Revert on error
        setLiked(liked);
        setCount(count);
      }
    } catch {
      setLiked(liked);
      setCount(count);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`flex items-center gap-1 text-xs transition-colors ${
        liked
          ? "text-red-400 hover:text-red-300"
          : "text-white/30 hover:text-white/60"
      }`}
    >
      <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
