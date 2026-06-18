import SearchBar from "@/components/SearchBar";
import GameCard from "@/components/GameCard";
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
      console.error("IGDB search failed:", e.message);
    }
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col items-center gap-4 mb-10">
          <h1 className="text-3xl font-bold text-white">Find a game</h1>
          <SearchBar defaultValue={q} />
        </div>

        <p className="text-sm text-white/40 mb-6">
          {games.length > 0
            ? `${games.length} results for "${q}"`
            : `No results for "${q}"`}
        </p>

        {games.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
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
    console.error("IGDB fetch failed:", e.message);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col items-center gap-4 mb-10">
        <h1 className="text-3xl font-bold text-white">Find a game</h1>
        <SearchBar defaultValue="" />
      </div>

      {popular.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-white mb-4">Popular games</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {popular.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Recently released</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {recent.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
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
