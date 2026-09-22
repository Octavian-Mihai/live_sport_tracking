import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Never miss a game.</h1>
      <p className="max-w-md text-black/60 dark:text-white/60">
        Track live scores, schedules, standings, and player stats for the teams you care about,
        all in one dashboard.
      </p>

      <div className="flex gap-3">
        {session?.user ? (
          <Link
            href="/dashboard"
            className="rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
          >
            Go to dashboard
          </Link>
        ) : (
          <Link
            href="/signup"
            className="rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
          >
            Get started
          </Link>
        )}
        <Link
          href="/teams"
          className="rounded-md border border-black/10 px-5 py-2.5 text-sm font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
        >
          Browse teams
        </Link>
      </div>
    </div>
  );
}
