"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteListButton({ listId, username }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/lists/${listId}`, { method: "DELETE" });
    router.push(`/users/${username}/lists`);
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="text-xs text-white/30 hover:text-red-400 border border-white/10 hover:border-red-500/40 px-3 py-1.5 rounded-lg transition-colors"
      >
        Delete list
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-white/40">Delete this list?</span>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-xs text-red-400 hover:text-red-300 border border-red-500/40 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? "..." : "Yes, delete"}
      </button>
      <button
        onClick={() => setConfirm(false)}
        className="text-xs text-white/30 hover:text-white transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
