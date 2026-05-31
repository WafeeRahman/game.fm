"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateListButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), isPublic }),
    });

    setName("");
    setIsPublic(true);
    setOpen(false);
    setLoading(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg transition-colors"
      >
        New list
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2"
    >
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="List name"
        className="bg-white/5 border border-white/10 focus:border-violet-500/50 text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-white/20 w-44"
      />
      <label className="flex items-center gap-1.5 text-xs text-white/40 cursor-pointer">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="accent-violet-500"
        />
        Public
      </label>
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? "..." : "Create"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-sm text-white/30 hover:text-white transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}
