import { prisma } from "@/lib/db";
import { getGameById, igdbImageUrl } from "@/lib/igdb";

// Save an IGDB game to our database (or return it if it already exists).
// Called whenever a user logs a game so our DB builds up naturally.
export async function upsertGame(igdbId) {
  const existing = await prisma.game.findUnique({ where: { igdbId } });
  if (existing) return existing;

  const igdbGame = await getGameById(igdbId);
  if (!igdbGame) throw new Error(`Game ${igdbId} not found on IGDB`);

  const developer = igdbGame.involved_companies?.find((c) => c.developer)?.company?.name ?? null;
  const publisher = igdbGame.involved_companies?.find((c) => c.publisher)?.company?.name ?? null;

  return prisma.game.upsert({
    where: { igdbId },
    create: {
      igdbId,
      title: igdbGame.name,
      slug: igdbGame.slug,
      coverUrl: igdbImageUrl(igdbGame.cover?.image_id, "cover_big"),
      summary: igdbGame.summary ?? null,
      releaseDate: igdbGame.first_release_date
        ? new Date(igdbGame.first_release_date * 1000)
        : null,
      genres: igdbGame.genres?.map((g) => g.name) ?? [],
      platforms: igdbGame.platforms?.map((p) => p.name) ?? [],
      developer,
      publisher,
      igdbRating: igdbGame.total_rating ?? null,
    },
    update: {
      coverUrl: igdbImageUrl(igdbGame.cover?.image_id, "cover_big"),
      igdbRating: igdbGame.total_rating ?? null,
    },
  });
}
