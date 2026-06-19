import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      createdAt: true,
      _count: {
        select: {
          logs: true,
          followers: true,
        },
      },
    },
  });

  // Get total playtime for each user
  const playtimes = await prisma.gameSession.groupBy({
    by: ["userId"],
    where: { userId: { in: users.map((u) => u.id) } },
    _sum: { durationMins: true },
  });

  const playtimeMap = Object.fromEntries(
    playtimes.map((p) => [p.userId, p._sum.durationMins ?? 0])
  );

  // Sort by total playtime descending
  const sorted = users
    .map((u) => ({ ...u, totalMins: playtimeMap[u.id] ?? 0 }))
    .sort((a, b) => b.totalMins - a.totalMins);

  function formatHours(mins) {
    const h = Math.floor(mins / 60);
    return h === 0 ? "<1h" : `${h}h`;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-2">Leaderboard</h1>
      <p className="text-sm text-white/30 mb-8">
        {users.length} player{users.length !== 1 ? "s" : ""} on game.fm
      </p>

      <div className="border border-white/5 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2rem_1fr_4rem_4rem_5rem] gap-3 px-4 py-2 bg-white/[0.02] text-[10px] text-white/30 uppercase tracking-widest">
          <span>#</span>
          <span>Player</span>
          <span className="text-right">Games</span>
          <span className="text-right">Hours</span>
          <span className="text-right">Followers</span>
        </div>

        {sorted.map((user, i) => (
          <Link
            key={user.id}
            href={`/users/${user.username}`}
            className="grid grid-cols-[2rem_1fr_4rem_4rem_5rem] gap-3 items-center px-4 py-3 hover:bg-white/[0.03] transition-colors border-t border-white/5"
          >
            <span className={`text-sm font-bold ${
              i === 0 ? "text-yellow-400" :
              i === 1 ? "text-white/60" :
              i === 2 ? "text-amber-600" :
              "text-white/20"
            }`}>
              {i + 1}
            </span>

            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white/5 flex-shrink-0">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? user.username}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white/20">
                    {user.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name ?? user.username}
                </p>
                <p className="text-xs text-white/30 truncate">@{user.username}</p>
              </div>
            </div>

            <span className="text-sm text-white/50 text-right">
              {user._count.logs}
            </span>
            <span className="text-sm text-violet-400 text-right">
              {formatHours(user.totalMins)}
            </span>
            <span className="text-sm text-white/30 text-right">
              {user._count.followers}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
