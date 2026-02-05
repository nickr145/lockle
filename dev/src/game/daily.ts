import { LEVELS } from "./levels";

export function getDailyLevel() {
  const today = new Date();

  // YYYY-MM-DD (stable across reloads)
  const key = today.toISOString().slice(0, 10);

  // Simple hash
  let hash = 0;
  for (const c of key) {
    hash = (hash * 31 + c.charCodeAt(0)) | 0;
  }

  const index = Math.abs(hash) % LEVELS.length;

  return LEVELS[index];
}
