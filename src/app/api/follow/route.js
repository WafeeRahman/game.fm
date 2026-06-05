import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// POST /api/follow — follow a user
export async function POST(request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username } = await request.json();
  if (!username) {
    return Response.json({ error: "username is required" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { username } });
  if (!target) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }
  if (target.id === session.user.id) {
    return Response.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: target.id,
      },
    },
    create: {
      followerId: session.user.id,
      followingId: target.id,
    },
    update: {},
  });

  // Record in activity feed
  await prisma.activity.create({
    data: {
      userId: session.user.id,
      type: "FOLLOW",
      referenceId: target.id,
    },
  });

  // Notify the target user
  await prisma.notification.create({
    data: {
      userId: target.id,
      type: "FOLLOW",
      actorId: session.user.id,
      referenceId: session.user.id,
    },
  });

  return Response.json({ following: true });
}

// DELETE /api/follow — unfollow a user
export async function DELETE(request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username } = await request.json();
  const target = await prisma.user.findUnique({ where: { username } });
  if (!target) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.follow.deleteMany({
    where: {
      followerId: session.user.id,
      followingId: target.id,
    },
  });

  return Response.json({ following: false });
}
