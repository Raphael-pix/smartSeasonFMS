import { format, formatDistanceToNow, parseISO } from "date-fns";

export function safeParse(date: string | null | undefined): Date | null {
  if (!date) return null;
  try {
    const d = parseISO(date);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function formatDate(
  date: string | null | undefined,
  fmt = "d MMM yyyy",
) {
  const d = safeParse(date);
  return d ? format(d, fmt) : "—";
}

export function formatDateTime(date: string | null | undefined) {
  const d = safeParse(date);
  return d ? format(d, "EEE d MMM yyyy · HH:mm") : "—";
}

export function timeAgo(date: string | null | undefined) {
  const d = safeParse(date);
  return d ? `${formatDistanceToNow(d)} ago` : "Never";
}
