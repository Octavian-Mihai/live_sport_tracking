import Image from "next/image";
import Link from "next/link";
import type { NormalizedTeam } from "@/types";

export function TeamCard({ team, action }: { team: NormalizedTeam; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-black/10 p-3 dark:border-white/10">
      {team.logoUrl ? (
        <Image
          src={team.logoUrl}
          alt={team.name}
          width={40}
          height={40}
          className="rounded object-contain"
          unoptimized
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded bg-black/5 text-xs dark:bg-white/10">
          {team.name.slice(0, 2).toUpperCase()}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <Link href={`/teams/${team.externalId}`} className="truncate font-medium hover:underline">
          {team.name}
        </Link>
        <p className="truncate text-xs text-black/60 dark:text-white/60">{team.leagueName}</p>
      </div>

      {action}
    </div>
  );
}
