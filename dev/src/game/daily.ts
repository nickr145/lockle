import { generateLevel } from "./generator";

/** Date Lockle launched. Used to compute the "Day N" display number. */
const LAUNCH = new Date("2026-05-20T00:00:00");

/** Returns how many days have elapsed since launch (Day 1 = launch day). */
export function getDayNumber(): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const launch = new Date(
    LAUNCH.getFullYear(),
    LAUNCH.getMonth(),
    LAUNCH.getDate(),
  );
  return Math.max(1, Math.floor((today.getTime() - launch.getTime()) / 86_400_000) + 1);
}

/** Maps today's ISO date string to a deterministic integer seed. */
function dateToSeed(dateStr: string): number {
  let h = 0;
  for (const c of dateStr) {
    h = (h * 31 + c.charCodeAt(0)) | 0;
  }
  return Math.abs(h);
}

/**
 * Returns today's puzzle, generated procedurally from the current date.
 * Each calendar date always produces the same level.
 * Tries up to 200 seed offsets before falling back to a hardcoded level.
 */
export function getDailyLevel() {
  const dateStr = new Date().toLocaleDateString("en-CA");
  const base = dateToSeed(dateStr);

  for (let i = 0; i < 200; i++) {
    const level = generateLevel(base + i, 3, 12, undefined, 0.3);
    if (level) return level;
  }

  // Unreachable in practice — the generator accepts ~50 % of seeds
  return {
    layout: ["#######", "#..S..#", "#..#..#", "#..o..#", "#..#E.#", "#######"],
    optimalMoves: 6,
  };
}
