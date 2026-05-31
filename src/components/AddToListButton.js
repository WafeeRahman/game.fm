"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AddToListButton({ igdbId, initialLists }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState(initialLists);
  const [newListName, setNewListName] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const inListCount = lists.filter((l) => l.hasGame).length;

  async function toggle(list) {
    setLoading(list.id);
    const method = list.hasGame ? "DELETE" : "POST";
    await fetch(`/api/lists/${list.id}/games`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ igdbId }),
    });
    setLists((prev) =>
      prev.map((l) => (l.id === list.id ? { ...l, hasGame: !l.hasGame } : l))
    );
    setLoading(null);
    router.refresh();
  }

  async function createList(e) {
    e.preventDefault();
    if (!newListName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newListName.trim() }),
    });
    const list = await res.json();
    setLists((prev) => [{ id: list.id, name: list.name, hasGame: false }, ...prev]);
    setNewListName("");
    setCreating(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="text-sm px-4 py-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
      >
        {inListCount > 0 ? `In ${inListCount} list${inListCount > 1 ? "s" : ""}` : "Add to list"}
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 w-64 bg-neutral-900 border border-white/10 rounded-xl shadow-xl z-50 p-2">
          {lists.length === 0 && (
            <p className="text-xs text-white/30 px-2 py-2">No lists yet — create one below.</p>
          )}

          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => toggle(list)}
              disabled={loading === list.id}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50 text-left"
            >
              <span
                className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                  list.hasGame ? "bg-violet-600 border-violet-600" : "border-white/20"
                }`}
              >
                {list.hasGame && <span className="text-white text-[10px] leading-none">✓</span>}
              </span>
              <span className="text-sm text-white/80 truncate">{list.name}</span>
            </button>
          ))}

          <div className="border-t border-white/5 mt-1 pt-2 px-1">
            <form onSubmit={createList} className="flex gap-1">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="New list..."
                className="flex-1 bg-white/5 border border-white/10 focus:border-violet-500/50 text-xs text-white rounded-lg px-2 py-1.5 outline-none placeholder-white/20"
              />
              <button
                type="submit"
                disabled={creating || !newListName.trim()}
                className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                +
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
