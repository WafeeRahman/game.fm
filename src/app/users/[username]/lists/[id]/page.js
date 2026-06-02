import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import DeleteListButton from "@/components/DeleteListButton";
import RemoveFromListButton from "@/components/RemoveFromListButton";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const list = await prisma.list.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: list?.name ?? "List" };
}

export default async function ListDetailPage({ params }) {
  const { username, id } = await params;

  const [session, list] = await Promise.all([
    auth(),
    prisma.list.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true } },
        items: {
          orderBy: { position: "asc" },
          include: {
            game: {
              select: {
                id: true,
                title: true,
                slug: true,
                coverUrl: true,
                igdbId: true,
              },
            },
          },
        },
      },
    }),
  ]);

  if (!list || list.user.username !== username) notFound();
  if (!list.isPublic && session?.user?.id !== list.userId) notFound();

  const isOwner = session?.user?.id === list.userId;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-xs text-white/30 mb-2 uppercase tracking-widest">
            <Link href={`/users/${username}`} className="hover:text-white/60 transition-colors">
              {username}
            </Link>
            {" / "}List
          </p>
          <h1 className="text-3xl font-bold text-white tracking-tight">{list.name}</h1>
          <p className="text-sm text-white/40 mt-2">
            {list.items.length} {list.items.length === 1 ? "game" : "games"}
            {!list.isPublic && (
              <span className="ml-2 text-white/20">· Private</span>
            )}
          </p>
          {list.description && (
            <p className="text-sm text-white/50 mt-2 max-w-lg leading-relaxed">{list.description}</p>
          )}
        </div>
        {isOwner && <DeleteListButton listId={id} username={username} />}
      </div>

      {/* Games grid */}
      {list.items.length === 0 ? (
        <div className="text-center py-24 border border-white/5 rounded-2xl">
          <p className="text-white/30 text-sm">No games in this list yet.</p>
          <Link
            href="/games"
            className="text-violet-400 hover:text-violet-300 text-sm mt-3 inline-block transition-colors"
          >
            Search for games →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {list.items.map((item) => (
            <div key={item.id} className="group relative">
              <Link href={`/games/${item.game.slug}`}>
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/[0.08] group-hover:border-violet-500/50 transition-all duration-200 shadow-md group-hover:shadow-violet-900/20 group-hover:shadow-xl">
                  {item.game.coverUrl ? (
                    <Image
                      src={item.game.coverUrl}
                      alt={item.game.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs p-3 text-center leading-snug">
                      {item.game.title}
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
                    <p className="text-xs text-white font-medium leading-snug line-clamp-2">
                      {item.game.title}
                    </p>
                  </div>
                </div>
              </Link>

              <p className="text-xs text-white/40 mt-2 truncate group-hover:text-white/70 transition-colors">
                {item.game.title}
              </p>

              {isOwner && (
                <RemoveFromListButton listId={id} igdbId={item.game.igdbId} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
