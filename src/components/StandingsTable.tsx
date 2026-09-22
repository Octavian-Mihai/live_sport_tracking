import type { NormalizedStandingRow } from "@/types";
import { cn } from "@/lib/utils";

export function StandingsTable({
  rows,
  highlightTeamId,
}: {
  rows: NormalizedStandingRow[];
  highlightTeamId?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-black/60 dark:text-white/60">Standings unavailable.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className="text-xs uppercase text-black/50 dark:text-white/50">
          <tr>
            <th className="py-1.5 pr-2">#</th>
            <th className="py-1.5 pr-2">Team</th>
            <th className="py-1.5 pr-2 text-center">P</th>
            <th className="py-1.5 pr-2 text-center">W</th>
            <th className="py-1.5 pr-2 text-center">D</th>
            <th className="py-1.5 pr-2 text-center">L</th>
            <th className="py-1.5 pr-2 text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.teamExternalId}
              className={cn(
                "border-t border-black/5 dark:border-white/10",
                row.teamExternalId === highlightTeamId && "bg-black/5 font-medium dark:bg-white/10",
              )}
            >
              <td className="py-1.5 pr-2">{row.rank}</td>
              <td className="py-1.5 pr-2">{row.teamName}</td>
              <td className="py-1.5 pr-2 text-center tabular-nums">{row.played}</td>
              <td className="py-1.5 pr-2 text-center tabular-nums">{row.wins}</td>
              <td className="py-1.5 pr-2 text-center tabular-nums">{row.draws}</td>
              <td className="py-1.5 pr-2 text-center tabular-nums">{row.losses}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
