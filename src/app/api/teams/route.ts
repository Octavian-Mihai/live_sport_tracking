import { NextResponse } from "next/server";
import { fetchTeamsByLeague, searchTeams } from "@/lib/sports-api";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();
  const league = searchParams.get("league")?.trim();

  if (!query && !league) {
    return NextResponse.json({ teams: [] });
  }

  try {
    const teams = query ? await searchTeams(query) : await fetchTeamsByLeague(league!);
    return NextResponse.json({ teams });
  } catch {
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 502 });
  }
}
