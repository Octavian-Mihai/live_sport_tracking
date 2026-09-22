import type { NormalizedGame } from "@/types";
import { cn, formatGameStatus, formatGameTime } from "@/lib/utils";

export function GameCard({ game }: { game: NormalizedGame }) {
  const isLive = game.status === "LIVE";

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border p-3 text-sm",
        isLive
          ? "border-red-500/40 bg-red-500/5"
          : "border-black/10 dark:border-white/10",
      )}
    >
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium">{game.homeTeamName}</span>
          <span className="tabular-nums">{game.homeScore ?? "-"}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium">{game.awayTeamName}</span>
          <span className="tabular-nums">{game.awayScore ?? "-"}</span>
        </div>
      </div>

      <div className="ml-4 flex flex-col items-end gap-1 text-xs text-black/60 dark:text-white/60">
        <span
          className={cn(
            "rounded px-1.5 py-0.5 font-semibold",
            isLive && "animate-pulse bg-red-500 text-white",
          )}
        >
          {formatGameStatus(game.status, game.minute)}
        </span>
        <span>{formatGameTime(game.startTime)}</span>
      </div>
    </div>
  );
}
