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

    const igdbRes = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "text/plain",
      },
      body: `fields name; search "zelda"; limit 3;`,
      cache: "no-store",
    });

    const igdbText = await igdbRes.text();

    return Response.json({
      twitchToken: "ok",
      igdbStatus: igdbRes.status,
      igdbResponse: igdbRes.ok ? JSON.parse(igdbText) : igdbText,
    });
  } catch (e) {
    return Response.json({ error: e.message, stack: e.stack?.split("\n").slice(0, 3) });
  }
}
