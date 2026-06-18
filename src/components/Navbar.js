import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import NotificationBell from "@/components/NotificationBell";
import DynamicSearchBar from "@/components/DynamicSearchBar";

export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <nav className="border-b border-white/[0.07] bg-neutral-950/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link
          href="/games"
          className="text-base font-bold tracking-tight text-white hover:text-white/80 transition-colors flex-shrink-0 mr-2"
        >
          game<span className="text-violet-400">.fm</span>
            <span className="ml-1.5 text-[10px] font-medium text-violet-400 bg-violet-400/10 border border-violet-400/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">beta</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link
            href="/games"
            className="text-sm text-white/50 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-md transition-colors"
          >
            Games
          </Link>
          {user && (
            <Link
              href={`/users/${user.username}`}
              className="text-sm text-white/50 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-md transition-colors"
            >
              Profile
            </Link>
          )}
        </div>

        {/* Search bar — fills middle space */}
        <DynamicSearchBar compact />

        {/* Auth */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {user ? (
            <>
              <NotificationBell />
              {user.image && (
                <Link href={`/users/${user.username}`}>
                  <Image
                    src={user.image}
                    alt={user.name ?? "avatar"}
                    width={30}
                    height={30}
                    className="rounded-full hover:ring-2 hover:ring-violet-500/50 transition-all"
                  />
                </Link>
              )}
              <Link
                href="/settings"
                className="text-sm text-white/40 hover:text-white transition-colors hidden sm:block"
              >
                Settings
              </Link>
              <Link
                href="/api/auth/signout"
                className="text-sm text-white/30 hover:text-white/60 transition-colors"
              >
                Sign out
              </Link>
            </>
          ) : (
            <Link
              href="/api/auth/signin"
              className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
