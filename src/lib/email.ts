import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendGameDayEmail(params: {
  to: string;
  teamName: string;
  opponentName: string;
  startTime: string;
}) {
  if (!resend) return; // no-op when RESEND_API_KEY isn't configured (e.g. local dev)

  const { to, teamName, opponentName, startTime } = params;
  const kickoff = new Date(startTime).toLocaleString(undefined, {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
  });

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Live Sports Tracker <updates@example.com>",
    to,
    subject: `Game day: ${teamName} vs ${opponentName}`,
    text: `${teamName} plays ${opponentName} today at ${kickoff}. Good luck!`,
  });
}
