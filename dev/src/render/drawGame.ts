// src/render/drawGame.ts

import type { GameState } from "../game/types";

const TILE = 80;

export function drawGame(ctx: CanvasRenderingContext2D, state: GameState) {
  const { grid, ball } = state;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const cell = grid[y][x];

      // background
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);

      if (cell === "#") {
        ctx.fillStyle = "#111827";
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      }

      //   if (cell === "S") {
      //     ctx.fillStyle = "#f59e0b"; // amber
      //     ctx.beginPath();
      //     ctx.arc(x * TILE + TILE / 2, y * TILE + TILE / 2, 10, 0, Math.PI * 2);
      //     ctx.fill();
      //   }

      if (cell === "E") {
        ctx.fillStyle = "#10b981"; // green
        ctx.fillRect(x * TILE + 12, y * TILE + 12, TILE - 24, TILE - 24);
      }
    }
  }

  // switches
  for (const sw of state.switches) {
    ctx.fillStyle = state.switchesHit.has(sw.id)
      ? "#34d399" // activated (green)
      : "#f59e0b"; // inactive (amber)

    ctx.beginPath();
    ctx.arc(sw.x * TILE + TILE / 2, sw.y * TILE + TILE / 2, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // ball
  ctx.fillStyle = "#3b82f6"; // blue
  ctx.beginPath();
  ctx.arc(
    ball.x * TILE + TILE / 2,
    ball.y * TILE + TILE / 2,
    14,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}
