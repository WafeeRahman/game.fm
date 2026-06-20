import { prisma } from "@/lib/db";
import { findGameByName } from "@/lib/igdb";
import { upsertGameFromData } from "@/lib/games";

// Verify the request is from our bot
function isAuthorized(request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.BOT_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

// POST /api/bot/presence
// Body: { discordId, gameName }
// gameName = null means the user stopped playing
export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { discordId, gameName } = await request.json();
  if (!discordId) {
    return Response.json({ error: "discordId is required" }, { status: 400 });
  }

  // Resolve Discord ID → game.fm user
  const account = await prisma.account.findFirst({
    where: { provider: "discord", providerAccountId: String(discordId) },
    select: { userId: true },
  });

  if (!account) {
    return Response.json({ status: "unknown_user" });
  }

  const userId = account.userId;

  // Close any open session
  const openSession = await prisma.gameSession.findFirst({
    where: { userId, isNowPlaying: true },
    orderBy: { startedAt: "desc" },
  });

  if (openSession) {
    const durationMins = Math.max(
      1,
      Math.round((Date.now() - openSession.startedAt.getTime()) / 60000)
    );
    await prisma.gameSession.update({
      where: { id: openSession.id },
      data: { isNowPlaying: false, durationMins, endedAt: new Date() },
    });

    // Move game log from PLAYING → PLAYED now that session ended
    await prisma.gameLog.updateMany({
      where: { userId, gameId: openSession.gameId, status: "PLAYING" },
      data: { status: "PLAYED" },
    });
  }

  // Open a new session if the user started a game
  if (gameName) {
    const igdbGame = await findGameByName(gameName);
    if (!igdbGame) {
      return Response.json({ status: "no_igdb_match", gameName });
    }

    const game = await upsertGameFromData(igdbGame);

    await prisma.gameSession.create({
      data: {
        userId,
        gameId: game.id,
        isNowPlaying: true,
        source: "RICH_PRESENCE",
      },
    });

    await prisma.gameLog.upsert({
      where: { userId_gameId: { userId, gameId: game.id } },
      create: { userId, gameId: game.id, status: "PLAYING" },
      update: {},
    });

    await prisma.gameLog.updateMany({
      where: { userId, gameId: game.id, status: { in: ["BACKLOG", "WISHLIST"] } },
      data: { status: "PLAYING" },
    });

    return Response.json({ status: "session_opened", game: igdbGame.name });
  }

  return Response.json({ status: "session_closed" });
}
