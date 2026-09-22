import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchAllLeagues, fetchTeamsByLeague, searchTeams } from "@/lib/sports-api";
import { SearchBar } from "@/components/SearchBar";
import { TeamCard } from "@/components/TeamCard";
import { SaveTeamButton } from "@/components/SaveTeamButton";
import Link from "next/link";

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; league?: string }>;
}) {
  const { q, league } = await searchParams;
  const session = await auth();

  const [teams, leagues, savedExternalIds] = await Promise.all([
    q ? searchTeams(q) : league ? fetchTeamsByLeague(league) : Promise.resolve([]),
    q || league ? Promise.resolve([]) : fetchAllLeagues(),
    session?.user?.id
      ? prisma.userTeam
          .findMany({ where: { userId: session.user.id }, include: { team: true } })
          .then((rows) => new Map(rows.map((r) => [r.team.externalId, r.team.id])))
      : Promise.resolve(new Map<string, string>()),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Browse teams</h1>
      <SearchBar initialQuery={q} />

      {q || league ? (
        <div className="flex flex-col gap-2">
          {teams.length === 0 ? (
            <p className="text-sm text-black/60 dark:text-white/60">
              No teams found for &ldquo;{q ?? league}&rdquo;.
            </p>
          ) : (
            teams.map((team) => (
              <TeamCard
                key={team.externalId}
                team={team}
                action={
                  <SaveTeamButton
                    team={team}
                    isSaved={savedExternalIds.has(team.externalId)}
                    dbTeamId={savedExternalIds.get(team.externalId)}
                    isAuthenticated={!!session?.user}
                  />
                }
              />
            ))
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
            Leagues
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {leagues.slice(0, 40).map((league) => (
              <Link
                key={league.externalId}
                href={`/teams?league=${encodeURIComponent(league.name)}`}
                className="rounded-lg border border-black/10 p-3 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                <p className="font-medium">{league.name}</p>
                <p className="text-xs text-black/60 dark:text-white/60">
                  {league.sport}
                  {league.country ? ` · ${league.country}` : ""}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
