// src/game/state.ts

import type { Cell, GameState, Grid, Position } from "./types";

export function parseLevel(level: string[]): GameState {
  const grid: Grid = [];
  let ball: Position | null = null;

  for (let y = 0; y < level.length; y++) {
    const row: Cell[] = [];

    for (let x = 0; x < level[y].length; x++) {
      const ch = level[y][x];

      if (ch === "o") {
        ball = { x, y };
        row.push(".");
      } else if (ch === "#" || ch === "." || ch === "S" || ch === "E") {
        row.push(ch);
      } else {
        throw new Error(`Invalid character '${ch}' at (${x}, ${y})`);
      }
    }

    grid.push(row);
  }

  if (!ball) {
    throw new Error("Level must contain exactly one ball (o)");
  }

  return {
    grid,
    ball,
    switchesHit: new Set(),
    movesUsed: 0,
    moveLimit: 8,
    status: "playing",
  };
}
