import { reportPresence } from "./lib/db.js";

// Deduplicate: if a user is in multiple guilds, only process once per update
const processing = new Set();

function getPlayingActivity(presence) {
  if (!presence?.activities) return null;
  return presence.activities.find((a) => a.type === 0) ?? null; // type 0 = Playing
}

export async function handlePresenceUpdate(oldPresence, newPresence) {
  const discordId = newPresence?.userId ?? oldPresence?.userId;
  if (!discordId) return;
  if (processing.has(discordId)) return;

  const oldGame = getPlayingActivity(oldPresence);
  const newGame = getPlayingActivity(newPresence);

  // Nothing changed
  if (oldGame?.name === newGame?.name) return;

  processing.add(discordId);

  try {
    const result = await reportPresence(discordId, newGame?.name ?? null);

    if (result.status === "unknown_user") return; // not a game.fm user

    if (result.status === "session_opened") {
      console.log(`[presence] ▶ ${discordId} started: ${result.game}`);
    } else if (result.status === "session_closed") {
      console.log(`[presence] ■ ${discordId} stopped playing`);
    } else if (result.status === "no_igdb_match") {
      console.log(`[presence] ✗ No IGDB match: "${result.gameName}"`);
    }
  } catch (err) {
    console.error(`[presence] Error for ${discordId}:`, err.message);
  } finally {
    processing.delete(discordId);
  }
}
