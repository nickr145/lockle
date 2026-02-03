// src/game/rotate.ts

import type { GameState, Grid, Position, Rotation } from "./types";

/**
 * Rotate the grid 90 degrees clockwise
 */
function rotateGridCW(grid: Grid): Grid {
  const h = grid.length;
  const w = grid[0].length;

  const rotated: Grid = Array.from({ length: w }, () =>
    Array(h).fill(".")
  );

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      rotated[x][h - 1 - y] = grid[y][x];
    }
  }

  return rotated;
}

/**
 * Rotate a position 90 degrees clockwise
 */
function rotatePosCW(pos: Position, height: number): Position {
  return {
    x: pos.y,
    y: height - 1 - pos.x,
  };
}

/**
 * Rotate the entire game state (grid + ball)
 */
export function rotateState(state: GameState, rotation: Rotation): void {
  if (rotation === "CW") {
    state.ball = rotatePosCW(state.ball, state.grid.length);
    state.grid = rotateGridCW(state.grid);
  } else {
    // CCW = 3 CW rotations
    rotateState(state, "CW");
    rotateState(state, "CW");
    rotateState(state, "CW");
  }

  state.movesUsed += 1;

  if (state.movesUsed >= state.moveLimit) {
    state.status = "lost";
  }
}
