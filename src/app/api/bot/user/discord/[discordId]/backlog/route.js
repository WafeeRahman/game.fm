import { prisma } from "@/lib/db";

function isAuthorized(request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.BOT_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

// GET /api/bot/user/discord/[discordId]/backlog
export async function GET(request, { params }) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { discordId } = await params;

  const account = await prisma.account.findFirst({
    where: { provider: "discord", providerAccountId: discordId },
    select: { userId: true },
  });

  if (!account) return Response.json(null, { status: 404 });

  const logs = await prisma.gameLog.findMany({
    where: { userId: account.userId, status: "BACKLOG", isPublic: true },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      game: { select: { title: true, slug: true } },
      updatedAt: true,
    },
  });

  return Response.json(logs);
}
