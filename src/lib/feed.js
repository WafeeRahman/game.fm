import { prisma } from "@/lib/db";

// Get the activity feed for a user — recent game logs from people they follow
export async function getFeed(userId, limit = 30) {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const followingIds = follows.map((f) => f.followingId);
  if (followingIds.length === 0) return [];

  return prisma.gameLog.findMany({
    where: {
      userId: { in: followingIds },
      isPublic: true,
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      status: true,
      rating: true,
      review: true,
      isSpoiler: true,
      updatedAt: true,
      _count: { select: { likes: true } },
      user: {
        select: { id: true, username: true, name: true, image: true },
      },
      game: {
        select: { id: true, title: true, slug: true, coverUrl: true },
      },
    },
  });
}

// Get popular games for the logged-out home page
export async function getPopularLoggedGames(limit = 20) {
  const result = await prisma.gameLog.groupBy({
    by: ["gameId"],
    _count: { gameId: true },
    orderBy: { _count: { gameId: "desc" } },
    take: limit,
  });

  const gameIds = result.map((r) => r.gameId);
  if (gameIds.length === 0) return [];

  const games = await prisma.game.findMany({
    where: { id: { in: gameIds } },
  });

  // Preserve the ranking order
  return gameIds
    .map((id) => games.find((g) => g.id === id))
    .filter(Boolean);
}
