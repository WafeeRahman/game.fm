import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/users";
import { prisma } from "@/lib/db";
import CreateListButton from "@/components/CreateListButton";

export async function generateMetadata({ params }) {
  const { username } = await params;
  return { title: `${username}'s lists` };
}

export default async function UserListsPage({ params }) {
  const { username } = await params;

  const session = await auth();
  const user = await getUserProfile(username, session?.user?.id ?? null);
  if (!user) notFound();

  const isOwnProfile = session?.user?.id === user.id;

  const lists = await prisma.list.findMany({
    where: {
      userId: user.id,
      ...(isOwnProfile ? {} : { isPublic: true }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
      items: {
        take: 4,
        orderBy: { position: "asc" },
        include: {
          game: { select: { coverUrl: true, title: true } },
        },
      },
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Profile header (condensed) */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href={`/users/${username}`}
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            ← {username}
          </Link>
          <h1 className="text-xl font-bold text-white mt-1">Lists</h1>
        </div>
        {isOwnProfile && <CreateListButton />}
      </div>

      {/* Nav tabs */}
      <div className="flex border-b border-white/10 mb-8">
        <Link
          href={`/users/${username}`}
          className="px-1 pb-3 mr-6 text-sm text-white/40 hover:text-white border-b-2 border-transparent hover:border-white/20 transition-colors translate-y-px"
        >
          Games
        </Link>
        <span className="px-1 pb-3 text-sm font-medium text-white border-b-2 border-violet-500 translate-y-px">
          Lists
        </span>
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-20 border border-white/5 rounded-xl">
          <p className="text-white/40 text-sm">No lists yet.</p>
          {isOwnProfile && (
            <p className="text-white/25 text-xs mt-2">
              Create a list to organise your games.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lists.map((list) => (
            <Link
              key={list.id}
              href={`/users/${username}/lists/${list.id}`}
              className="group border border-white/10 rounded-xl p-4 hover:border-violet-500/40 transition-colors bg-white/[0.02]"
            >
              {/* Cover mosaic */}
              <div className="grid grid-cols-4 gap-1 mb-3 h-16">
                {list.items.map((item) => (
                  <div
                    key={item.id}
                    className="relative rounded overflow-hidden bg-white/5"
                  >
                    {item.game.coverUrl && (
                      <Image
                        src={item.game.coverUrl}
                        alt={item.game.title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 4 - list.items.length) }).map(
                  (_, i) => (
                    <div key={`empty-${i}`} className="rounded bg-white/5" />
                  )
                )}
              </div>

              <p className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors truncate">
                {list.name}
              </p>
              <p className="text-xs text-white/30 mt-0.5">
                {list._count.items} {list._count.items === 1 ? "game" : "games"}
                {!list.isPublic && (
                  <span className="ml-2 text-white/20">· Private</span>
                )}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
