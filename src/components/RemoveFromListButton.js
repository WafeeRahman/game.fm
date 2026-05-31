"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RemoveFromListButton({ listId, igdbId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    setLoading(true);
    await fetch(`/api/lists/${listId}/games`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ igdbId }),
    });
    router.refresh();
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      title="Remove from list"
      className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-red-500/80 text-white/60 hover:text-white rounded-full text-xs items-center justify-center hidden group-hover:flex transition-colors disabled:opacity-50"
    >
      ×
    </button>
  );
}
