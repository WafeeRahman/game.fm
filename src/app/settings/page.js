import { redirect } from "next/navigation";
import { auth } from "@/auth";
import SteamImport from "@/components/SteamImport";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

      {/* Steam import */}
      <section className="border border-white/10 rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-1">
          Import Steam Library
        </h2>
        <p className="text-sm text-white/50 mb-5">
          Enter your Steam ID, profile URL, or vanity name to import your
          library. Games you&apos;ve played will be marked as{" "}
          <span className="text-violet-400">Playing</span>, unplayed games as{" "}
          <span className="text-white/70">Backlog</span>. Existing logs won&apos;t
          be overwritten.
        </p>
        <SteamImport />
      </section>
    </div>
  );
}
