import { getPopularGames, getRecentGames } from "@/lib/igdb";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "popular";
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  try {
    const games = type === "recent"
      ? await getRecentGames(10, offset)
      : await getPopularGames(10, offset);
    return Response.json(games);
  } catch {
    return Response.json([]);
  }
}
