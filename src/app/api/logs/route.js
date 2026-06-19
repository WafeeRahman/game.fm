import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { upsertGame } from "@/lib/games";
import { checkReview } from "@/lib/content-filter";

export async function POST(request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { igdbId, status, rating, review, isReplay, isSpoiler, playedOn } = await request.json();

  if (!igdbId || !status) {
    return Response.json({ error: "igdbId and status are required" }, { status: 400 });
  }

  const validStatuses = ["PLAYING", "PLAYED", "COMPLETED", "DROPPED", "BACKLOG", "WISHLIST", "SHELVED"];
  if (!validStatuses.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }
  if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
    return Response.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }
  if (review && typeof review === "string" && review.length > 2000) {
    return Response.json({ error: "Review must be 2000 characters or fewer" }, { status: 400 });
  }
  if (review) {
    const filter = checkReview(review);
    if (!filter.ok) {
      return Response.json({ error: filter.reason }, { status: 422 });
    }
  }

  const game = await upsertGame(igdbId);

  const playedOnDate = playedOn ? new Date(playedOn) : null;

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
      isSpoiler: isSpoiler ?? false,
      playedOn: playedOnDate,
      completedAt: status === "COMPLETED" ? (playedOnDate ?? new Date()) : null,
    },
    update: {
      status,
      rating: rating ?? null,
      review: review?.trim() || null,
      isReplay: isReplay ?? false,
      isSpoiler: isSpoiler ?? false,
      playedOn: playedOnDate,
      completedAt: status === "COMPLETED" ? (playedOnDate ?? new Date()) : null,
    },
  });

  // Record activity for the feed (skip backlog/wishlist — not interesting)
  if (status !== "BACKLOG" && status !== "WISHLIST") {
    await prisma.activity.upsert({
      where: {
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
  }

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
