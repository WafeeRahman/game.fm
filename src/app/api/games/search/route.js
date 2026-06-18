import { searchGames } from "@/lib/igdb";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  if (!q.trim()) return Response.json([]);

  try {
    const games = await searchGames(q, 20, offset);
    return Response.json(games);
  } catch {
    return Response.json([]);
  }
}
