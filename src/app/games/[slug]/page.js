import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getGameBySlug, igdbImageUrl } from "@/lib/igdb";
import { prisma } from "@/lib/db";
import LogGameButton from "@/components/LogGameButton";
import AddToListButton from "@/components/AddToListButton";
import LogSessionButton from "@/components/LogSessionButton";
import SpoilerText from "@/components/SpoilerText";
import LikeButton from "@/components/LikeButton";

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
  let reviews = [];
  let userLikes = new Set();

  // Fetch community reviews for this game
  const dbGameForReviews = await prisma.game.findUnique({ where: { igdbId: game.id } });
  if (dbGameForReviews) {
    reviews = await prisma.gameLog.findMany({
      where: {
        gameId: dbGameForReviews.id,
        review: { not: null },
        isPublic: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        rating: true,
        review: true,
        isSpoiler: true,
        status: true,
        updatedAt: true,
        _count: { select: { likes: true } },
        user: {
          select: { id: true, username: true, name: true, image: true },
        },
      },
    });

    // Check which reviews the current user has liked
    if (session?.user && reviews.length > 0) {
      const likes = await prisma.like.findMany({
        where: {
          userId: session.user.id,
          logId: { in: reviews.map((r) => r.id) },
        },
        select: { logId: true },
      });
      userLikes = new Set(likes.map((l) => l.logId));
    }
  }

  if (session?.user) {
    const dbGame = dbGameForReviews ?? await prisma.game.findUnique({ where: { igdbId: game.id } });
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

        {/* Community Reviews */}
        {reviews.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">
              Reviews
            </h2>
            <div className="border border-white/5 rounded-xl divide-y divide-white/5">
              {reviews.map((review) => (
                <div key={review.id} className="px-5 py-4">
                  <div className="flex items-center gap-3 mb-2">
                    <a href={`/users/${review.user.username}`} className="flex-shrink-0">
                      {review.user.image ? (
                        <Image
                          src={review.user.image}
                          alt={review.user.name ?? review.user.username}
                          width={28}
                          height={28}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/20">
                          {(review.user.username ?? "?")[0].toUpperCase()}
                        </div>
                      )}
                    </a>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`/users/${review.user.username}`}
                          className="text-sm font-medium text-white hover:text-violet-300 transition-colors"
                        >
                          {review.user.name ?? review.user.username}
                        </a>
                        {review.rating && (
                          <span className="text-xs text-yellow-400">
                            {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                          </span>
                        )}
                        {review.isSpoiler && (
                          <span className="text-[10px] text-amber-400/70 border border-amber-400/30 rounded px-1.5 py-0.5">
                            Spoiler
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-white/20 flex-shrink-0">
                      {new Date(review.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>

                  <div className="ml-10">
                    {review.isSpoiler ? (
                      <SpoilerText>
                        <p className="text-sm text-white/60 leading-relaxed">
                          &ldquo;{review.review}&rdquo;
                        </p>
                      </SpoilerText>
                    ) : (
                      <p className="text-sm text-white/60 leading-relaxed">
                        &ldquo;{review.review}&rdquo;
                      </p>
                    )}

                    {session?.user && (
                      <div className="mt-2">
                        <LikeButton
                          logId={review.id}
                          initialLiked={userLikes.has(review.id)}
                          initialCount={review._count.likes}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
