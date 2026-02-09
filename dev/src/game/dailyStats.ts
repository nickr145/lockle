import { supabase } from "../supabase";

export async function fetchDailyStats(day: string) {
  const { data, error } = await supabase
    .from("submissions")
    .select("moves")
    .eq("day", day);

  if (error || !data) {
    throw error ?? new Error("No data");
  }

  const scores = data.map(d => d.moves).sort((a, b) => a - b);
  const N = scores.length;

  const buckets: Record<number, number> = {};
  scores.forEach(m => {
    buckets[m] = (buckets[m] || 0) + 1;
  });

  return {
    scores,
    buckets,
    count: N,
    bronze: scores[Math.floor(N * 0.75)],
    silver: scores[Math.floor(N * 0.5)],
    gold: scores[Math.floor(N * 0.25)],
  };
}
