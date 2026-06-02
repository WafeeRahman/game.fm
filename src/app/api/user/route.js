import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// PATCH /api/user — update display name and bio
export async function PATCH(request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, bio } = await request.json();

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
