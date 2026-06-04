import { prisma } from "@/lib/db";

function isAuthorized(request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.BOT_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

// POST /api/bot/compare — compare two users' gaming history
export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { discordId1, discordId2 } = await request.json();

  const [account1, account2] = await Promise.all([
    prisma.account.findFirst({ where: { provider: "discord", providerAccountId: discordId1 }, select: { userId: true } }),
    prisma.account.findFirst({ where: { provider: "discord", providerAccountId: discordId2 }, select: { userId: true } }),
  ]);

  if (!account1 || !account2) {
    return Response.json({ error: "One or both users not found" }, { status: 404 });
  }

  const [user1, user2, sessions1, sessions2] = await Promise.all([
    prisma.user.findUnique({ where: { id: account1.userId }, select: { username: true, name: true } }),
    prisma.user.findUnique({ where: { id: account2.userId }, select: { username: true, name: true } }),
    prisma.gameSession.groupBy({
      by: ["gameId"],
      where: { userId: account1.userId, durationMins: { not: null } },
      _sum: { durationMins: true },
    }),
    prisma.gameSession.groupBy({
      by: ["gameId"],
      where: { userId: account2.userId, durationMins: { not: null } },
      _sum: { durationMins: true },
    }),
  ]);

  const map1 = new Map(sessions1.map((s) => [s.gameId, s._sum.durationMins ?? 0]));
  const map2 = new Map(sessions2.map((s) => [s.gameId, s._sum.durationMins ?? 0]));

  const sharedIds = [...map1.keys()].filter((id) => map2.has(id));

  const sharedGames = await prisma.game.findMany({
    where: { id: { in: sharedIds } },
    select: { id: true, title: true, slug: true },
  });

  const shared = sharedGames.map((g) => ({
    title: g.title,
    slug: g.slug,
    mins1: map1.get(g.id) ?? 0,
    mins2: map2.get(g.id) ?? 0,
  })).sort((a, b) => (b.mins1 + b.mins2) - (a.mins1 + a.mins2));

  return Response.json({
    user1: { name: user1?.name ?? user1?.username, username: user1?.username },
    user2: { name: user2?.name ?? user2?.username, username: user2?.username },
    sharedCount: shared.length,
    totalGames1: sessions1.length,
    totalGames2: sessions2.length,
    shared: shared.slice(0, 5),
  });
}
