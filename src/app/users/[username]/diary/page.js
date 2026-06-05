import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/users";
import { prisma } from "@/lib/db";
import SpoilerText from "@/components/SpoilerText";

export async function generateMetadata({ params }) {
  const { username } = await params;
  return { title: `${username}'s diary` };
}

const STATUS_LABEL = {
  PLAYING:   { label: "Playing",   color: "text-blue-400" },
  COMPLETED: { label: "Completed", color: "text-green-400" },
  DROPPED:   { label: "Dropped",   color: "text-red-400" },
  BACKLOG:   { label: "Backlog",   color: "text-white/40" },
  WISHLIST:  { label: "Wishlist",  color: "text-yellow-400" },
  SHELVED:   { label: "Shelved",   color: "text-white/30" },
};

export default async function DiaryPage({ params }) {
  const { username } = await params;

  const session = await auth();
  const user = await getUserProfile(username, session?.user?.id ?? null);
  if (!user) notFound();

  const isOwnProfile = session?.user?.id === user.id;

  // Fetch all logs with playedOn, sorted by date desc
  const logs = await prisma.gameLog.findMany({
    where: {
      userId: user.id,
      ...(isOwnProfile ? {} : { isPublic: true }),
    },
    orderBy: [
      { playedOn: "desc" },
      { updatedAt: "desc" },
    ],
    select: {
      id: true,
      status: true,
      rating: true,
      review: true,
      isSpoiler: true,
      playedOn: true,
      updatedAt: true,
      isReplay: true,
      game: {
        select: { id: true, title: true, slug: true, coverUrl: true },
      },
    },
  });

  // Group by year + month
  const grouped = {};
  for (const log of logs) {
    const date = log.playedOn ?? log.updatedAt;
    const key = new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long" });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({ ...log, _date: date });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Profile nav */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href={`/users/${username}`}
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            ← {username}
          </Link>
          <h1 className="text-xl font-bold text-white mt-1">Diary</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-8">
        <Link
          href={`/users/${username}`}
          className="px-1 pb-3 mr-6 text-sm text-white/40 hover:text-white border-b-2 border-transparent hover:border-white/20 transition-colors translate-y-px"
        >
          Games
        </Link>
        <Link
          href={`/users/${username}/lists`}
          className="px-1 pb-3 mr-6 text-sm text-white/40 hover:text-white border-b-2 border-transparent hover:border-white/20 transition-colors translate-y-px"
        >
          Lists
        </Link>
        <span className="px-1 pb-3 text-sm font-medium text-white border-b-2 border-violet-500 translate-y-px">
          Diary
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-20 border border-white/5 rounded-xl">
          <p className="text-white/30 text-sm">No entries yet.</p>
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
        <div className="flex flex-col gap-10">
          {Object.entries(grouped).map(([month, entries]) => (
            <section key={month}>
              <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">
                {month}
              </h2>
              <div className="border border-white/5 rounded-xl divide-y divide-white/5">
                {entries.map((log) => {
                  const statusInfo = STATUS_LABEL[log.status] ?? { label: log.status, color: "text-white/40" };
                  return (
                    <div key={log.id} className="flex items-start gap-4 px-4 py-4">
                      {/* Date */}
                      <div className="w-8 flex-shrink-0 text-center">
                        <p className="text-xs font-bold text-white/70">
                          {new Date(log._date).getDate()}
                        </p>
                        <p className="text-[10px] text-white/25 uppercase">
                          {new Date(log._date).toLocaleDateString("en-US", { weekday: "short" })}
                        </p>
                      </div>

                      {/* Cover */}
                      <Link href={`/games/${log.game.slug}`} className="flex-shrink-0">
                        <div className="relative w-9 h-12 rounded overflow-hidden bg-white/5">
                          {log.game.coverUrl && (
                            <Image src={log.game.coverUrl} alt={log.game.title} fill className="object-cover" />
                          )}
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/games/${log.game.slug}`}
                            className="text-sm font-medium text-white hover:text-violet-300 transition-colors"
                          >
                            {log.game.title}
                          </Link>
                          {log.isReplay && (
                            <span className="text-[10px] text-white/30 border border-white/10 rounded px-1.5 py-0.5">
                              Replay
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</span>
                          {log.rating && (
                            <span className="text-xs text-yellow-400">
                              {"★".repeat(log.rating)}{"☆".repeat(5 - log.rating)}
                            </span>
                          )}
                        </div>
                        {log.review && (
                          log.isSpoiler && !isOwnProfile ? (
                            <div className="mt-1">
                              <SpoilerText>
                                <p className="text-xs text-white/40 leading-relaxed line-clamp-2">
                                  &ldquo;{log.review}&rdquo;
                                </p>
                              </SpoilerText>
                            </div>
                          ) : (
                            <div className="flex items-start gap-1.5 mt-1">
                              {log.isSpoiler && (
                                <span className="text-[9px] text-amber-400/70 border border-amber-400/30 rounded px-1 py-0.5 flex-shrink-0 mt-0.5">
                                  Spoiler
                                </span>
                              )}
                              <p className="text-xs text-white/40 leading-relaxed line-clamp-2">
                                &ldquo;{log.review}&rdquo;
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
