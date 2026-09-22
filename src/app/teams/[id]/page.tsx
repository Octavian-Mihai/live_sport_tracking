import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchStandings, fetchTeamById, fetchTeamRoster, fetchTeamSchedule } from "@/lib/sports-api";
import { SaveTeamButton } from "@/components/SaveTeamButton";
import { GameCard } from "@/components/GameCard";
import { StandingsTable } from "@/components/StandingsTable";

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const team = await fetchTeamById(id);
  if (!team) notFound();

  const currentYear = new Date().getFullYear();
  const season = `${currentYear}-${currentYear + 1}`;

  const [roster, schedule, standings, savedTeam] = await Promise.all([
    fetchTeamRoster(id),
    fetchTeamSchedule(id),
    fetchStandings(team.leagueExternalId, season).catch(() => []),
    session?.user?.id
      ? prisma.userTeam.findFirst({
          where: { userId: session.user.id, team: { externalId: id } },
          include: { team: true },
        })
      : Promise.resolve(null),
  ]);

  const upcoming = schedule.filter((g) => g.status !== "FINISHED").slice(0, 6);
  const recent = schedule.filter((g) => g.status === "FINISHED").slice(-6).reverse();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        {team.logoUrl ? (
          <Image
            src={team.logoUrl}
            alt={team.name}
            width={64}
            height={64}
            className="rounded object-contain"
            unoptimized
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded bg-black/5 text-sm dark:bg-white/10">
            {team.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{team.name}</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            {team.leagueName}
            {team.country ? ` · ${team.country}` : ""}
          </p>
        </div>
        <SaveTeamButton
          team={team}
          isSaved={!!savedTeam}
          dbTeamId={savedTeam?.teamId}
          isAuthenticated={!!session?.user}
        />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
          Upcoming games
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">No upcoming games scheduled.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((game) => (
              <GameCard key={game.externalId} game={game} />
            ))}
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
            Recent results
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {recent.map((game) => (
              <GameCard key={game.externalId} game={game} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
          Standings
        </h2>
        <StandingsTable rows={standings} highlightTeamId={team.externalId} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
          Roster
        </h2>
        {roster.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">Roster unavailable.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {roster.map((player) => (
              <div
                key={player.externalId}
                className="flex items-center gap-3 rounded-lg border border-black/10 p-2 dark:border-white/10"
              >
                {player.photoUrl ? (
                  <Image
                    src={player.photoUrl}
                    alt={player.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-xs dark:bg-white/10">
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{player.name}</p>
                  <p className="truncate text-xs text-black/60 dark:text-white/60">
                    {player.position ?? "—"}
                    {player.number ? ` · #${player.number}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
