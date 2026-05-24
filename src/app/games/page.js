import SearchBar from "@/components/SearchBar";
import GameCard from "@/components/GameCard";
import { searchGames } from "@/lib/igdb";

export const metadata = {
  title: "Search Games",
};

export default async function GamesPage({ searchParams }) {
  // searchParams is a Promise in Next.js 15+
  const { q = "" } = await searchParams;
  const games = q ? await searchGames(q, 20) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Search header */}
      <div className="flex flex-col items-center gap-4 mb-10">
        <h1 className="text-3xl font-bold text-white">Find a game</h1>
        <SearchBar defaultValue={q} />
      </div>

      {/* Results */}
      {q && (
        <div>
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
      )}

      {/* Empty state */}
      {!q && (
        <p className="text-center text-white/30 text-sm mt-4">
          Search for any game to get started
        </p>
      )}
    </div>
  );
}
