import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getUserProfile, getTotalPlaytime } from "@/lib/users";

export async function generateMetadata({ params }) {
  const { username } = await params;
  return { title: username };
}

export default async function UserProfilePage({ params }) {
  const { username } = await params;

  const [session, user] = await Promise.all([
    auth(),
    getUserProfile(username),
  ]);

  if (!user) notFound();

  const isOwnProfile = session?.user?.id === user.id;
  const totalMins = await getTotalPlaytime(user.id);
  const totalHours = Math.floor(totalMins / 60);

  const stats = [
    { label: "Games", value: user._count.logs },
    { label: "Hours", value: totalHours },
    { label: "Followers", value: user._count.followers },
    { label: "Following", value: user._count.following },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Profile header */}
      <div className="flex items-start gap-6 mb-10">
        {/* Avatar */}
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
          {user.image ? (
            <Image src={user.image} alt={user.name ?? username} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-2xl text-white/20">
              {username[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{user.name ?? username}</h1>
            <span className="text-white/40 text-sm">@{username}</span>
            {isOwnProfile && (
              <Link
                href="/settings"
                className="text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/30 px-2.5 py-1 rounded-md transition-colors"
              >
                Edit profile
              </Link>
            )}
          </div>

          {user.bio && (
            <p className="text-sm text-white/60 mt-2 max-w-lg">{user.bio}</p>
          )}

          <p className="text-xs text-white/30 mt-2">
            Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/10 mb-10">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-neutral-950 text-center py-4">
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-xs text-white/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Favourite games — 4 slots like Letterboxd */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">
          Favourite Games
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-lg bg-white/5 border border-white/10 border-dashed flex items-center justify-center text-white/20 text-2xl hover:border-violet-500/40 hover:text-violet-400/40 transition-colors cursor-pointer"
            >
              +
            </div>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section>
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">
          Recent Activity
        </h2>

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
          <div className="flex flex-col divide-y divide-white/5">
            {user.logs.map((log) => (
              <div key={log.id} className="flex items-center gap-4 py-3">
                {/* Cover thumbnail */}
                <div className="relative w-10 h-14 rounded flex-shrink-0 overflow-hidden bg-white/5">
                  {log.game.coverUrl ? (
                    <Image src={log.game.coverUrl} alt={log.game.title} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-white/5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/games/${log.game.slug}`}
                    className="text-sm font-medium text-white hover:text-violet-300 transition-colors truncate block"
                  >
                    {log.game.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-white/30 capitalize">{log.status.toLowerCase()}</span>
                    {log.rating && (
                      <span className="text-xs text-violet-400">★ {log.rating}</span>
                    )}
                  </div>
                </div>

                <span className="text-xs text-white/20 flex-shrink-0">
                  {new Date(log.updatedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
