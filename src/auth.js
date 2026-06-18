import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),

  callbacks: {
    ...authConfig.callbacks,

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.discordId = user.discordId;
      }
      return token;
    },

    session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.discordId = token.discordId;
      return session;
    },
  },

  events: {
    // When someone signs in via Discord for the first time, generate a
    // temporary username from their Discord display name. They can change
    // it later on their profile settings page.
    async createUser({ user }) {
      const base = (user.name ?? "user")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20);

      const username = `${base || "user"}${Math.floor(Math.random() * 9000) + 1000}`;

      await prisma.user.update({
        where: { id: user.id },
        data: { username },
      });
    },
  },
});
