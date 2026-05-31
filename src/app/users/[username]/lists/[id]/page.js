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
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{list.name}</h1>
          <p className="text-sm text-white/40 mt-1">
            <Link
              href={`/users/${username}`}
              className="hover:text-white transition-colors"
            >
              {username}
            </Link>
            <span className="mx-1.5">·</span>
            {list.items.length} {list.items.length === 1 ? "game" : "games"}
            {!list.isPublic && (
              <span className="ml-1.5 text-white/20">· Private</span>
            )}
          </p>
          {list.description && (
            <p className="text-sm text-white/60 mt-2 max-w-lg">{list.description}</p>
          )}
        </div>
        {isOwner && <DeleteListButton listId={id} username={username} />}
      </div>

      {/* Games grid */}
      {list.items.length === 0 ? (
        <div className="text-center py-20 border border-white/5 rounded-xl">
          <p className="text-white/40 text-sm">No games in this list yet.</p>
          <Link
            href="/games"
            className="text-violet-400 hover:text-violet-300 text-sm mt-2 inline-block transition-colors"
          >
            Search for games →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {list.items.map((item) => (
            <div key={item.id} className="group relative">
              <Link href={`/games/${item.game.slug}`}>
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-white/5 border border-white/10 group-hover:border-violet-500/50 transition-colors">
                  {item.game.coverUrl ? (
                    <Image
                      src={item.game.coverUrl}
                      alt={item.game.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="150px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs p-2 text-center">
                      {item.game.title}
                    </div>
                  )}
                </div>
                <p className="text-xs text-white/50 mt-1.5 truncate group-hover:text-white transition-colors">
                  {item.game.title}
                </p>
              </Link>
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
