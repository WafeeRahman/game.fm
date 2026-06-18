import Discord from "next-auth/providers/discord";

export const authConfig = {
  providers: [Discord],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
    error: "/auth/error",
  },
  callbacks: {
    authorized() {
      return true;
    },
  },
};
