export type GameStatus = "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED";

export interface NormalizedLeague {
  externalId: string;
  name: string;
  sport: string;
  country?: string | null;
  logoUrl?: string | null;
}

export interface NormalizedTeam {
  externalId: string;
  name: string;
  shortName?: string | null;
  logoUrl?: string | null;
  country?: string | null;
  leagueExternalId: string;
  leagueName: string;
}

export interface NormalizedPlayer {
  externalId: string;
  name: string;
  position?: string | null;
  number?: number | null;
  nationality?: string | null;
  photoUrl?: string | null;
  teamExternalId: string;
}

export interface NormalizedGame {
  externalId: string;
  startTime: string; // ISO
  status: GameStatus;
  minute?: number | null;
  homeScore?: number | null;
  awayScore?: number | null;
  venue?: string | null;
  leagueExternalId: string;
  homeTeamExternalId: string;
  homeTeamName: string;
  awayTeamExternalId: string;
  awayTeamName: string;
}

export interface NormalizedStandingRow {
  teamExternalId: string;
  teamName: string;
  rank: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
}
