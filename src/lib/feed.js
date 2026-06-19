import { prisma } from "@/lib/db";

const SESSION_SELECT = {
  id: true,
  startedAt: true,
  endedAt: true,
  durationMins: true,
  isNowPlaying: true,
  user: {
    select: { id: true, username: true, name: true, image: true },
  },
  game: {
    select: { id: true, title: true, slug: true, coverUrl: true },
  },
};

// Get the activity feed for a user — recent sessions from people they follow
export async function getFeed(userId, limit = 30) {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const followingIds = follows.map((f) => f.followingId);
  if (followingIds.length === 0) return [];

  return prisma.gameSession.findMany({
    where: { userId: { in: followingIds } },
    orderBy: { startedAt: "desc" },
    take: limit,
    select: SESSION_SELECT,
  });
}

// Global activity feed — recent sessions from all users
export async function getGlobalFeed(limit = 30) {
  return prisma.gameSession.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
    select: SESSION_SELECT,
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

  return gameIds
    .map((id) => games.find((g) => g.id === id))
    .filter(Boolean);
}
