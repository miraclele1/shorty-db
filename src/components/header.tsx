"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-bold tracking-tight hover:opacity-80"
        >
          ShortyDB
        </Link>

        {/* Nav links — extend here later */}
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link
            href="/films"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Films
          </Link>
        </nav>

        {/* Auth section */}
        <div className="flex items-center gap-3">
          {isPending ? (
            /* Skeleton while session loads */
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : session?.user ? (
            /* Authenticated */
            <div className="flex items-center gap-3">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={`${session.user.name ?? "User"}'s avatar`}
                  width={32}
                  height={32}
                  className="rounded-full ring-1 ring-border"
                  unoptimized // Google profile images are already optimized
                />
              ) : (
                /* Fallback initials avatar */
                <div
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                >
                  {session.user.name?.[0]?.toUpperCase() ?? "U"}
                </div>
              )}

              <span className="hidden max-w-[120px] truncate text-sm font-medium sm:block">
                {session.user.name}
              </span>

              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          ) : (
            /* Guest */
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
