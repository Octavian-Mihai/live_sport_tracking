import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchUpcomingGamesForTeam } from "@/lib/sports-api";
import { sendGameDayEmail } from "@/lib/email";

const HOURS_AHEAD = 3;

/**
 * Intended to be hit by a scheduled cron (e.g. Vercel Cron, once per hour)
 * rather than by users directly. For each saved team with a game starting
 * within the next few hours, emails the owning user.
 *
 * NOTE: this is a scaffold - a production version should record which
 * game/user pairs have already been notified (e.g. a NotificationLog table)
 * to avoid re-sending on every cron tick within the notification window.
 */
export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userTeams = await prisma.userTeam.findMany({
    include: { team: true, user: true },
  });

  const now = Date.now();
  const windowEnd = now + HOURS_AHEAD * 60 * 60 * 1000;

  let sent = 0;

  for (const ut of userTeams) {
    if (!ut.user.email) continue;

    const upcoming = await fetchUpcomingGamesForTeam(ut.team.externalId).catch(() => []);
    const gameToday = upcoming.find((g) => {
      const start = new Date(g.startTime).getTime();
      return start >= now && start <= windowEnd;
    });

    if (!gameToday) continue;

    const opponent =
      gameToday.homeTeamExternalId === ut.team.externalId
        ? gameToday.awayTeamName
        : gameToday.homeTeamName;

    await sendGameDayEmail({
      to: ut.user.email,
      teamName: ut.team.name,
      opponentName: opponent,
      startTime: gameToday.startTime,
    });
    sent += 1;
  }

  return NextResponse.json({ ok: true, sent });
}
