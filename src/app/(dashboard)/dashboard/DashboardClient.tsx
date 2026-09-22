"use client";

import Image from "next/image";
import Link from "next/link";
import { useLiveGames } from "@/hooks/useLiveGames";
import { GameCard } from "@/components/GameCard";
import { LiveScoreBanner } from "@/components/LiveScoreBanner";

interface SavedTeam {
  id: string;
  externalId: string;
  name: string;
  logoUrl: string | null;
  leagueName: string;
}

export function DashboardClient({ teams }: { teams: SavedTeam[] }) {
  const { games, isLoading, error } = useLiveGames();

  const liveGames = games.filter((g) => g.status === "LIVE");
  const upcomingGames = games
    .filter((g) => g.status === "SCHEDULED")
    .slice(0, 8);
  const recentGames = games.filter((g) => g.status === "FINISHED").slice(-4).reverse();

  return (
    <div className="flex flex-col gap-8">
      <LiveScoreBanner games={games} />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
          Your teams
        </h2>
        <div className="flex flex-wrap gap-3">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.externalId}`}
              className="flex items-center gap-2 rounded-full border border-black/10 py-1.5 pl-1.5 pr-3 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            >
              {team.logoUrl ? (
                <Image
                  src={team.logoUrl}
                  alt={team.name}
                  width={24}
                  height={24}
                  className="rounded-full object-contain"
                  unoptimized
                />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-[10px] dark:bg-white/10">
                  {team.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              {team.name}
            </Link>
          ))}
        </div>
      </section>

      {error && (
        <p className="text-sm text-red-500">Couldn&apos;t load live scores right now.</p>
      )}

      {liveGames.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
            Live now
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {liveGames.map((game) => (
              <GameCard key={game.externalId} game={game} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
          Upcoming games
        </h2>
        {isLoading ? (
          <p className="text-sm text-black/60 dark:text-white/60">Loading...</p>
        ) : upcomingGames.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">No upcoming games scheduled.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcomingGames.map((game) => (
              <GameCard key={game.externalId} game={game} />
            ))}
          </div>
        )}
      </section>

      {recentGames.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
            Recent results
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {recentGames.map((game) => (
              <GameCard key={game.externalId} game={game} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
