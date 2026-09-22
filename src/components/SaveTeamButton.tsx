"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { NormalizedTeam } from "@/types";

export function SaveTeamButton({
  team,
  isSaved: initialSaved,
  dbTeamId,
  isAuthenticated,
}: {
  team: NormalizedTeam;
  isSaved: boolean;
  dbTeamId?: string;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [teamId, setTeamId] = useState(dbTeamId);
  const [isPending, startTransition] = useTransition();

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="rounded-md border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
      >
        Log in to save
      </button>
    );
  }

  const toggle = () => {
    startTransition(async () => {
      if (isSaved && teamId) {
        await fetch(`/api/user/teams/${teamId}`, { method: "DELETE" });
        setIsSaved(false);
      } else {
        const res = await fetch("/api/user/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(team),
        });
        if (res.ok) {
          const { team: savedTeam } = await res.json();
          setTeamId(savedTeam.id);
          setIsSaved(true);
        }
      }
      router.refresh();
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={
        isSaved
          ? "rounded-md bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-50"
          : "rounded-md border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/10"
      }
    >
      {isSaved ? "Saved ✓" : "Save team"}
    </button>
  );
}
