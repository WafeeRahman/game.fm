export async function GET() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return Response.json({
      error: "Missing env vars",
      hasTwitchClientId: !!clientId,
      hasTwitchClientSecret: !!clientSecret,
    });
  }

  try {
    const tokenRes = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      { method: "POST", cache: "no-store" }
    );
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      return Response.json({ error: "Twitch token failed", status: tokenRes.status, body: tokenData });
    }

    const headers = {
      "Client-ID": clientId,
      Authorization: `Bearer ${tokenData.access_token}`,
      "Content-Type": "text/plain",
    };

    const noFilter = await fetch("https://api.igdb.com/v4/games", {
      method: "POST", headers, cache: "no-store",
      body: `search "zelda"; fields name, slug, category; limit 3;`,
    });
    const noFilterText = await noFilter.text();

    const withFilter = await fetch("https://api.igdb.com/v4/games", {
      method: "POST", headers, cache: "no-store",
      body: `search "zelda"; fields name, slug, category; where category = 0; limit 3;`,
    });
    const withFilterText = await withFilter.text();

    return Response.json({
      twitchToken: "ok",
      noFilter: { status: noFilter.status, body: noFilter.ok ? JSON.parse(noFilterText) : noFilterText },
      withFilter: { status: withFilter.status, body: withFilter.ok ? JSON.parse(withFilterText) : withFilterText },
    });
  } catch (e) {
    return Response.json({ error: e.message, stack: e.stack?.split("\n").slice(0, 3) });
  }
}
