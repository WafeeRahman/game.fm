"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StopPlayingButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStop() {
    setLoading(true);
    await fetch("/api/sessions", { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={handleStop}
      disabled={loading}
      className="text-xs text-white/30 hover:text-red-400 transition-colors disabled:opacity-50"
      title="Stop now playing"
    >
      {loading ? "..." : "✕"}
    </button>
  );
}
