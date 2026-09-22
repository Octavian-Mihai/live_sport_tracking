import type {
  NormalizedGame,
  NormalizedLeague,
  NormalizedPlayer,
  NormalizedStandingRow,
  NormalizedTeam,
} from "@/types";

/**
 * Thin client around TheSportsDB's free JSON API.
 *
 * Caching strategy: every request goes through Next.js's `fetch` cache with an
 * explicit `revalidate` window tuned to how often the underlying data actually
 * changes. This keeps us well under the provider's rate limit without users
 * ever seeing stale live scores for long:
 *   - league/team/player metadata barely changes  -> cache for hours
 *   - schedules (upcoming/past fixtures)           -> cache for minutes
 *   - live scoreboards                             -> cache for seconds
 *
 * Swapping to a paid provider (e.g. API-Football) only requires rewriting the
 * fetch calls + `normalize*` functions below; callers consume the normalized
 * types in `src/types/index.ts` and never see provider-specific shapes.
 */

const BASE_URL = process.env.SPORTS_API_BASE_URL ?? "https://www.thesportsdb.com/api/v1/json";
const API_KEY = process.env.SPORTS_API_KEY ?? "3";

const REVALIDATE = {
  metadata: 60 * 60 * 6, // 6h - leagues, teams, players
  schedule: 60 * 5, // 5m - upcoming/past fixtures, standings
  live: 20, // 20s - live scoreboard polling
} as const;

async function sportsFetch<T>(path: string, revalidate: number): Promise<T> {
  const url = `${BASE_URL}/${API_KEY}/${path}`;
  const res = await fetch(url, { next: { revalidate } });

  if (!res.ok) {
    throw new Error(`Sports API request failed (${res.status}): ${path}`);
  }

  return res.json() as Promise<T>;
}

// --- Raw TheSportsDB shapes (subset of fields we use) ---

interface TsdbLeague {
  idLeague: string;
  strLeague: string;
  strSport: string;
  strCountry?: string | null;
  strBadge?: string | null;
}

interface TsdbTeam {
  idTeam: string;
  strTeam: string;
  strTeamShort?: string | null;
  strBadge?: string | null;
  strCountry?: string | null;
  idLeague: string;
  strLeague: string;
}

interface TsdbPlayer {
  idPlayer: string;
  strPlayer: string;
  strPosition?: string | null;
  strNumber?: string | null;
  strNationality?: string | null;
  strThumb?: string | null;
  strCutout?: string | null;
  idTeam: string;
}

interface TsdbEvent {
  idEvent: string;
  strTimestamp?: string | null;
  dateEvent?: string | null;
  strTime?: string | null;
  strStatus?: string | null;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strProgress?: string | null;
  strVenue?: string | null;
  idLeague: string;
  idHomeTeam: string;
  strHomeTeam: string;
  idAwayTeam: string;
  strAwayTeam: string;
}

interface TsdbStanding {
  idTeam: string;
  strTeam: string;
  intRank: string;
  intPlayed: string;
  intWin: string;
  intDraw: string;
  intLoss: string;
  intPoints: string;
}

// --- Normalizers ---

function normalizeLeague(l: TsdbLeague): NormalizedLeague {
  return {
    externalId: l.idLeague,
    name: l.strLeague,
    sport: l.strSport,
    country: l.strCountry ?? null,
    logoUrl: l.strBadge ?? null,
  };
}

function normalizeTeam(t: TsdbTeam): NormalizedTeam {
  return {
    externalId: t.idTeam,
    name: t.strTeam,
    shortName: t.strTeamShort ?? null,
    logoUrl: t.strBadge ?? null,
    country: t.strCountry ?? null,
    leagueExternalId: t.idLeague,
    leagueName: t.strLeague,
  };
}

function normalizePlayer(p: TsdbPlayer): NormalizedPlayer {
  return {
    externalId: p.idPlayer,
    name: p.strPlayer,
    position: p.strPosition ?? null,
    number: p.strNumber ? Number(p.strNumber) : null,
    nationality: p.strNationality ?? null,
    photoUrl: p.strCutout ?? p.strThumb ?? null,
    teamExternalId: p.idTeam,
  };
}

function deriveStatus(e: TsdbEvent): NormalizedGame["status"] {
  const status = (e.strStatus ?? "").toUpperCase();
  if (status.includes("FT") || status.includes("MATCH FINISHED") || status.includes("FINISHED")) {
    return "FINISHED";
  }
  if (status.includes("PPD") || status.includes("POSTPONED")) return "POSTPONED";
  if (status.includes("CANC")) return "CANCELLED";
  if (status.includes("LIVE") || status === "1H" || status === "2H" || /^\d+'?$/.test(status)) {
    return "LIVE";
  }
  return "SCHEDULED";
}

