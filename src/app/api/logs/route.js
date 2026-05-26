import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { upsertGame } from "@/lib/games";

export async function POST(request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { igdbId, status, rating, review, isReplay } = await request.json();

  if (!igdbId || !status) {
    return Response.json({ error: "igdbId and status are required" }, { status: 400 });
  }

  // 1. Ensure the game exists in our DB
  const game = await upsertGame(igdbId);

  // 2. Upsert the log (one log per user per game)
  const log = await prisma.gameLog.upsert({
    where: {
      userId_gameId: {
        userId: session.user.id,
        gameId: game.id,
      },
    },
    create: {
      userId: session.user.id,
      gameId: game.id,
      status,
      rating: rating ?? null,
      review: review?.trim() || null,
      isReplay: isReplay ?? false,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
    update: {
      status,
      rating: rating ?? null,
      review: review?.trim() || null,
      isReplay: isReplay ?? false,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });

  // 3. Record activity for the feed
  await prisma.activity.upsert({
    where: {
      // re-use the same activity record if they update the log
      id: `log-${log.id}`,
    },
    create: {
      id: `log-${log.id}`,
      userId: session.user.id,
      type: "GAME_LOG",
      referenceId: log.id,
    },
    update: {
      createdAt: new Date(),
    },
  });

  return Response.json(log);
}

// GET the current user's log for a specific game (by igdbId query param)
export async function GET(request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ log: null });
  }

  const { searchParams } = new URL(request.url);
  const igdbId = parseInt(searchParams.get("igdbId"));
  if (!igdbId) return Response.json({ log: null });

  const game = await prisma.game.findUnique({ where: { igdbId } });
  if (!game) return Response.json({ log: null });

  const log = await prisma.gameLog.findUnique({
    where: {
      userId_gameId: { userId: session.user.id, gameId: game.id },
    },
  });

  return Response.json({ log });
}
