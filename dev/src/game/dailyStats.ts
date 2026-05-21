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
  optimalMoves: number,
): Promise<DailyStats> {
  const { data, error } = await supabase.rpc("daily_stats", { p_day: day });
  if (error) throw error;

  const row = (Array.isArray(data) ? data[0] : data) as DailyStatsRpcRow | null;

  const counts = row?.moves_counts ?? {};

  const scores: number[] = [];
  for (const [k, v] of Object.entries(counts)) {
    const moves = Number(k);
    const cnt = Number(v);
    if (Number.isFinite(moves) && Number.isFinite(cnt) && cnt > 0) {
      for (let i = 0; i < cnt; i++) scores.push(moves);
    }
  }

  if (!scores.includes(yourMoves)) scores.push(yourMoves);

  scores.sort((a, b) => a - b);

  const total = scores.length;
  const maxMoves = Math.max(optimalMoves, ...scores);

  const buckets = Array(maxMoves + 1).fill(0);
  for (const m of scores) buckets[m]++;

  const beaten = scores.filter((m) => m > yourMoves).length;
  const percentile = total === 0 ? 0 : Math.round((beaten / total) * 100);

  return {
    total,
    buckets,
    percentile,
    // Thresholds relative to optimalMoves — not derived from player score distribution
    gold: optimalMoves,
    silver: optimalMoves + 1,
    bronze: optimalMoves + 3,
  };
}
