import type { GameState } from "../game/types";

const TILE = 80;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.15,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.7,
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawStoneTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // base stone
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(x, y, TILE, TILE);

  // subtle tile seams
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);

  // a couple "cracks"
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.moveTo(x + 12, y + 18);
  ctx.lineTo(x + 30, y + 26);
  ctx.lineTo(x + 52, y + 22);
  ctx.stroke();
}

function drawBrickWall(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // dark wall base
  ctx.fillStyle = "#1c2433";
  ctx.fillRect(x, y, TILE, TILE);

  // IMPORTANT: all bricks are drawn in LOCAL tile-space,
  // so every wall tile has the same brick texture (no swimming)
  const brickH = 16;
  const brickW = 28;

  // mortar color
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  // horizontal mortar lines
  for (let yy = brickH; yy < TILE; yy += brickH) {
    ctx.fillRect(x, y + yy - 1, TILE, 2);
  }
  // vertical mortar lines
  for (let yy = 0; yy < TILE; yy += brickH) {
    for (let xx = brickW; xx < TILE; xx += brickW) {
      ctx.fillRect(x + xx - 1, y + yy + 1, 2, brickH - 2);
    }
  }

  // subtle brick shading blocks (still local)
  for (let yy = 0; yy < TILE; yy += brickH) {
    for (let xx = 0; xx < TILE; xx += brickW) {
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(x + xx + 2, y + yy + 2, brickW - 5, brickH - 5);

      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.fillRect(x + xx + 3, y + yy + brickH - 8, brickW - 7, 4);
    }
  }

  // grime overlay (kept but local-ish)
  const g = ctx.createLinearGradient(x, y, x, y + TILE);
  g.addColorStop(0, "rgba(0,0,0,0.12)");
  g.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = g;
  ctx.fillRect(x, y, TILE, TILE);

  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
}

function drawLock(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  unlocked: boolean,
) {
  const s = 1; // scale anchor
  const bodyW = 22 * s;
  const bodyH = 18 * s;
  const shackleR = 10 * s;

  // glow / base
  ctx.save();
  ctx.translate(cx, cy);

  if (unlocked) {
    ctx.shadowColor = "rgba(52,211,153,0.55)";
    ctx.shadowBlur = 16;
  } else {
    ctx.shadowColor = "rgba(251,191,36,0.35)";
    ctx.shadowBlur = 14;
  }

  // shackle
  ctx.lineWidth = 4;
  ctx.strokeStyle = unlocked ? "#34d399" : "#fbbf24";
  ctx.beginPath();

  if (unlocked) {
    // open shackle (tilted)
    ctx.arc(-4, -10, shackleR, Math.PI * 0.15, Math.PI * 1.05);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(6, -18);
    ctx.lineTo(14, -10);
    ctx.stroke();
  } else {
    ctx.arc(0, -10, shackleR, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }

  // body
  ctx.shadowBlur = 0;
  ctx.fillStyle = unlocked ? "#10b981" : "#f59e0b";
  ctx.fillRect(-bodyW / 2, -bodyH / 2 + 4, bodyW, bodyH);

  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.strokeRect(-bodyW / 2 + 0.5, -bodyH / 2 + 4.5, bodyW - 1, bodyH - 1);

  // keyhole
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.beginPath();
  ctx.arc(0, 2, 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillRect(-1.2, 2, 2.4, 6);

  ctx.restore();
}

function drawTrapdoor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  open: boolean,
) {
  const pad = 10;

  // frame
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(
    x + pad - 2,
    y + pad - 2,
    TILE - (pad - 2) * 2,
    TILE - (pad - 2) * 2,
  );

  if (open) {
    // hole
    const g = ctx.createRadialGradient(
      x + TILE / 2,
      y + TILE / 2,
      8,
      x + TILE / 2,
      y + TILE / 2,
      34,
    );
    g.addColorStop(0, "rgba(0,0,0,0.92)");
    g.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = g;
    ctx.fillRect(x + pad, y + pad, TILE - pad * 2, TILE - pad * 2);

    // rim highlight
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.strokeRect(
      x + pad + 0.5,
      y + pad + 0.5,
      TILE - pad * 2 - 1,
      TILE - pad * 2 - 1,
    );
  } else {
    // closed wooden hatch
    ctx.fillStyle = "#7a4b2b";
    ctx.fillRect(x + pad, y + pad, TILE - pad * 2, TILE - pad * 2);

    // planks
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle =
        i % 2 === 0 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
      ctx.fillRect(x + pad, y + pad + i * 15, TILE - pad * 2, 12);
    }

    // metal hinge + lock
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(x + pad + 6, y + pad + 6, 10, TILE - pad * 2 - 12);

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(x + TILE / 2 - 6, y + TILE / 2 - 6, 12, 12);
  }

  // outer border
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.strokeRect(
    x + pad + 0.5,
    y + pad + 0.5,
    TILE - pad * 2 - 1,
    TILE - pad * 2 - 1,
  );
}

function drawMetalBall(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  const r = 16;

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(cx + 4, cy + 10, r * 0.9, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  const g = ctx.createRadialGradient(cx - 6, cy - 8, 4, cx, cy, r + 6);
  g.addColorStop(0, "#f8fafc");
  g.addColorStop(0.35, "#bfc7d1");
  g.addColorStop(0.7, "#6b7280");
  g.addColorStop(1, "#111827");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // specular highlight
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.arc(cx - 6, cy - 7, 5, 0, Math.PI * 2);
  ctx.fill();

  // rim
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawGame(ctx: CanvasRenderingContext2D, state: GameState) {
  const { grid, ball } = state;

  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  const gridW = grid[0].length * TILE;
  const gridH = grid.length * TILE;

  // center the actual board inside the larger canvas
  const offsetX = Math.floor((w - gridW) / 2);
  const offsetY = Math.floor((h - gridH) / 2);

  ctx.clearRect(0, 0, w, h);

  // dungeon base (full canvas)
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#0b1220");
  bg.addColorStop(1, "#070a12");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // draw tiles (offset)
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const cell = grid[y][x];
      const px = offsetX + x * TILE;
      const py = offsetY + y * TILE;

      if (cell === "#") drawBrickWall(ctx, px, py);
      else drawStoneTile(ctx, px, py);

      if (cell === "E") {
        const open = state.switchesHit.size === state.totalSwitches;
        drawTrapdoor(ctx, px, py, open);
      }
    }
  }

  // locks (offset)
  for (const sw of state.switches) {
    const unlocked = state.switchesHit.has(sw.id);
    drawLock(
      ctx,
      offsetX + sw.x * TILE + TILE / 2,
      offsetY + sw.y * TILE + TILE / 2,
      unlocked,
    );
  }

  // ball (offset)
  drawMetalBall(
    ctx,
    offsetX + ball.x * TILE + TILE / 2,
    offsetY + ball.y * TILE + TILE / 2,
  );

  // vignette (full canvas)
  drawVignette(ctx, w, h);
}
