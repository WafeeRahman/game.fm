import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// PATCH /api/user — update display name and bio
export async function PATCH(request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, bio } = await request.json();

  if (name !== undefined && typeof name === "string" && name.trim().length > 50) {
    return Response.json({ error: "Name must be 50 characters or fewer" }, { status: 400 });
  }
  if (bio !== undefined && typeof bio === "string" && bio.trim().length > 200) {
    return Response.json({ error: "Bio must be 200 characters or fewer" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name: name.trim() || null }),
      ...(bio !== undefined && { bio: bio.trim() || null }),
    },
    select: { id: true, name: true, bio: true },
  });

  return Response.json(user);
}
