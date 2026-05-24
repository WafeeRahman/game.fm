import Image from "next/image";
import { notFound } from "next/navigation";
import { getGameBySlug, igdbImageUrl } from "@/lib/igdb";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: "Game not found" };
  return { title: game.name };
}

export default async function GamePage({ params }) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);

  if (!game) notFound();

  const coverUrl = igdbImageUrl(game.cover?.image_id, "cover_big");
  const releaseYear = game.first_release_date
    ? new Date(game.first_release_date * 1000).getFullYear()
    : null;
  const rating = game.total_rating ? Math.round(game.total_rating) : null;

  const developer = game.involved_companies?.find((c) => c.developer)?.company?.name;
  const publisher = game.involved_companies?.find((c) => c.publisher)?.company?.name;
  const genres = game.genres?.map((g) => g.name) ?? [];
  const platforms = game.platforms?.map((p) => p.name) ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Cover */}
        <div className="flex-shrink-0">
          <div className="relative w-48 md:w-56 aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/10">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={game.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs">
                No cover
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{game.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-white/50">
              {releaseYear && <span>{releaseYear}</span>}
              {developer && <span>· {developer}</span>}
              {rating && (
                <span className="text-violet-400 font-medium">
                  ★ {rating}/100
                </span>
              )}
            </div>
          </div>

          {/* Genres */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <span
                  key={g}
                  className="text-xs bg-white/5 border border-white/10 text-white/60 px-2.5 py-1 rounded-full"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Summary */}
          {game.summary && (
            <p className="text-sm text-white/70 leading-relaxed max-w-2xl">
              {game.summary}
            </p>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mt-2">
            {publisher && (
              <div>
                <span className="text-white/30">Publisher</span>
                <p className="text-white/80">{publisher}</p>
              </div>
            )}
            {platforms.length > 0 && (
              <div>
                <span className="text-white/30">Platforms</span>
                <p className="text-white/80">{platforms.slice(0, 4).join(", ")}</p>
              </div>
            )}
          </div>

          {/* TODO: Log game button — coming in commit 7 */}
          <div className="mt-2">
            <button
              disabled
              className="bg-violet-600/50 text-white/50 text-sm px-4 py-2 rounded-lg cursor-not-allowed"
            >
              Log this game (coming soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
