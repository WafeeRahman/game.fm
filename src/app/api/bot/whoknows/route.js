import { prisma } from "@/lib/db";

function isAuthorized(request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.BOT_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

// POST /api/bot/whoknows
// Body: { gameName, discordIds }
// Returns game.fm users (from the given Discord IDs) who have played this game, ranked by hours
export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameName, discordIds } = await request.json();
  if (!gameName || !discordIds?.length) {
    return Response.json({ error: "gameName and discordIds are required" }, { status: 400 });
  }

  // Resolve Discord IDs → game.fm user IDs
  const accounts = await prisma.account.findMany({
    where: { provider: "discord", providerAccountId: { in: discordIds } },
    select: { userId: true, providerAccountId: true },
  });

  if (!accounts.length) return Response.json([]);

  const userIds = accounts.map((a) => a.userId);

  // Find the game by name
  const game = await prisma.game.findFirst({
    where: { title: { contains: gameName, mode: "insensitive" } },
    select: { id: true, title: true, slug: true },
  });

  if (!game) return Response.json({ game: null, players: [] });

  // Get sessions for this game from these users
  const sessions = await prisma.gameSession.groupBy({
    by: ["userId"],
    where: { gameId: game.id, userId: { in: userIds }, durationMins: { not: null } },
    _sum: { durationMins: true },
    orderBy: { _sum: { durationMins: "desc" } },
  });

  // Get user info
  const users = await prisma.user.findMany({
    where: { id: { in: sessions.map((s) => s.userId) } },
    select: { id: true, username: true, name: true },
  });

  const players = sessions.map((s) => {
    const user = users.find((u) => u.id === s.userId);
    return {
      name: user?.name ?? user?.username ?? "Unknown",
      username: user?.username,
      totalMins: s._sum.durationMins ?? 0,
    };
  });

  return Response.json({ game, players });
}
