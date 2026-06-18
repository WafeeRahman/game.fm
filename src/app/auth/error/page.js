import Link from "next/link";

export const metadata = { title: "Sign in error" };

const ERROR_MESSAGES = {
  Configuration: "There's a problem with the server configuration. Please try again later.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification link has expired or has already been used.",
  Default: "Something went wrong during sign in. Please try again.",
};

export default async function AuthErrorPage({ searchParams }) {
  const { error } = await searchParams;
  const message = ERROR_MESSAGES[error] || ERROR_MESSAGES.Default;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-8">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>

          <h1 className="text-lg font-semibold text-white mb-2">
            Unable to sign in
          </h1>
          <p className="text-sm text-white/50 mb-6">{message}</p>

          <Link
            href="/signin"
            className="inline-flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 px-6 transition-colors duration-200 text-sm"
          >
            Try again
          </Link>
        </div>
      </div>
    </div>
  );
}
