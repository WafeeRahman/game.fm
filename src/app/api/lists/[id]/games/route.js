import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { upsertGame } from "@/lib/games";

// POST /api/lists/[id]/games — add a game to a list
export async function POST(request, { params }) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { igdbId } = await request.json();

  const list = await prisma.list.findUnique({ where: { id } });
  if (!list) return Response.json({ error: "Not found" }, { status: 404 });
  if (list.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Ensure the game exists in our DB
  const game = await upsertGame(igdbId);

  const count = await prisma.listItem.count({ where: { listId: id } });

  const item = await prisma.listItem.upsert({
    where: { listId_gameId: { listId: id, gameId: game.id } },
    create: { listId: id, gameId: game.id, position: count + 1 },
    update: {},
  });

  return Response.json(item, { status: 201 });
}

// DELETE /api/lists/[id]/games — remove a game from a list
export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { igdbId } = await request.json();

  const list = await prisma.list.findUnique({ where: { id } });
  if (!list) return Response.json({ error: "Not found" }, { status: 404 });
  if (list.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const game = await prisma.game.findUnique({ where: { igdbId } });
  if (!game) return Response.json({ error: "Game not found" }, { status: 404 });

  await prisma.listItem.deleteMany({
    where: { listId: id, gameId: game.id },
  });

  return Response.json({ removed: true });
}
