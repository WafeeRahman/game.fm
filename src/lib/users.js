import { prisma } from "@/lib/db";

// Fetch a user profile by username.
// Pass viewerId (the logged-in user's ID) so private logs are only shown to the owner.
export async function getUserProfile(username, viewerId = null) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      bio: true,
      isPublic: true,
      createdAt: true,
      _count: {
        select: {
          logs: true,
          followers: true,
          following: true,
        },
      },
      logs: {
        where: {
          // Non-owners only see public logs
          isPublic: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: {
          id: true,
          status: true,
          rating: true,
          review: true,
          playedOn: true,
          completedAt: true,
          updatedAt: true,
          game: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverUrl: true,
            },
          },
        },
      },
      sessions: {
        orderBy: { startedAt: "desc" },
        take: 5,
        select: {
          id: true,
          startedAt: true,
          durationMins: true,
          isNowPlaying: true,
          game: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverUrl: true,
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  // If the viewer is the owner, also fetch their private logs and merge them in
  if (viewerId && viewerId === user.id) {
    const privateLogs = await prisma.gameLog.findMany({
      where: { userId: user.id, isPublic: false },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        rating: true,
        review: true,
        playedOn: true,
        completedAt: true,
        updatedAt: true,
        game: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
          },
        },
      },
    });

    // Merge and re-sort by updatedAt, keep top 10
    user.logs = [...user.logs, ...privateLogs]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 10);
  }

  return user;
}

// Total playtime across all sessions in minutes
export async function getTotalPlaytime(userId) {
  const result = await prisma.gameSession.aggregate({
    where: { userId },
    _sum: { durationMins: true },
  });
  return result._sum.durationMins ?? 0;
}
