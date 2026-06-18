"use client";

import { useState, useCallback } from "react";
import GameCard from "@/components/GameCard";

export default function LoadMoreGames({ initialGames, fetchUrl, pageSize = 10 }) {
  const [games, setGames] = useState(initialGames);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialGames.length >= pageSize);

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${fetchUrl}&offset=${games.length}`);
      const next = await res.json();
      if (next.length === 0) {
        setHasMore(false);
      } else {
        setGames((prev) => [...prev, ...next]);
        if (next.length < pageSize) setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [fetchUrl, games.length, pageSize]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={loadMore}
            disabled={loading}
            className="text-sm text-violet-400 hover:text-violet-300 border border-violet-500/30 hover:border-violet-500/50 px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}