function normalizeEvent(e: TsdbEvent): NormalizedGame {
  const startTime = e.strTimestamp
    ? new Date(e.strTimestamp).toISOString()
    : new Date(`${e.dateEvent ?? ""}T${e.strTime ?? "00:00:00"}Z`).toISOString();

  return {
    externalId: e.idEvent,
    startTime,
    status: deriveStatus(e),
    minute: e.strProgress ? Number.parseInt(e.strProgress, 10) || null : null,
    homeScore: e.intHomeScore != null ? Number(e.intHomeScore) : null,
    awayScore: e.intAwayScore != null ? Number(e.intAwayScore) : null,
    venue: e.strVenue ?? null,
    leagueExternalId: e.idLeague,
    homeTeamExternalId: e.idHomeTeam,
    homeTeamName: e.strHomeTeam,
    awayTeamExternalId: e.idAwayTeam,
    awayTeamName: e.strAwayTeam,
  };
}

function normalizeStanding(s: TsdbStanding): NormalizedStandingRow {
  return {
    teamExternalId: s.idTeam,
    teamName: s.strTeam,
    rank: Number(s.intRank),
    played: Number(s.intPlayed),
    wins: Number(s.intWin),
    draws: Number(s.intDraw),
    losses: Number(s.intLoss),
    points: Number(s.intPoints),
  };
}

// --- Public API ---

export async function fetchAllLeagues(): Promise<NormalizedLeague[]> {
  const data = await sportsFetch<{ leagues: TsdbLeague[] | null }>(
    "all_leagues.php",
    REVALIDATE.metadata,
  );
  return (data.leagues ?? []).map(normalizeLeague);
}

export async function searchTeams(query: string): Promise<NormalizedTeam[]> {
  const data = await sportsFetch<{ teams: TsdbTeam[] | null }>(
    `searchteams.php?t=${encodeURIComponent(query)}`,
    REVALIDATE.metadata,
  );
  return (data.teams ?? []).map(normalizeTeam);
}

export async function fetchTeamsByLeague(leagueName: string): Promise<NormalizedTeam[]> {
  const data = await sportsFetch<{ teams: TsdbTeam[] | null }>(
    `search_all_teams.php?l=${encodeURIComponent(leagueName)}`,
    REVALIDATE.metadata,
  );
  return (data.teams ?? []).map(normalizeTeam);
}

export async function fetchTeamById(teamId: string): Promise<NormalizedTeam | null> {
  const data = await sportsFetch<{ teams: TsdbTeam[] | null }>(
    `lookupteam.php?id=${teamId}`,
    REVALIDATE.metadata,
  );
  const team = data.teams?.[0];
  return team ? normalizeTeam(team) : null;
}

export async function fetchTeamRoster(teamId: string): Promise<NormalizedPlayer[]> {
  const data = await sportsFetch<{ player: TsdbPlayer[] | null }>(
    `lookup_all_players.php?id=${teamId}`,
    REVALIDATE.metadata,
  );
  return (data.player ?? []).map(normalizePlayer);
}

export async function fetchUpcomingGamesForTeam(teamId: string): Promise<NormalizedGame[]> {
  const data = await sportsFetch<{ events: TsdbEvent[] | null }>(
    `eventsnext.php?id=${teamId}`,
    REVALIDATE.schedule,
  );
  return (data.events ?? []).map(normalizeEvent);
}

export async function fetchRecentGamesForTeam(teamId: string): Promise<NormalizedGame[]> {
  const data = await sportsFetch<{ results: TsdbEvent[] | null }>(
    `eventslast.php?id=${teamId}`,
    REVALIDATE.schedule,
  );
  return (data.results ?? []).map(normalizeEvent);
}

/** Combined schedule (recent + upcoming) for a team, sorted chronologically. */
export async function fetchTeamSchedule(teamId: string): Promise<NormalizedGame[]> {
  const [recent, upcoming] = await Promise.all([
    fetchRecentGamesForTeam(teamId),
    fetchUpcomingGamesForTeam(teamId),
  ]);
  return [...recent, ...upcoming].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
}

export async function fetchStandings(
  leagueId: string,
  season: string,
): Promise<NormalizedStandingRow[]> {
  const data = await sportsFetch<{ table: TsdbStanding[] | null }>(
    `lookuptable.php?l=${leagueId}&s=${season}`,
    REVALIDATE.schedule,
  );
  return (data.table ?? []).map(normalizeStanding);
}

/** Live + upcoming games for a set of teams, used to power the dashboard. */
export async function fetchGamesForTeams(teamIds: string[]): Promise<NormalizedGame[]> {
  const results = await Promise.all(
    teamIds.map(async (id) => {
      const [upcoming, recent] = await Promise.all([
        fetchUpcomingGamesForTeam(id),
        fetchRecentGamesForTeam(id),
      ]);
      return [...upcoming, ...recent];
    }),
  );

  const byId = new Map<string, NormalizedGame>();
  for (const game of results.flat()) {
    byId.set(game.externalId, game);
  }
  return [...byId.values()].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
}
