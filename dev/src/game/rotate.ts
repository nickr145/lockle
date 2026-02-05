import type { GameState, Rotation } from "./types";

export function rotateState(state: GameState, dir: Rotation) {
  const old = state.grid;
  const H = old.length;
  const W = old[0].length;

  const rotated: typeof state.grid = [];

  if (dir === "CW") {
    for (let x = 0; x < W; x++) {
      const row: typeof state.grid[number] = [];
      for (let y = H - 1; y >= 0; y--) {
        row.push(old[y][x]);
      }
      rotated.push(row);
    }

    state.grid = rotated;

    const { x, y } = state.ball;
    state.ball = {
      x: H - 1 - y,
      y: x,
    };
  }

  if (dir === "CCW") {
    for (let x = W - 1; x >= 0; x--) {
      const row: typeof state.grid[number] = [];
      for (let y = 0; y < H; y++) {
        row.push(old[y][x]);
      }
      rotated.push(row);
    }

    state.grid = rotated;

    const { x, y } = state.ball;
    state.ball = {
      x: y,
      y: W - 1 - x,
    };
  }

  state.movesUsed++;
}
