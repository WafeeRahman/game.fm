import Discord from "next-auth/providers/discord";

export const authConfig = {
  providers: [Discord],
  session: { strategy: "jwt" },
  callbacks: {
    authorized() {
      return true;
    },
  },
};
