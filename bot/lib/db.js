// Bot communicates with game.fm via HTTP — no direct DB access needed.
// All session logic lives in /api/bot/presence on the web server.

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
const SECRET = process.env.BOT_SECRET;

export async function reportPresence(discordId, gameName) {
  const res = await fetch(`${BASE_URL}/api/bot/presence`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SECRET}`,
    },
    body: JSON.stringify({ discordId, gameName: gameName ?? null }),
  });

  if (!res.ok) {
    throw new Error(`presence API returned ${res.status}`);
  }

  return res.json();
}

// Slash command helpers — fetch public data from the web API
export async function fetchUserStats(username) {
  const res = await fetch(`${BASE_URL}/api/bot/user/${username}`);
  if (!res.ok) return null;
  return res.json();
}
