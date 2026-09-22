import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userTeams = await prisma.userTeam.findMany({
    where: { userId: session.user.id },
    include: { team: { include: { league: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ teams: userTeams.map((ut) => ut.team) });
}

const saveTeamSchema = z.object({
  externalId: z.string(),
  name: z.string(),
  shortName: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  leagueExternalId: z.string(),
  leagueName: z.string(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = saveTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { leagueExternalId, leagueName, ...teamData } = parsed.data;

  const league = await prisma.league.upsert({
    where: { externalId: leagueExternalId },
    update: { name: leagueName },
    create: { externalId: leagueExternalId, name: leagueName, sport: "unknown" },
  });

  const team = await prisma.team.upsert({
    where: { externalId: teamData.externalId },
    update: {
      name: teamData.name,
      shortName: teamData.shortName ?? null,
      logoUrl: teamData.logoUrl ?? null,
      country: teamData.country ?? null,
      leagueId: league.id,
    },
    create: {
      externalId: teamData.externalId,
      name: teamData.name,
      shortName: teamData.shortName ?? null,
      logoUrl: teamData.logoUrl ?? null,
      country: teamData.country ?? null,
      leagueId: league.id,
    },
  });

  await prisma.userTeam.upsert({
    where: { userId_teamId: { userId: session.user.id, teamId: team.id } },
    update: {},
    create: { userId: session.user.id, teamId: team.id },
  });

  return NextResponse.json({ team }, { status: 201 });
}
