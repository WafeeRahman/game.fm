"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Loader2 } from "lucide-react";

function igdbImageUrl(imageId, size = "cover_small") {
  if (!imageId) return null;
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

export default function DynamicSearchBar({
  defaultValue = "",
  autoFocus = false,
  compact = false,
}) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchResults = useCallback(async (q) => {
    if (abortRef.current) abortRef.current.abort();

    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/games/search?q=${encodeURIComponent(q)}&limit=6`,
        { signal: controller.signal }
      );
      const data = await res.json();
      setResults(data);
      setOpen(data.length > 0);
      setSelected(-1);
    } catch (e) {
      if (e.name !== "AbortError") setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => fetchResults(query), 300);
    return () => clearTimeout(timer);
  }, [query, fetchResults]);

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }

    if (!open || results.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (query.trim()) {
          setOpen(false);
          router.push(`/games?q=${encodeURIComponent(query)}`);
        }
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => (s < results.length - 1 ? s + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => (s > 0 ? s - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selected >= 0 && results[selected]) {
        setOpen(false);
        router.push(`/games/${results[selected].slug}`);
      } else if (query.trim()) {
        setOpen(false);
        router.push(`/games?q=${encodeURIComponent(query)}`);
      }
    }
  }

  function goToGame(slug) {
    setOpen(false);
    router.push(`/games/${slug}`);
  }

  const inputClasses = compact
    ? "w-full bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.07] border border-white/[0.08] focus:border-violet-500/50 rounded-lg pl-9 pr-8 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none transition-all"
    : "w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:bg-white/10 transition-all";

  const iconClasses = compact
    ? "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30"
    : "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40";

  return (
    <div
      ref={containerRef}
      className={`relative ${compact ? "flex-1 max-w-xs ml-auto" : "w-full max-w-xl"}`}
    >
      {loading ? (
        <Loader2 className={`${iconClasses} animate-spin`} />
      ) : (
        <Search className={iconClasses} />
      )}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search for a game..."
        className={inputClasses}
      />
      {compact && (
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/20 bg-white/5 border border-white/[0.08] rounded px-1.5 py-0.5 hidden sm:block pointer-events-none">
          /
        </kbd>
      )}

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
          {results.map((game, i) => {
            const coverUrl = igdbImageUrl(game.cover?.image_id);
            const year = game.first_release_date
              ? new Date(game.first_release_date * 1000).getFullYear()
              : null;

            return (
              <button
                key={game.id}
                onClick={() => goToGame(game.slug)}
                onMouseEnter={() => setSelected(i)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                  i === selected
                    ? "bg-violet-600/20"
                    : "hover:bg-white/5"
                }`}
              >
                <div className="relative w-8 h-11 rounded overflow-hidden bg-white/5 flex-shrink-0">
                  {coverUrl ? (
                    <Image
                      src={coverUrl}
                      alt={game.name}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-white/5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{game.name}</p>
                  {year && (
                    <p className="text-xs text-white/30">{year}</p>
                  )}
                </div>
              </button>
            );
          })}
          {query.trim() && (
            <button
              onClick={() => {
                setOpen(false);
                router.push(`/games?q=${encodeURIComponent(query)}`);
              }}
              className="w-full px-3 py-2.5 text-left text-xs text-violet-400 hover:bg-white/5 border-t border-white/5 transition-colors"
            >
              See all results for &ldquo;{query}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
