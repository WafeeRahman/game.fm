import Discord from "next-auth/providers/discord";

// Lightweight config — no database imports, safe for the Edge runtime.
// Used by middleware.js to read sessions without pulling in Node.js packages.
export const authConfig = {
  providers: [Discord],
  callbacks: {
    // All routes are public by default. We'll add per-route protection
    // later when we build the protected pages.
    authorized() {
      return true;
    },
  },
};
