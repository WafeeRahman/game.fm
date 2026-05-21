import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Use the lightweight config (no DB/pg imports) so middleware
// can run on the Edge runtime without Node.js-only packages.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
