import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { getFeed, getPopularLoggedGames } from "@/lib/feed";
import { getPopularGames, igdbImageUrl } from "@/lib/igdb";

// A single feed item — one user's game log entry
function FeedItem({ log }) {
  const cover = log.game.coverUrl;
  return (
    <div className="flex items-start gap-4 py-4 border-b border-white/5 last:border-0">
      {/* Cover */}
      <Link href={`/games/${log.game.slug}`} className="flex-shrink-0">
        <div className="relative w-10 h-14 rounded overflow-hidden bg-white/5">
          {cover ? (
            <Image src={cover} alt={log.game.title} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-white/5" />
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/users/${log.user.username}`}
            className="text-sm font-medium text-white hover:text-violet-300 transition-colors"
          >
            {log.user.name ?? log.user.username}
          </Link>
          <span className="text-xs text-white/30">
            {log.status === "COMPLETED" ? "completed" :
             log.status === "DROPPED" ? "dropped" :
             log.status === "BACKLOG" ? "added to backlog" : "is playing"}
          </span>
          <Link
            href={`/games/${log.game.slug}`}
            className="text-sm text-white/80 hover:text-white transition-colors truncate"
          >
            {log.game.title}
          </Link>
        </div>
        <div className="flex items-center gap-3 mt-1">
          {log.rating && (
            <span className="text-xs text-yellow-400">{"★".repeat(Math.round(log.rating))} {log.rating}/5</span>
          )}
          {log.review && (
            <p className="text-xs text-white/40 truncate max-w-xs">{log.review}</p>
          )}
          <span className="text-xs text-white/20">
            {new Date(log.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* User avatar */}
      {log.user.image && (
        <Link href={`/users/${log.user.username}`} className="flex-shrink-0">
          <Image
            src={log.user.image}
            alt={log.user.name ?? log.user.username}
            width={28}
            height={28}
            className="rounded-full"
          />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const session = await auth();

  // Logged in — show activity feed
  if (session?.user) {
    const feed = await getFeed(session.user.id);

    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-xl font-bold text-white mb-6">Activity</h1>

        {feed.length > 0 ? (
          <div>
            {feed.map((log) => (
              <FeedItem key={log.id} log={log} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-white/5 rounded-xl">
            <p className="text-white/40 text-sm">No activity yet.</p>
            <p className="text-white/25 text-xs mt-2">
              Follow other players to see what they&apos;re playing.
            </p>
            <Link
              href="/games"
              className="text-violet-400 hover:text-violet-300 text-sm mt-4 inline-block transition-colors"
            >
              Search for games →
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Logged out — show hero + popular games from IGDB
  const popular = await getPopularGames(12);

  return (
    <div>
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
          Track the games you play.
        </h1>
        <p className="text-lg text-white/50 max-w-xl mx-auto mb-8">
          Log your sessions, review games, build your backlog, and see what
          your friends are playing — like Last.fm but for games.
        </p>
        <Link
          href="/api/auth/signin"
          className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
        >
          Sign in with Discord
        </Link>
      </div>

      {/* Popular games grid */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-6">
          Popular right now
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {popular.map((game) => {
            const cover = igdbImageUrl(game.cover?.image_id, "cover_big");
            return (
              <Link key={game.id} href={`/games/${game.slug}`} className="group">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-white/5 border border-white/10 group-hover:border-violet-500/50 transition-colors">
                  {cover && (
                    <Image
                      src={cover}
                      alt={game.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="150px"
                    />
                  )}
                </div>
                <p className="text-xs text-white/50 mt-1.5 truncate group-hover:text-white transition-colors">
                  {game.name}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
