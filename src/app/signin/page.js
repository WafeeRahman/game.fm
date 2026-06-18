import { signIn } from "@/auth";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const metadata = { title: "Sign in" };

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            game<span className="text-violet-400">.fm</span>
            <span className="ml-2 text-xs font-medium text-violet-400 bg-violet-400/10 border border-violet-400/20 px-2 py-0.5 rounded-full uppercase tracking-wider align-middle">beta</span>
          </h1>
          <p className="text-white/40 text-sm mt-2">
            Track the games you play. Review them. Share them.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="text-lg font-semibold text-white text-center mb-2">
            Welcome back
          </h2>
          <p className="text-sm text-white/40 text-center mb-6">
            Sign in to your account to continue
          </p>

          <form
            action={async () => {
              "use server";
              await signIn("discord", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium py-3 px-4 transition-colors duration-200 cursor-pointer"
            >
              <svg width="20" height="15" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A37.4 37.4 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32.2.3 45.5v.1a58.8 58.8 0 0017.7 9a.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.6.2.2 0 01 0-.4c.4-.3.7-.6 1.1-.9a.2.2 0 01.2 0c11.6 5.3 24.1 5.3 35.5 0a.2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1A58.6 58.6 0 0070.4 45.6v-.1c1.4-15-2.3-28.4-9.8-40.1a.2.2 0 00-.1-.1h-.4zM23.7 37.3c-3.5 0-6.3-3.2-6.3-7.1s2.8-7.1 6.3-7.1c3.6 0 6.4 3.2 6.3 7.1 0 3.9-2.8 7.1-6.3 7.1zm23.2 0c-3.5 0-6.3-3.2-6.3-7.1s2.8-7.1 6.3-7.1c3.6 0 6.4 3.2 6.3 7.1 0 3.9-2.7 7.1-6.3 7.1z" fill="currentColor"/>
              </svg>
              Continue with Discord
            </button>
          </form>

          <p className="text-xs text-white/20 text-center mt-6">
            By signing in, you agree to be excellent to each other.
          </p>
        </div>

        <p className="text-xs text-white/20 text-center mt-6">
          Don&apos;t have a Discord account?{" "}
          <a
            href="https://discord.com/register"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300 transition-colors"
          >
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
