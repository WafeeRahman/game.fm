// Minimal IGDB client for the bot — matches a game name to an IGDB game
// Reuses the same token cache pattern as the web app

let tokenCache = null;

async function getToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.token;

  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" }
  );
  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60000,
  };
  return tokenCache.token;
}

async function igdbFetch(endpoint, query) {
  const token = await getToken();
  const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body: query,
  });
  return res.json();
}

// Cache: game name (lowercase) → igdb game object
const nameCache = new Map();

export async function findGameByName(name) {
  const key = name.toLowerCase();
  if (nameCache.has(key)) return nameCache.get(key);

  const results = await igdbFetch(
    "games",
    `search "${name}"; fields id,name,slug,cover.image_id; limit 1;`
  );

  const game = results?.[0] ?? null;
  nameCache.set(key, game);
  return game;
}

export function igdbImageUrl(imageId, size = "cover_big") {
  if (!imageId) return null;
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}
