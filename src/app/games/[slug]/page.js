import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getGameBySlug, igdbImageUrl } from "@/lib/igdb";
import { prisma } from "@/lib/db";
import LogGameButton from "@/components/LogGameButton";
import AddToListButton from "@/components/AddToListButton";
import LogSessionButton from "@/components/LogSessionButton";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: "Game not found" };
  return { title: game.name };
}

export default async function GamePage({ params }) {
  const { slug } = await params;

  const [game, session] = await Promise.all([
    getGameBySlug(slug),
    auth(),
  ]);

  if (!game) notFound();

  // If the user is logged in, check if they've already logged this game
  // and fetch their lists (with membership state for this game)
  let existingLog = null;
  let userLists = [];
  if (session?.user) {
    const dbGame = await prisma.game.findUnique({ where: { igdbId: game.id } });
    if (dbGame) {
      [existingLog] = await Promise.all([
        prisma.gameLog.findUnique({
          where: { userId_gameId: { userId: session.user.id, gameId: dbGame.id } },
        }),
      ]);

      const rawLists = await prisma.list.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          items: {
            where: { gameId: dbGame.id },
            select: { id: true },
          },
        },
      });
      userLists = rawLists.map((l) => ({ id: l.id, name: l.name, hasGame: l.items.length > 0 }));
    } else {
      // Game not in DB yet — still fetch lists so the user can create one
      const rawLists = await prisma.list.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true },
      });
      userLists = rawLists.map((l) => ({ id: l.id, name: l.name, hasGame: false }));
    }
  }

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
    <div className="relative">
      {/* Blurred cover background */}
      {coverUrl && (
        <div className="absolute inset-0 h-96 overflow-hidden pointer-events-none">
          <Image
            src={coverUrl}
            alt=""
            fill
            className="object-cover blur-3xl opacity-15 scale-110"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 to-neutral-950" />
        </div>
      )}

      <div className="relative max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <div className="flex-shrink-0">
            <div className="relative w-44 md:w-52 aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/10 shadow-2xl">
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
          <div className="flex flex-col gap-4 pt-2">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">{game.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-white/50">
                {releaseYear && <span>{releaseYear}</span>}
                {developer && <><span className="text-white/20">·</span><span>{developer}</span></>}
                {rating && (
                  <>
                    <span className="text-white/20">·</span>
                    <span className="text-violet-400 font-medium">★ {rating}/100</span>
                  </>
                )}
              </div>
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {genres.map((g) => (
                  <span
                    key={g}
                    className="text-xs bg-white/5 border border-white/10 text-white/50 px-2.5 py-1 rounded-full"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Summary */}
            {game.summary && (
              <p className="text-sm text-white/60 leading-relaxed max-w-2xl">
                {game.summary}
              </p>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              {publisher && (
                <div>
                  <p className="text-xs text-white/30 mb-0.5">Publisher</p>
                  <p className="text-white/70">{publisher}</p>
                </div>
              )}
              {platforms.length > 0 && (
                <div>
                  <p className="text-xs text-white/30 mb-0.5">Platforms</p>
                  <p className="text-white/70">{platforms.slice(0, 4).join(", ")}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {session?.user ? (
                <>
                  <LogGameButton igdbId={game.id} existingLog={existingLog} />
                  <LogSessionButton igdbId={game.id} />
                  <AddToListButton igdbId={game.id} initialLists={userLists} />
                </>
              ) : (
                <a
                  href="/api/auth/signin"
                  className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg transition-colors inline-block"
                >
                  Sign in to log this game
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
