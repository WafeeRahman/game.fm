import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// DELETE /api/lists/[id] — delete a list
export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const list = await prisma.list.findUnique({ where: { id } });
  if (!list) return Response.json({ error: "Not found" }, { status: 404 });
  if (list.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.list.delete({ where: { id } });
  return Response.json({ deleted: true });
}

// PATCH /api/lists/[id] — rename or update a list
export async function PATCH(request, { params }) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { name, description, isPublic } = await request.json();

  const list = await prisma.list.findUnique({ where: { id } });
  if (!list) return Response.json({ error: "Not found" }, { status: 404 });
  if (list.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.list.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description }),
      ...(isPublic !== undefined && { isPublic }),
    },
  });

  return Response.json(updated);
}
