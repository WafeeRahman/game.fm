import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export async function generateMetadata({ params }) {
  const { username } = await params;
  return { title: `${username}'s Followers` };
}

export default async function FollowersPage({ params }) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      followers: {
        orderBy: { createdAt: "desc" },
        select: {
          follower: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!user) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link
          href={`/users/${username}`}
          className="text-sm text-white/40 hover:text-white transition-colors"
        >
          &larr; {user.name ?? username}
        </Link>
        <h1 className="text-xl font-bold text-white mt-2">Followers</h1>
        <p className="text-sm text-white/30 mt-1">
          {user.followers.length} {user.followers.length === 1 ? "follower" : "followers"}
        </p>
      </div>

      {user.followers.length === 0 ? (
        <div className="text-center py-16 border border-white/5 rounded-xl">
          <p className="text-white/30 text-sm">No followers yet.</p>
        </div>
      ) : (
        <div className="border border-white/5 rounded-xl divide-y divide-white/5">
          {user.followers.map(({ follower }) => (
            <Link
              key={follower.id}
              href={`/users/${follower.username}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
            >
              <div className="relative w-9 h-9 rounded-full overflow-hidden bg-white/5 flex-shrink-0">
                {follower.image ? (
                  <Image
                    src={follower.image}
                    alt={follower.name ?? follower.username}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white/20">
                    {follower.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {follower.name ?? follower.username}
                </p>
                <p className="text-xs text-white/30">@{follower.username}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
