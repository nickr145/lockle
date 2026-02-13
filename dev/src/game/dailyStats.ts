import { supabase } from "../supabase";

export type DailyStats = {
  total: number;
  buckets: number[];     // indexed by move count (0..maxMoves)
  percentile: number;    // “you beat X%”
  bronze: number;
  silver: number;
  gold: number;
};

export async function fetchDailyStats(day: string, yourMoves: number): Promise<DailyStats> {
  const { data, error } = await supabase
    .from("submissions")
    .select("moves")
    .eq("day", day);

  if (error) throw error;

  const raw = (data ?? []).map((d) => d.moves);

  // Ensure your move is included for deterministic stats (no timeout needed)
  // Only add it if it's not already present.
  const scores = raw.includes(yourMoves) ? raw.slice() : raw.concat(yourMoves);
  scores.sort((a, b) => a - b);

  const total = scores.length;

  const maxMoves = Math.max(0, ...scores);
  const buckets = Array(maxMoves + 1).fill(0);
  for (const m of scores) buckets[m]++;

  // “you beat” = % of players strictly worse (higher move count)
  const beaten = scores.filter((m) => m > yourMoves).length;
  const percentile = Math.round((beaten / total) * 100);

  // Thresholds: using quartiles (your original intent)
  const q = (p: number) => scores[Math.min(total - 1, Math.floor(total * p))];

  return {
    total,
    buckets,
    percentile,
    bronze: q(0.75),
    silver: q(0.5),
    gold: q(0.25),
  };
}
