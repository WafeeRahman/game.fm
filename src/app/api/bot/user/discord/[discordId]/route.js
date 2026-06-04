import { prisma } from "@/lib/db";

function isAuthorized(request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.BOT_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

export async function GET(request, { params }) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { discordId } = await params;

  const account = await prisma.account.findFirst({
    where: { provider: "discord", providerAccountId: discordId },
    select: { userId: true },
  });

  if (!account) return Response.json(null, { status: 404 });

  const user = await prisma.user.findUnique({
    where: { id: account.userId },
    select: { id: true, username: true, name: true, _count: { select: { logs: true } } },
  });

  if (!user) return Response.json(null, { status: 404 });

  const [totalMins, sessions, nowPlaying, lastSession] = await Promise.all([
    prisma.gameSession.aggregate({
      where: { userId: user.id },
      _sum: { durationMins: true },
    }),
    prisma.gameSession.findMany({
      where: { userId: user.id, durationMins: { not: null } },
      orderBy: { startedAt: "desc" },
      take: 5,
      select: {
        startedAt: true,
        durationMins: true,
        game: { select: { title: true, slug: true } },
      },
    }),
    prisma.gameSession.findFirst({
      where: { userId: user.id, isNowPlaying: true },
      select: {
        startedAt: true,
        game: { select: { title: true, slug: true, coverUrl: true } },
      },
    }),
    prisma.gameSession.findFirst({
      where: { userId: user.id, isNowPlaying: false, durationMins: { not: null } },
      orderBy: { startedAt: "desc" },
      select: {
        startedAt: true,
        durationMins: true,
        game: { select: { title: true, slug: true } },
      },
    }),
  ]);

  return Response.json({
    username: user.username,
    name: user.name,
    gamesLogged: user._count.logs,
    totalHours: Math.floor((totalMins._sum.durationMins ?? 0) / 60),
    totalMins: totalMins._sum.durationMins ?? 0,
    nowPlaying: nowPlaying ? {
      title: nowPlaying.game.title,
      slug: nowPlaying.game.slug,
      startedAt: nowPlaying.startedAt,
    } : null,
    lastSession: lastSession ? {
      title: lastSession.game.title,
      slug: lastSession.game.slug,
      startedAt: lastSession.startedAt,
      durationMins: lastSession.durationMins,
    } : null,
    sessions,
  });
}
