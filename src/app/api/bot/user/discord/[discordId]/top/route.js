import { prisma } from "@/lib/db";

function isAuthorized(request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.BOT_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

function periodStart(period) {
  const now = new Date();
  switch (period) {
    case "week":  return new Date(now - 7  * 86400000);
    case "month": return new Date(now - 30 * 86400000);
    case "year":  return new Date(now - 365 * 86400000);
    default:      return null; // all time
  }
}

// GET /api/bot/user/discord/[discordId]/top?period=week|month|year|alltime
export async function GET(request, { params }) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { discordId } = await params;
  const period = new URL(request.url).searchParams.get("period") ?? "alltime";
  const since = periodStart(period);

  const account = await prisma.account.findFirst({
    where: { provider: "discord", providerAccountId: discordId },
    select: { userId: true },
  });

  if (!account) return Response.json(null, { status: 404 });

  const topGames = await prisma.gameSession.groupBy({
    by: ["gameId"],
    where: {
      userId: account.userId,
      durationMins: { not: null },
      ...(since ? { startedAt: { gte: since } } : {}),
    },
    _sum: { durationMins: true },
    _count: { id: true },
    orderBy: { _sum: { durationMins: "desc" } },
    take: 10,
  });

  const gameIds = topGames.map((g) => g.gameId);
  if (!gameIds.length) return Response.json([]);

  const games = await prisma.game.findMany({
    where: { id: { in: gameIds } },
    select: { id: true, title: true, slug: true, coverUrl: true },
  });

  return Response.json(
    topGames.map((g) => {
      const game = games.find((gm) => gm.id === g.gameId);
      return {
        title: game?.title ?? "Unknown",
        slug: game?.slug ?? "",
        coverUrl: game?.coverUrl ?? null,
        totalMins: g._sum.durationMins ?? 0,
        sessions: g._count.id,
      };
    })
  );
}
