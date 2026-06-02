import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { upsertGame } from "@/lib/games";

// POST /api/sessions — log a play session
export async function POST(request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { igdbId, durationMins, platform, isNowPlaying } = await request.json();

  if (!igdbId) {
    return Response.json({ error: "igdbId is required" }, { status: 400 });
  }

  const game = await upsertGame(igdbId);

  // Clear any existing now-playing sessions before setting a new one
  if (isNowPlaying) {
    await prisma.gameSession.updateMany({
      where: { userId: session.user.id, isNowPlaying: true },
      data: { isNowPlaying: false },
    });
  }

  const gameSession = await prisma.gameSession.create({
    data: {
      userId: session.user.id,
      gameId: game.id,
      durationMins: durationMins ?? null,
      platform: platform ?? null,
      isNowPlaying: isNowPlaying ?? false,
      source: "MANUAL",
    },
    include: {
      game: { select: { title: true, slug: true } },
    },
  });

  return Response.json(gameSession, { status: 201 });
}

// DELETE /api/sessions/now-playing — clear now-playing status
export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.gameSession.updateMany({
    where: { userId: session.user.id, isNowPlaying: true },
    data: { isNowPlaying: false },
  });

  return Response.json({ cleared: true });
}
