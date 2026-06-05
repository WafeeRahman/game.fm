import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// POST /api/likes — toggle a like on a review or list
export async function POST(request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { logId, listId } = await request.json();
  if (!logId && !listId) {
    return Response.json({ error: "logId or listId is required" }, { status: 400 });
  }

  const where = logId
    ? { userId: session.user.id, logId }
    : { userId: session.user.id, listId };

  const existing = await prisma.like.findFirst({ where });

  if (existing) {
    // Unlike
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    // Like
    await prisma.like.create({
      data: {
        userId: session.user.id,
        logId: logId ?? null,
        listId: listId ?? null,
      },
    });

    // Create notification for the content owner
    const target = logId
      ? await prisma.gameLog.findUnique({ where: { id: logId }, select: { userId: true } })
      : await prisma.list.findUnique({ where: { id: listId }, select: { userId: true } });

    if (target && target.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: target.userId,
          type: logId ? "LIKE_REVIEW" : "LIKE_LIST",
          actorId: session.user.id,
          referenceId: logId ?? listId,
        },
      });
    }
  }

  // Return updated count
  const count = await prisma.like.count({
    where: logId ? { logId } : { listId },
  });

  return Response.json({ liked: !existing, count });
}
