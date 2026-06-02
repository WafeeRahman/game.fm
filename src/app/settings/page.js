import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import SteamImport from "@/components/SteamImport";
import ProfileEditForm from "@/components/ProfileEditForm";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, bio: true, username: true, steamId: true },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

      <div className="flex flex-col gap-4">
        {/* Profile */}
        <section className="border border-white/10 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-1">Profile</h2>
          <p className="text-sm text-white/40 mb-5">
            Your public display name and bio shown on your profile page.
          </p>
          <ProfileEditForm initialName={user?.name} initialBio={user?.bio} />
        </section>

        {/* Steam */}
        <section className="border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-white">Steam Library</h2>
            {user?.steamId && (
              <span className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
                Connected
              </span>
            )}
          </div>
          <p className="text-sm text-white/40 mb-5">
            Import your Steam library. Games you&apos;ve played will be marked as{" "}
            <span className="text-violet-400">Playing</span>, unplayed ones as{" "}
            <span className="text-white/60">Backlog</span>. Existing logs won&apos;t be overwritten.
          </p>
          <SteamImport />
        </section>

        {/* Account */}
        <section className="border border-white/10 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-1">Account</h2>
          <p className="text-sm text-white/40 mb-4">
            Signed in as{" "}
            <span className="text-white/70">@{user?.username}</span> via Discord.
          </p>
          <a
            href="/api/auth/signout"
            className="text-sm text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 px-4 py-2 rounded-lg transition-colors inline-block"
          >
            Sign out
          </a>
        </section>
      </div>
    </div>
  );
}
