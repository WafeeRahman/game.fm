import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

function isAuthorized(request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.BOT_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

function periodStart(period) {
  const now = new Date();
  switch (period) {
    case "week":  return new Date(now - 7 * 86400000);
    case "month": return new Date(now - 30 * 86400000);
    case "year":  return new Date(now - 365 * 86400000);
    default:      return null;
  }
}

function formatDur(mins) {
  if (!mins) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const PERIOD_LABEL = { week: "This Week", month: "This Month", year: "This Year", alltime: "All Time" };

// GET /api/bot/chart?discordId=...&period=...&size=3x3|4x4|5x5
export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const discordId = url.searchParams.get("discordId");
  const period = url.searchParams.get("period") ?? "alltime";
  const size = url.searchParams.get("size") ?? "3x3";

  if (!discordId) {
    return Response.json({ error: "discordId required" }, { status: 400 });
  }

  const [cols, rows] = size.split("x").map(Number);
  const gridSize = Math.min(cols * rows, 25);

  const account = await prisma.account.findFirst({
    where: { provider: "discord", providerAccountId: discordId },
    select: { userId: true, user: { select: { name: true, username: true } } },
  });

  if (!account) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const since = periodStart(period);

  const topGames = await prisma.gameSession.groupBy({
    by: ["gameId"],
    where: {
      userId: account.userId,
      durationMins: { not: null },
      ...(since ? { startedAt: { gte: since } } : {}),
    },
    _sum: { durationMins: true },
    _count: { id: true },
    orderBy: { _sum: { durationMins: "desc" } },
    take: gridSize,
  });

  if (!topGames.length) {
    return Response.json({ error: "No data" }, { status: 404 });
  }

  const games = await prisma.game.findMany({
    where: { id: { in: topGames.map((g) => g.gameId) } },
    select: { id: true, title: true, coverUrl: true },
  });

  const items = topGames.map((g) => {
    const game = games.find((gm) => gm.id === g.gameId);
    return {
      title: game?.title ?? "Unknown",
      coverUrl: game?.coverUrl ?? null,
      playtime: formatDur(g._sum.durationMins ?? 0),
    };
  });

  const cellSize = 180;
  const width = cols * cellSize;
  const height = rows * cellSize + 48; // extra for header

  const displayName = account.user.name ?? account.user.username;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#0a0a0a",
          fontFamily: "sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            height: "48px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#fff", fontSize: "16px", fontWeight: 700 }}>
              {displayName}
            </span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>
              {PERIOD_LABEL[period] ?? "All Time"}
            </span>
          </div>
          <span style={{ color: "#7c3aed", fontSize: "14px", fontWeight: 600 }}>
            game.fm
          </span>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            width: "100%",
            flex: 1,
          }}
        >
          {items.slice(0, cols * rows).map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                position: "relative",
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                overflow: "hidden",
              }}
            >
              {item.coverUrl ? (
                <img
                  src={item.coverUrl}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#1a1a2e",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "12px" }}>
                    No cover
                  </span>
                </div>
              )}
              {/* Overlay with title + playtime */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "6px 8px",
                  background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
                }}
              >
                <span
                  style={{
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 600,
                    lineHeight: "1.2",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.title}
                </span>
                <span style={{ color: "#a78bfa", fontSize: "10px", marginTop: "2px" }}>
                  {item.playtime}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { width, height }
  );
}
