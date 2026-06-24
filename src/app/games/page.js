import DynamicSearchBar from "@/components/DynamicSearchBar";
import LoadMoreGames from "@/components/LoadMoreGames";
import { searchGames, getPopularGames, getRecentGames } from "@/lib/igdb";

export const metadata = {
  title: "Search Games",
};

export default async function GamesPage({ searchParams }) {
  const { q = "" } = await searchParams;

  if (q) {
    let games = [];
    try {
      games = await searchGames(q, 20);
    } catch (e) {
      console.error("IGDB search failed:", e.message, "\n", e.stack);
    }
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col items-center gap-4 mb-10">
          <h1 className="text-3xl font-bold text-white">Find a game</h1>
          <DynamicSearchBar defaultValue={q} autoFocus />
        </div>

        {games.length > 0 ? (
          <>
            <p className="text-sm text-white/40 mb-6">
              Results for &ldquo;{q}&rdquo;
            </p>
            <LoadMoreGames
              initialGames={games}
              fetchUrl={`/api/games/search?q=${encodeURIComponent(q)}`}
              pageSize={20}
            />
          </>
        ) : (
          <p className="text-sm text-white/40">No results for &ldquo;{q}&rdquo;</p>
        )}
      </div>
    );
  }

  let popular = [];
  let recent = [];
  try {
    [popular, recent] = await Promise.all([
      getPopularGames(10),
      getRecentGames(10),
    ]);
  } catch (e) {
    console.error("IGDB fetch failed:", e.message, "\n", e.stack);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col items-center gap-4 mb-10">
        <h1 className="text-3xl font-bold text-white">Find a game</h1>
        <DynamicSearchBar defaultValue="" />
      </div>

      {popular.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-white mb-4">Popular games</h2>
          <LoadMoreGames
            initialGames={popular}
            fetchUrl="/api/games/browse?type=popular"
            pageSize={10}
          />
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Recently released</h2>
          <LoadMoreGames
            initialGames={recent}
            fetchUrl="/api/games/browse?type=recent"
            pageSize={10}
          />
        </section>
      )}

      {popular.length === 0 && recent.length === 0 && (
        <p className="text-center text-white/30 text-sm mt-4">
          Couldn&apos;t load games right now — try searching instead.
        </p>
      )}
    </div>
  );
}
