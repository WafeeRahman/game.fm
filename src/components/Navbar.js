import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";

export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <nav className="border-b border-white/10 bg-black/40 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold tracking-tight text-white hover:text-white/80 transition-colors">
          game<span className="text-violet-400">.fm</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-6 text-sm text-white/60">
          <Link href="/games" className="hover:text-white transition-colors">
            Search
          </Link>
          {user && (
            <Link href={`/users/${user.username}`} className="hover:text-white transition-colors">
              Profile
            </Link>
          )}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {user.image && (
                <Image
                  src={user.image}
                  alt={user.name ?? "avatar"}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              )}
              <span className="text-sm text-white/70">{user.username ?? user.name}</span>
              <Link
                href="/api/auth/signout"
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                Sign out
              </Link>
            </div>
          ) : (
            <Link
              href="/api/auth/signin"
              className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-md transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
