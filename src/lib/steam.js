const STEAM_API = "https://api.steampowered.com";

// Fetch all owned games for a Steam ID.
// Requires the Steam profile to be public.
export async function getSteamLibrary(steamId) {
  const url = `${STEAM_API}/IPlayerService/GetOwnedGames/v1/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}&include_appinfo=1&format=json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Steam API error: ${res.status}`);
  const data = await res.json();
  return data.response?.games ?? [];
}

// Resolve a vanity URL (e.g. "gaben") to a full 64-bit Steam ID.
export async function resolveSteamVanityUrl(vanityUrl) {
  const url = `${STEAM_API}/ISteamUser/ResolveVanityURL/v1/?key=${process.env.STEAM_API_KEY}&vanityurl=${vanityUrl}`;
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  if (data.response?.success !== 1) return null;
  return data.response.steamid;
}

// Accept a Steam ID (17-digit number), a full profile URL, or a vanity name.
// Always returns a 64-bit Steam ID string, or throws.
export async function resolveSteamInput(input) {
  const trimmed = input.trim();

  // Already a 64-bit Steam ID
  if (/^\d{17}$/.test(trimmed)) return trimmed;

  // Full URL — extract the relevant part
  const urlMatch = trimmed.match(
    /steamcommunity\.com\/(id|profiles)\/([^/]+)/
  );
  if (urlMatch) {
    if (urlMatch[1] === "profiles") return urlMatch[2]; // numeric ID in URL
    return resolveSteamVanityUrl(urlMatch[2]);           // vanity URL
  }

  // Assume it's a plain vanity name
  return resolveSteamVanityUrl(trimmed);
}
