import { supabase } from "../supabase";

export type DailyStats = {
  total: number;
  buckets: number[];
  percentile: number;
  bronze: number;
  silver: number;
  gold: number;
};

type DailyStatsRpcRow = {
  total: number;
  moves_counts: Record<string, number> | null;
};

export async function fetchDailyStats(
  day: string,
  yourMoves: number,
): Promise<DailyStats> {
  const { data, error } = await supabase.rpc("daily_stats", { p_day: day });
  if (error) throw error;

  // RPC returns ONE row (or null)
  const row = (Array.isArray(data) ? data[0] : data) as DailyStatsRpcRow | null;

  // const totalFromDb = row?.total ?? 0;
  const counts = row?.moves_counts ?? {};

  // Build a score list (expanded) for percentile + quartiles
  // (fine for small daily counts; if you expect huge volume, do a percentile-in-SQL later)
  const scores: number[] = [];
  for (const [k, v] of Object.entries(counts)) {
    const moves = Number(k);
    const cnt = Number(v);
    if (Number.isFinite(moves) && Number.isFinite(cnt) && cnt > 0) {
      for (let i = 0; i < cnt; i++) scores.push(moves);
    }
  }

  // Ensure your score is included for deterministic UI
  if (!scores.includes(yourMoves)) scores.push(yourMoves);

  scores.sort((a, b) => a - b);

  const total = scores.length;
  const maxMoves = Math.max(0, ...scores);

  const buckets = Array(maxMoves + 1).fill(0);
  for (const m of scores) buckets[m]++;

  const beaten = scores.filter((m) => m > yourMoves).length;
  const percentile = total === 0 ? 0 : Math.round((beaten / total) * 100);

  const q = (p: number) =>
    scores[Math.min(total - 1, Math.floor(total * p))] ?? yourMoves;

  return {
    total,
    buckets,
    percentile,
    bronze: q(0.75),
    silver: q(0.5),
    gold: q(0.25),
  };
}
