"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SteamImport() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [result, setResult] = useState(null);

  async function handleImport(e) {
    e.preventDefault();
    if (!input.trim()) return;

    setStatus("loading");
    setResult(null);

    const res = await fetch("/api/steam/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steamInput: input.trim() }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setResult(data);
    } else {
      setStatus("done");
      setResult(data);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleImport} className="flex flex-col gap-4">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="76561198XXXXXXXXX or steamcommunity.com/id/yourname"
        disabled={status === "loading"}
        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500 disabled:opacity-50 transition-colors"
      />

      <button
        type="submit"
        disabled={status === "loading" || !input.trim()}
        className="self-start bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        {status === "loading" ? "Importing..." : "Import library"}
      </button>

      {/* Result */}
      {status === "done" && result && (
        <div className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-3">
          ✓ {result.message} ({result.matched} matched from {result.total} Steam games)
        </div>
      )}

      {status === "error" && result && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {result.error}
        </div>
      )}
    </form>
  );
}
