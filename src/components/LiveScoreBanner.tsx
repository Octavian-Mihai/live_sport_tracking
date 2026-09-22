"use client";

import { useEffect, useRef, useState } from "react";
import type { NormalizedGame } from "@/types";

interface Notification {
  id: string;
  message: string;
}

/**
 * Watches the live games feed and surfaces an in-app banner whenever a
 * tracked game goes live or a score changes - a lightweight substitute for
 * push/email notifications that needs no extra infrastructure.
 */
export function LiveScoreBanner({ games }: { games: NormalizedGame[] }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const prevGames = useRef<Map<string, NormalizedGame>>(new Map());
  const isFirstRun = useRef(true);

  useEffect(() => {
    const prev = prevGames.current;
    const next: Notification[] = [];

    for (const game of games) {
      const before = prev.get(game.externalId);

      if (!isFirstRun.current) {
        if (before && before.status !== "LIVE" && game.status === "LIVE") {
          next.push({
            id: `${game.externalId}-live-${Date.now()}`,
            message: `🔴 ${game.homeTeamName} vs ${game.awayTeamName} just kicked off!`,
          });
        } else if (
          before &&
          game.status === "LIVE" &&
          (before.homeScore !== game.homeScore || before.awayScore !== game.awayScore)
        ) {
          next.push({
            id: `${game.externalId}-score-${Date.now()}`,
            message: `⚽ Goal update: ${game.homeTeamName} ${game.homeScore ?? 0} - ${game.awayScore ?? 0} ${game.awayTeamName}`,
          });
        } else if (before && before.status !== "FINISHED" && game.status === "FINISHED") {
          next.push({
            id: `${game.externalId}-final-${Date.now()}`,
            message: `✅ Final: ${game.homeTeamName} ${game.homeScore ?? 0} - ${game.awayScore ?? 0} ${game.awayTeamName}`,
          });
        }
      }

      prev.set(game.externalId, game);
    }

    isFirstRun.current = false;

    if (next.length > 0) {
      // Synchronously syncing local toast state to changes detected in the
      // polled `games` prop (an external data source), not derived render state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotifications((current) => [...next, ...current].slice(0, 4));
    }
  }, [games]);

  useEffect(() => {
    if (notifications.length === 0) return;
    const timer = setTimeout(() => setNotifications((n) => n.slice(0, -1)), 8_000);
    return () => clearTimeout(timer);
  }, [notifications]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="rounded-lg border border-black/10 bg-background p-3 text-sm shadow-lg dark:border-white/10"
        >
          {n.message}
        </div>
      ))}
    </div>
  );
}
