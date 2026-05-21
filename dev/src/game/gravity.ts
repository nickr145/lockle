// src/game/gravity.ts

import type { Direction, GameState } from "./types";

const DIRS: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export function applyGravity(state: GameState, dir: Direction): void {
  if (state.status !== "playing") return;

  const { dx, dy } = DIRS[dir];
  let { x, y } = state.ball;
  let teleported = false;

  while (true) {
    const nx = x + dx;
    const ny = y + dy;

    const cell = state.grid[ny]?.[nx];
    if (!cell || cell === "#") break;

    x = nx;
    y = ny;

    // Switch activation
    const sw = state.switches.find((s) => s.x === x && s.y === y);
    if (sw) state.switchesHit.add(sw.id);

    // Exit condition
    if (cell === "E" && state.switchesHit.size === state.totalSwitches) {
      state.status = "won";
      break;
    }

    // Tube teleportation — fires once per gravity call to avoid infinite loops
    if (!teleported && state.tubes.length > 0) {
      for (const [a, b] of state.tubes) {
        const onA = a.x === x && a.y === y;
        const onB = b.x === x && b.y === y;
        if (onA || onB) {
          const exit = onA ? b : a;
          x = exit.x;
          y = exit.y;
          teleported = true;
          const swExit = state.switches.find((s) => s.x === x && s.y === y);
          if (swExit) state.switchesHit.add(swExit.id);
          break;
        }
      }
    }
  }

  state.ball = { x, y };
}
