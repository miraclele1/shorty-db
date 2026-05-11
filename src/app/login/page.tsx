import type { Metadata } from "next";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to discover and review short films on YouTube.",
};

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;

  // Only allow relative URLs to prevent open-redirect attacks
  const redirectTo =
    callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/";

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / title */}
        <div className="text-center">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight hover:opacity-80"
          >
            ShortyDB
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Letterboxd for short films on YouTube
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <h1 className="mb-1 text-center text-xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Sign in to rate, review and track short films
          </p>

          <GoogleSignInButton callbackUrl={redirectTo} />

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By signing in you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
