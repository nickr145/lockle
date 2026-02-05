// src/game/state.ts

import type { Cell, GameState, Grid, Position, Switch } from "./types";

export function parseLevel(level: string[], optimalMoves: number): GameState {
  const grid: Grid = [];
  let ball: Position | null = null;

  let totalSwitches = 0;
  let switches: Switch[] = [];
  let switchId = 0;

  for (let y = 0; y < level.length; y++) {
    const row: Cell[] = [];

    for (let x = 0; x < level[y].length; x++) {
      const ch = level[y][x];

      if (ch === "o") {
        ball = { x, y };
        row.push(".");
      } else if (ch === "S") {
        switches.push({ id: switchId++, x, y });
        totalSwitches++;
        row.push("."); // switches are not terrain anymore
      } else if (ch === "#" || ch === "." || ch === "E") {
        row.push(ch);
      } else {
        throw new Error(`Invalid character '${ch}' at (${x}, ${y})`);
      }
    }

    grid.push(row);
  }

  if (!ball) throw new Error("Level must contain exactly one ball (o)");

  return {
    grid,
    ball,
    switches,
    switchesHit: new Set<number>(),
    totalSwitches,
    movesUsed: 0,
    optimalMoves,
    status: "playing",
  };
}
