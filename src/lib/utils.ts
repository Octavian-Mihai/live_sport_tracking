export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatGameTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatGameStatus(status: string, minute?: number | null): string {
  if (status === "LIVE") return minute ? `${minute}'` : "LIVE";
  if (status === "FINISHED") return "Final";
  if (status === "POSTPONED") return "Postponed";
  if (status === "CANCELLED") return "Cancelled";
  return "Scheduled";
}
