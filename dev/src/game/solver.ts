import { parseLevel } from "./state";
import { stepGame } from "./engine";
import type { GameState, Rotation } from "./types";

export type SolveResult = {
  optimal: number;
  path: Rotation[];
};

function stateKey(g: GameState, orientation: number): string {
  // orientation (0-3 CW steps from original) combined with ball position
  // uniquely identifies the grid layout + where the ball is.
  // switchesHit encodes remaining game progress.
  const mask = [...g.switchesHit].sort((a, b) => a - b).join(",");
  return `${orientation}|${g.ball.y}|${g.ball.x}|${mask}`;
}

/**
 * BFS solver — returns the minimum-rotation solution or null if unsolvable
 * within maxDepth moves.
 */
export function solve(layout: string[], maxDepth = 25): SolveResult | null {
  const initial = parseLevel(layout, 0);

  type Node = { state: GameState; orientation: number; path: Rotation[] };

  const queue: Node[] = [{ state: initial, orientation: 0, path: [] }];
  const visited = new Set<string>([stateKey(initial, 0)]);

  while (queue.length > 0) {
    const node = queue.shift()!;

    if (node.path.length >= maxDepth) continue;

    for (const rot of ["CW", "CCW"] as const) {
      const next = structuredClone(node.state);
      stepGame(next, rot);

      if (next.status === "won") {
        return { optimal: next.movesUsed, path: [...node.path, rot] };
      }

      const nextOrientation =
        rot === "CW"
          ? (node.orientation + 1) % 4
          : (node.orientation + 3) % 4;

      const k = stateKey(next, nextOrientation);
      if (!visited.has(k)) {
        visited.add(k);
        queue.push({
          state: next,
          orientation: nextOrientation,
          path: [...node.path, rot],
        });
      }
    }
  }

  return null;
}
