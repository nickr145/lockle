export type Medal = {
  emoji: string;
  label: string;
  color: string;
};

export function medalFor(moves: number, optimal: number): Medal {
  if (moves <= optimal) return { emoji: "💎", label: "PERFECT", color: "#60a5fa" };
  if (moves <= optimal + 1) return { emoji: "🥇", label: "Great", color: "#fbbf24" };
  if (moves <= optimal + 3) return { emoji: "🥈", label: "Good", color: "#94a3b8" };
  return { emoji: "🥉", label: "Okay", color: "#cd7c4a" };
}
