import { prisma } from "@/lib/db";

function isAuthorized(request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.BOT_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

// GET /api/bot/user/discord/[discordId]/streak
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

  // Get all sessions ordered by date
  const sessions = await prisma.gameSession.findMany({
    where: { userId: account.userId, durationMins: { not: null } },
    orderBy: { startedAt: "desc" },
    select: { startedAt: true, durationMins: true, game: { select: { title: true } } },
  });

  if (!sessions.length) return Response.json({ current: 0, best: 0, lastGame: null });

  // Build a set of unique days with sessions (YYYY-MM-DD)
  const daySet = new Set(
    sessions.map((s) => new Date(s.startedAt).toISOString().split("T")[0])
  );
  const days = [...daySet].sort((a, b) => b.localeCompare(a)); // newest first

  // Calculate current streak
  let current = 0;
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Streak is valid if played today or yesterday
  if (days[0] === today || days[0] === yesterday) {
    let checkDate = days[0];
    for (const day of days) {
      if (day === checkDate) {
        current++;
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        checkDate = d.toISOString().split("T")[0];
      } else {
        break;
      }
    }
  }

  // Calculate best streak
  let best = 1;
  let runningBest = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = Math.round((prev - curr) / 86400000);
    if (diff === 1) {
      runningBest++;
      best = Math.max(best, runningBest);
    } else {
      runningBest = 1;
    }
  }

  return Response.json({
    current,
    best,
    lastGame: sessions[0]?.game.title ?? null,
    lastPlayed: sessions[0]?.startedAt ?? null,
  });
}
