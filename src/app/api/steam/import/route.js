import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { resolveSteamInput, getSteamLibrary } from "@/lib/steam";
import { getGamesBySteamIds } from "@/lib/igdb";
import { upsertGameFromData } from "@/lib/games";

// Helper to split an array into chunks
function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { steamInput } = await request.json();
  if (!steamInput?.trim()) {
    return Response.json({ error: "Steam ID is required" }, { status: 400 });
  }

  // 1. Resolve whatever the user entered to a Steam ID
  let steamId;
  try {
    steamId = await resolveSteamInput(steamInput);
  } catch {
    return Response.json({ error: "Could not resolve Steam profile" }, { status: 400 });
  }
  if (!steamId) {
    return Response.json({ error: "Steam profile not found" }, { status: 404 });
  }

  // 2. Fetch their Steam library
  let steamGames;
  try {
    steamGames = await getSteamLibrary(steamId);
  } catch {
    return Response.json(
      { error: "Could not fetch Steam library. Make sure your Steam profile is public." },
      { status: 400 }
    );
  }

  if (steamGames.length === 0) {
    return Response.json({ imported: 0, message: "No games found in Steam library" });
  }

  // 3. Sort by playtime, take up to 500
  const sorted = steamGames
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 500);

  // 4. Match Steam AppIDs to IGDB games in batches of 100
  const appIds = sorted.map((g) => String(g.appid));
  const batches = chunk(appIds, 100);

  const igdbMatches = [];
  for (const batch of batches) {
    const results = await getGamesBySteamIds(batch);
    igdbMatches.push(...results);
  }

  // Build maps: steamAppId -> playtime and recent activity
  const steamData = Object.fromEntries(
    sorted.map((g) => [String(g.appid), {
      playtime: g.playtime_forever,
      recentPlaytime: g.playtime_2weeks ?? 0,
    }])
  );

  // 5. Save matched games to our DB and create GameLog entries
  let synced = 0;
  for (const match of igdbMatches) {
    if (!match.game?.id || !match.game?.slug) continue;

    try {
      const game = await upsertGameFromData(match.game);
      const info = steamData[match.uid] ?? { playtime: 0, recentPlaytime: 0 };

      const status = info.recentPlaytime > 0
        ? "PLAYING"
        : info.playtime > 0
          ? "PLAYED"
          : "BACKLOG";

      await prisma.gameLog.upsert({
        where: {
          userId_gameId: { userId: session.user.id, gameId: game.id },
        },
        create: {
          userId: session.user.id,
          gameId: game.id,
          status,
        },
        update: {},
      });

      synced++;
    } catch {
      continue;
    }
  }

  // 6. Save the Steam ID to the user's profile
  await prisma.user.update({
    where: { id: session.user.id },
    data: { steamId },
  });

  return Response.json({
    synced,
    total: steamGames.length,
    matched: igdbMatches.length,
    message: `Synced ${synced} games from Steam`,
  });
}
