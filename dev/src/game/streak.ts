const LAST_PLAYED_KEY = "lockle_last_played";
const STREAK_KEY = "lockle_streak";
const RESULT_PREFIX = "lockle_daily_";

export type CachedDayResult = {
  moves: number;
  optimalMoves: number;
  dayNumber: number;
  percentile: number;
  distribution: number[];
  total: number;
  bronze: number;
  silver: number;
  gold: number;
};

export function getStreak(): number {
  return Number(localStorage.getItem(STREAK_KEY) ?? 0);
}

export function updateStreak(day: string): number {
  const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);
  if (lastPlayed === day) return getStreak();

  // parse as noon local time to avoid DST edge cases
  const d = new Date(day + "T12:00:00");
  d.setDate(d.getDate() - 1);
  const yesterday = d.toLocaleDateString("en-CA");

  const current = Number(localStorage.getItem(STREAK_KEY) ?? 0);
  const newStreak = lastPlayed === yesterday ? current + 1 : 1;

  localStorage.setItem(STREAK_KEY, String(newStreak));
  localStorage.setItem(LAST_PLAYED_KEY, day);
  return newStreak;
}

export function cacheDayResult(day: string, result: CachedDayResult): void {
  localStorage.setItem(RESULT_PREFIX + day, JSON.stringify(result));
}

export function getCachedResult(day: string): CachedDayResult | null {
  const raw = localStorage.getItem(RESULT_PREFIX + day);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedDayResult;
  } catch {
    return null;
  }
}
