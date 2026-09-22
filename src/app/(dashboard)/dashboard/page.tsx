import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userTeams = await prisma.userTeam.findMany({
    where: { userId: session.user.id },
    include: { team: { include: { league: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (userTeams.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <h1 className="text-2xl font-semibold">Your dashboard is empty</h1>
        <p className="text-black/60 dark:text-white/60">
          Save a few teams to see live scores, upcoming games, and standings here.
        </p>
        <Link
          href="/teams"
          className="rounded-md bg-foreground px-4 py-2 text-sm text-background hover:opacity-90"
        >
          Browse teams
        </Link>
      </div>
    );
  }

  const teams = userTeams.map((ut) => ({
    id: ut.team.id,
    externalId: ut.team.externalId,
    name: ut.team.name,
    logoUrl: ut.team.logoUrl,
    leagueName: ut.team.league.name,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <DashboardClient teams={teams} />
    </div>
  );
}
