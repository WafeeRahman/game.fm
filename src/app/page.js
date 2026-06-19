import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { getFeed, getGlobalFeed } from "@/lib/feed";
import { getPopularGames, igdbImageUrl } from "@/lib/igdb";

function formatDur(mins) {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function FeedItem({ session: s }) {
  const cover = s.game.coverUrl;
  return (
    <div className="flex items-start gap-4 py-4 border-b border-white/5 last:border-0">
      <Link href={`/games/${s.game.slug}`} className="flex-shrink-0">
        <div className="relative w-10 h-14 rounded-lg overflow-hidden bg-white/5">
          {cover ? (
            <Image src={cover} alt={s.game.title} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-white/5" />
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/users/${s.user.username}`}
            className="text-sm font-medium text-white hover:text-violet-300 transition-colors truncate max-w-[200px]"
          >
            {s.user.name ?? s.user.username}
          </Link>
          {s.isNowPlaying ? (
            <span className="text-xs text-green-400">is playing</span>
          ) : (
            <span className="text-xs text-white/30">played</span>
          )}
          <Link
            href={`/games/${s.game.slug}`}
            className="text-sm text-white/80 hover:text-white transition-colors truncate"
          >
            {s.game.title}
          </Link>
        </div>
        <div className="flex items-center gap-3 mt-1">
          {s.isNowPlaying ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              {formatDur(Math.round((Date.now() - new Date(s.startedAt).getTime()) / 60000))}
            </span>
          ) : s.durationMins ? (
            <span className="text-xs text-violet-400">{formatDur(s.durationMins)}</span>
          ) : null}
          <span className="text-xs text-white/20">{timeAgo(s.startedAt)}</span>
        </div>
      </div>

      {s.user.image && (
        <Link href={`/users/${s.user.username}`} className="flex-shrink-0">
          <Image
            src={s.user.image}
            alt={s.user.name ?? s.user.username}
            width={28}
            height={28}
            className="rounded-full"
          />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage({ searchParams }) {
  const session = await auth();
  const { tab } = await searchParams;

  if (session?.user) {
    const activeTab = tab === "everyone" ? "everyone" : "following";
    const feed = activeTab === "everyone"
      ? await getGlobalFeed()
      : await getFeed(session.user.id);

    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-6 mb-6">
          <Link
            href="/?tab=following"
            className={`text-lg font-bold transition-colors ${
              activeTab === "following"
                ? "text-white"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            Following
          </Link>
          <Link
            href="/?tab=everyone"
            className={`text-lg font-bold transition-colors ${
              activeTab === "everyone"
                ? "text-white"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            Everyone
          </Link>
        </div>

        {feed.length > 0 ? (
          <div className="border border-white/5 rounded-xl px-4 divide-y divide-white/5">
            {feed.map((s) => (
              <FeedItem key={s.id} session={s} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-white/5 rounded-xl">
            {activeTab === "following" ? (
              <>
                <p className="text-white/40 text-sm">No activity yet.</p>
                <p className="text-white/25 text-xs mt-2">
                  Follow other players to see what they&apos;re playing.
                </p>
                <Link
                  href="/?tab=everyone"
                  className="text-violet-400 hover:text-violet-300 text-sm mt-4 inline-block transition-colors"
                >
                  See what everyone&apos;s playing →
                </Link>
              </>
            ) : (
              <>
                <p className="text-white/40 text-sm">No activity on the platform yet.</p>
                <Link
                  href="/games"
                  className="text-violet-400 hover:text-violet-300 text-sm mt-4 inline-block transition-colors"
                >
                  Be the first to log a game →
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // Logged out — hero + popular games
  const popular = await getPopularGames(12);

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[700px] h-[500px] bg-violet-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-32 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-violet-400 border border-violet-500/30 bg-violet-500/10 rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
            Like Last.fm, but for games
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-5 tracking-tight leading-tight">
            Track the games<br />you play.
          </h1>
          <p className="text-lg text-white/50 max-w-lg mx-auto mb-8">
            Log sessions, write reviews, build your backlog, and see what your
            friends are playing — all in one place.
          </p>
          <Link
            href="/api/auth/signin"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-violet-900/40"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            Sign in with Discord
          </Link>
        </div>
      </div>

      {/* Popular games */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-6">
          Popular right now
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {popular.map((game) => {
            const cover = igdbImageUrl(game.cover?.image_id, "cover_big");
            return (
              <Link key={game.id} href={`/games/${game.slug}`} className="group">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-white/5 border border-white/10 group-hover:border-violet-500/50 transition-all duration-200 group-hover:shadow-lg group-hover:shadow-violet-900/20">
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
                <p className="text-xs text-white/40 mt-2 truncate group-hover:text-white/70 transition-colors">
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
