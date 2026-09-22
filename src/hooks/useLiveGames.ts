"use client";

import useSWR from "swr";
import type { NormalizedGame } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to load games");
    return res.json() as Promise<{ games: NormalizedGame[] }>;
  });

/**
 * Polls /api/games/live for the signed-in user's saved teams.
 * Refresh interval is short enough to feel "live" without hammering the
 * upstream sports API - the route handler itself is also cached (see
 * src/lib/sports-api.ts) so concurrent users share one upstream fetch.
 */
export function useLiveGames(refreshIntervalMs = 25_000) {
  const { data, error, isLoading, mutate } = useSWR<{ games: NormalizedGame[] }>(
    "/api/games/live",
    fetcher,
    {
      refreshInterval: refreshIntervalMs,
      revalidateOnFocus: true,
      dedupingInterval: 5_000,
    },
  );

  return {
    games: data?.games ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}
