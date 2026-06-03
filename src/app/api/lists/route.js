import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/lists — return the logged-in user's lists
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lists = await prisma.list.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
    },
  });

  return Response.json(lists);
}

// POST /api/lists — create a new list
export async function POST(request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description, isPublic } = await request.json();
  if (!name?.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }
  if (name.trim().length > 100) {
    return Response.json({ error: "Name must be 100 characters or fewer" }, { status: 400 });
  }
  if (description && description.length > 500) {
    return Response.json({ error: "Description must be 500 characters or fewer" }, { status: 400 });
  }

  const list = await prisma.list.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      description: description ?? null,
      isPublic: isPublic ?? true,
    },
  });

  return Response.json(list, { status: 201 });
}
