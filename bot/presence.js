import { prisma } from "./lib/db.js";
import { findGameByName, igdbImageUrl } from "./lib/igdb.js";

// Resolve a Discord user ID → game.fm user ID via the linked Discord account
async function getGameFmUserId(discordId) {
  const account = await prisma.account.findFirst({
    where: { provider: "discord", providerAccountId: discordId },
    select: { userId: true },
  });
  return account?.userId ?? null;
}

// Get the game being played from a Discord presence (null if not playing)
function getPlayingActivity(presence) {
  if (!presence?.activities) return null;
  // ActivityType.Playing = 0
  return presence.activities.find((a) => a.type === 0) ?? null;
}

// Ensure the game exists in our DB and return it
async function ensureGame(igdbGame) {
  const coverUrl = igdbImageUrl(igdbGame.cover?.image_id, "cover_big");

  return prisma.game.upsert({
    where: { igdbId: igdbGame.id },
    create: {
      igdbId: igdbGame.id,
      title: igdbGame.name,
      slug: igdbGame.slug,
      coverUrl,
    },
    update: { coverUrl },
  });
}

export async function handlePresenceUpdate(oldPresence, newPresence) {
  const discordId = newPresence?.userId ?? oldPresence?.userId;
  if (!discordId) return;

  const userId = await getGameFmUserId(discordId);
  if (!userId) return; // user hasn't signed into game.fm

  const oldGame = getPlayingActivity(oldPresence);
  const newGame = getPlayingActivity(newPresence);

  const sameName = oldGame?.name === newGame?.name;
  if (sameName) return; // nothing changed

  // --- Close any open session ---
  if (oldGame) {
    const openSession = await prisma.gameSession.findFirst({
      where: { userId, isNowPlaying: true },
      orderBy: { startedAt: "desc" },
    });

    if (openSession) {
      const durationMins = Math.round(
        (Date.now() - openSession.startedAt.getTime()) / 60000
      );
      await prisma.gameSession.update({
        where: { id: openSession.id },
        data: {
          isNowPlaying: false,
          durationMins: durationMins > 0 ? durationMins : null,
          endedAt: new Date(),
        },
      });
      console.log(`[presence] Closed session: ${oldGame.name} (${durationMins}m) for user ${userId}`);
    }
  }

  // --- Open a new session ---
  if (newGame) {
    const igdbGame = await findGameByName(newGame.name);
    if (!igdbGame) {
      console.log(`[presence] No IGDB match for: ${newGame.name}`);
      return;
    }

    const game = await ensureGame(igdbGame);

    await prisma.gameSession.create({
      data: {
        userId,
        gameId: game.id,
        isNowPlaying: true,
        source: "RICH_PRESENCE",
      },
    });

    console.log(`[presence] Opened session: ${newGame.name} → ${igdbGame.name} for user ${userId}`);
  }
}
