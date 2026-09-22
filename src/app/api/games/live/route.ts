import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchGamesForTeams } from "@/lib/sports-api";

/**
 * Returns live + upcoming games for the current user's saved teams.
 * Polled client-side via SWR (see src/hooks/useLiveGames.ts) to drive
 * real-time score updates without a websocket/server-push layer.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userTeams = await prisma.userTeam.findMany({
    where: { userId: session.user.id },
    include: { team: true },
  });

  if (userTeams.length === 0) {
    return NextResponse.json({ games: [] });
  }

  try {
    const games = await fetchGamesForTeams(userTeams.map((ut) => ut.team.externalId));
    return NextResponse.json({ games });
  } catch {
    return NextResponse.json({ error: "Failed to fetch live games" }, { status: 502 });
  }
}
