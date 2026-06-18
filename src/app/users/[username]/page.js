import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getUserProfile, getTotalPlaytime } from "@/lib/users";
import { prisma } from "@/lib/db";
import FollowButton from "@/components/FollowButton";
import StopPlayingButton from "@/components/StopPlayingButton";
import SpoilerText from "@/components/SpoilerText";

export async function generateMetadata({ params }) {
  const { username } = await params;
  return { title: username };
}

const STATUS_LABEL = {
  PLAYING: "Playing",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
  BACKLOG: "Backlog",
  WISHLIST: "Wishlist",
  SHELVED: "Shelved",
};

function formatDuration(mins) {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default async function UserProfilePage({ params }) {
  const { username } = await params;

  const session = await auth();
  const user = await getUserProfile(username, session?.user?.id ?? null);

  if (!user) notFound();

  const isOwnProfile = session?.user?.id === user.id;

  const isFollowing = !isOwnProfile && session?.user
    ? !!(await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: user.id,
          },
        },
      }))
    : false;

  const totalMins = await getTotalPlaytime(user.id);
  const totalHours = Math.floor(totalMins / 60);

  const nowPlaying = user.sessions.find((s) => s.isNowPlaying) ?? null;

  const stats = [
    { label: "Games", value: user._count.logs },
    { label: "Hours", value: totalHours },
    { label: "Followers", value: user._count.followers },
    { label: "Following", value: user._count.following },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Profile header */}
      <div className="flex items-start gap-6 mb-8">
        {/* Avatar */}
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
          {user.image ? (
            <Image src={user.image} alt={user.name ?? username} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white/20">
              {username[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {user.name ?? username}
            </h1>
            <span className="text-white/30 text-sm">@{username}</span>
            {nowPlaying && (
              <span className="inline-flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 border border-green-400/20 pl-2.5 pr-1.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Now playing
                {isOwnProfile && <StopPlayingButton />}
              </span>
            )}
          </div>

          {/* Now playing game */}
          {nowPlaying && (
            <Link
              href={`/games/${nowPlaying.game.slug}`}
              className="inline-flex items-center gap-2 mt-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              {nowPlaying.game.coverUrl && (
                <div className="relative w-6 h-8 rounded overflow-hidden flex-shrink-0">
                  <Image src={nowPlaying.game.coverUrl} alt={nowPlaying.game.title} fill className="object-cover" />
                </div>
              )}
              {nowPlaying.game.title}
            </Link>
          )}

          {user.bio && (
            <p className="text-sm text-white/60 mt-2 max-w-lg leading-relaxed">{user.bio}</p>
          )}

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {isOwnProfile && (
              <Link
                href="/settings"
                className="text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/30 px-2.5 py-1 rounded-md transition-colors"
              >
                Edit profile
              </Link>
            )}
            {!isOwnProfile && session?.user && (
              <FollowButton username={username} initialFollowing={isFollowing} />
            )}
            <span className="text-xs text-white/20">
              Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/10 mb-8">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-neutral-950 text-center py-4 hover:bg-white/[0.02] transition-colors">
            <p className="text-xl font-bold text-white">{value.toLocaleString()}</p>
            <p className="text-xs text-white/30 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Profile nav tabs */}
      <div className="flex border-b border-white/10 mb-8">
        <span className="px-1 pb-3 mr-6 text-sm font-medium text-white border-b-2 border-violet-500 translate-y-px">
          Games
        </span>
        <Link
          href={`/users/${username}/diary`}
          className="px-1 pb-3 mr-6 text-sm text-white/40 hover:text-white border-b-2 border-transparent hover:border-white/20 transition-colors translate-y-px"
        >
          Diary
        </Link>
        <Link
          href={`/users/${username}/lists`}
          className="px-1 pb-3 text-sm text-white/40 hover:text-white border-b-2 border-transparent hover:border-white/20 transition-colors translate-y-px"
        >
          Lists
        </Link>
      </div>

      {/* Recent sessions (if any) */}
      {user.sessions.filter(s => !s.isNowPlaying && s.durationMins).length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">
            Recent sessions
          </h2>
          <div className="flex flex-col gap-2">
            {user.sessions
              .filter((s) => !s.isNowPlaying && s.durationMins)
              .slice(0, 5)
              .map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <Link href={`/games/${s.game.slug}`} className="flex-shrink-0">
                    <div className="relative w-7 h-10 rounded overflow-hidden bg-white/5">
                      {s.game.coverUrl && (
                        <Image src={s.game.coverUrl} alt={s.game.title} fill className="object-cover" />
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/games/${s.game.slug}`}
                      className="text-sm text-white/80 hover:text-white transition-colors truncate block"
                    >
                      {s.game.title}
                    </Link>
                  </div>
                  <span className="text-xs text-violet-400 flex-shrink-0">
                    {formatDuration(s.durationMins)}
                  </span>
                  <span className="text-xs text-white/20 flex-shrink-0">
                    {new Date(s.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Game logs */}
      {user.logs.length === 0 ? (
        <div className="text-center py-16 border border-white/5 rounded-xl">
          <p className="text-white/30 text-sm">No games logged yet.</p>
          {isOwnProfile && (
            <Link
              href="/games"
              className="text-violet-400 hover:text-violet-300 text-sm mt-2 inline-block transition-colors"
            >
              Find a game to log →
            </Link>
          )}
        </div>
      ) : (
        <div className="border border-white/5 rounded-xl divide-y divide-white/5">
          {user.logs.map((log) => (
            <div key={log.id} className="flex items-center gap-4 px-4 py-3">
              <Link href={`/games/${log.game.slug}`} className="flex-shrink-0">
                <div className="relative w-9 h-12 rounded overflow-hidden bg-white/5">
                  {log.game.coverUrl ? (
                    <Image src={log.game.coverUrl} alt={log.game.title} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-white/5" />
                  )}
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  href={`/games/${log.game.slug}`}
                  className="text-sm font-medium text-white hover:text-violet-300 transition-colors truncate block"
                >
                  {log.game.title}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-white/30">
                    {STATUS_LABEL[log.status] ?? log.status}
                  </span>
                  {log.rating && (
                    <span className="text-xs text-yellow-400">
                      {"★".repeat(log.rating)}{"☆".repeat(5 - log.rating)}
                    </span>
                  )}
                </div>
                {log.review && (
                  log.isSpoiler ? (
                    <SpoilerText label="Spoiler review">
                      <p className="text-xs text-white/40 mt-1 line-clamp-2">&ldquo;{log.review}&rdquo;</p>
                    </SpoilerText>
                  ) : (
                    <p className="text-xs text-white/40 mt-1 line-clamp-2">&ldquo;{log.review}&rdquo;</p>
                  )
                )}
              </div>

              <span className="text-xs text-white/20 flex-shrink-0">
                {new Date(log.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
