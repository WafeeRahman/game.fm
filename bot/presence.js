import { reportPresence } from "./lib/db.js";

// Deduplicate: if a user is in multiple guilds, only process once per update
const processing = new Set();

const EMULATORS = new Set([
  "rpcs3", "pcsx2", "ppsspp", "cemu", "yuzu", "ryujinx",
  "retroarch", "dolphin", "duckstation", "xenia", "citra",
  "mesen", "mgba", "melonds", "vita3k",
]);

function extractGameName(activity) {
  if (!activity) return null;
  const name = activity.name?.trim();
  if (!name) return null;

  if (EMULATORS.has(name.toLowerCase())) {
    const detail = activity.details?.trim();
    if (detail) return detail;
  }

  if (name === "PlayStation" || name.startsWith("PS") && /^PS[345]$/.test(name)) {
    const detail = activity.details?.trim();
    if (detail) return detail;
  }

  return name;
}

function getPlayingActivity(presence) {
  if (!presence?.activities) return null;
  return presence.activities.find((a) => a.type === 0) ?? null;
}

export async function handlePresenceUpdate(oldPresence, newPresence) {
  const discordId = newPresence?.userId ?? oldPresence?.userId;
  if (!discordId) return;
  if (processing.has(discordId)) return;

  const oldGame = getPlayingActivity(oldPresence);
  const newGame = getPlayingActivity(newPresence);

  const oldName = extractGameName(oldGame);
  const newName = extractGameName(newGame);

  if (oldName === newName) return;

  processing.add(discordId);

  try {
    const result = await reportPresence(discordId, newName);

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
