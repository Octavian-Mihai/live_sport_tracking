import { NextResponse } from "next/server";
import { fetchTeamById, fetchTeamRoster, fetchTeamSchedule } from "@/lib/sports-api";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const [team, roster, schedule] = await Promise.all([
      fetchTeamById(id),
      fetchTeamRoster(id),
      fetchTeamSchedule(id),
    ]);

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({ team, roster, schedule });
  } catch {
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 502 });
  }
}
