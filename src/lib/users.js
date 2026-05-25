import { prisma } from "@/lib/db";

// Fetch a public user profile by username, including stats
export async function getUserProfile(username) {
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
      // Most recent game logs for the diary section
      logs: {
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: {
          id: true,
          status: true,
          rating: true,
          review: true,
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
      // Most recent play sessions
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
