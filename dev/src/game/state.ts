// src/game/state.ts

import type { Cell, GameState, Grid, Position, Switch, TubePair } from "./types";
import { applyGravity } from "./gravity";

export function parseLevel(level: string[], optimalMoves: number): GameState {
  const grid: Grid = [];
  let ball: Position | null = null;

  let totalSwitches = 0;
  let switches: Switch[] = [];
  let switchId = 0;
  const tubeMap = new Map<string, Position[]>();

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
        row.push(".");
      } else if (ch >= "a" && ch <= "z") {
        if (!tubeMap.has(ch)) tubeMap.set(ch, []);
        tubeMap.get(ch)!.push({ x, y });
        row.push(".");
      } else if (ch === "#" || ch === "." || ch === "E") {
        row.push(ch);
      } else {
        throw new Error(`Invalid character '${ch}' at (${x}, ${y})`);
      }
    }

    grid.push(row);
  }

  if (!ball) throw new Error("Level must contain exactly one ball (o)");

  const tubes: TubePair[] = [];
  for (const positions of tubeMap.values()) {
    if (positions.length === 2) {
      tubes.push([positions[0], positions[1]]);
    }
  }

  const state: GameState = {
    grid,
    ball,
    switches,
    switchesHit: new Set<number>(),
    totalSwitches,
    movesUsed: 0,
    optimalMoves,
    status: "playing",
    tubes,
  };

  // Settle the ball to its natural resting position before gameplay begins.
  applyGravity(state, "down");

  return state;
}
