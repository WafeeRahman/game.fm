// IGDB API client (powered by Twitch)
// Docs: https://api-docs.igdb.com

// In-memory token cache — Twitch tokens last ~60 days so this is fine
let tokenCache = { token: null, expiresAt: 0 };

async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" }
  );

  if (!res.ok) throw new Error(`Twitch token error: ${res.status}`);

  const data = await res.json();

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60_000, // 1 min buffer
  };

  return tokenCache.token;
}

async function igdbFetch(endpoint, query) {
  const token = await getAccessToken();

  const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body: query,
    next: { revalidate: 3600 }, // cache IGDB responses for 1 hour (Next.js built-in)
  });

  if (!res.ok) throw new Error(`IGDB error: ${res.status} on ${endpoint}`);

  return res.json();
}

// Convert an IGDB image_id to a full CDN URL
// Available sizes: thumb, cover_small, cover_big, screenshot_med, screenshot_big, 720p, 1080p
export function igdbImageUrl(imageId, size = "cover_big") {
  if (!imageId) return null;
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

// Search games by name — used for the search bar
export async function searchGames(query, limit = 10) {
  return igdbFetch(
    "games",
    `
    search "${query}";
    fields name, slug, cover.image_id, first_release_date, genres.name, platforms.name, summary;
    limit ${limit};
  `
  );
}

// Get a single game by its IGDB slug — used for game detail pages
export async function getGameBySlug(slug) {
  const results = await igdbFetch(
    "games",
    `
    fields name, slug, cover.image_id, screenshots.image_id,
           first_release_date, genres.name, platforms.name, summary,
           involved_companies.company.name, involved_companies.developer,
           involved_companies.publisher, rating, total_rating, total_rating_count;
    where slug = "${slug}";
    limit 1;
  `
  );
  return results[0] ?? null;
}

// Get a single game by its IGDB numeric id — used when syncing to our DB
export async function getGameById(igdbId) {
  const results = await igdbFetch(
    "games",
    `
    fields name, slug, cover.image_id, screenshots.image_id,
           first_release_date, genres.name, platforms.name, summary,
           involved_companies.company.name, involved_companies.developer,
           involved_companies.publisher, rating, total_rating, total_rating_count;
    where id = ${igdbId};
    limit 1;
  `
  );
  return results[0] ?? null;
}

// Batch-lookup IGDB games by their Steam AppIDs using the external_games endpoint.
// Returns an array of { uid (steamAppId), game } objects.
// Call in chunks of 100 to stay well within rate limits.
export async function getGamesBySteamIds(steamAppIds) {
  if (steamAppIds.length === 0) return [];
  const uidList = steamAppIds.map((id) => `"${id}"`).join(",");
  return igdbFetch(
    "external_games",
    `
    fields uid,
           game.id, game.name, game.slug, game.cover.image_id,
           game.first_release_date, game.genres.name, game.platforms.name,
           game.summary, game.total_rating,
           game.involved_companies.company.name,
           game.involved_companies.developer,
           game.involved_companies.publisher;
    where external_game_source = 1 & uid = (${uidList});
    limit 500;
  `
  );
}

// Get popular/trending games — used for the homepage
export async function getPopularGames(limit = 20) {
  return igdbFetch(
    "games",
    `
    fields name, slug, cover.image_id, genres.name, platforms.name, total_rating, total_rating_count;
    where total_rating_count > 200 & cover.image_id != null & category = 0;
    sort total_rating desc;
    limit ${limit};
  `
  );
}
