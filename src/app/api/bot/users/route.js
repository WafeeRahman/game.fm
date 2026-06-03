import { prisma } from "@/lib/db";

function isAuthorized(request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.BOT_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

// GET /api/bot/users
// Returns all Discord IDs of registered game.fm users
// Used by the bot on startup to scan only relevant members
export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await prisma.account.findMany({
    where: { provider: "discord" },
    select: { providerAccountId: true },
  });

  return Response.json(accounts.map((a) => a.providerAccountId));
}
