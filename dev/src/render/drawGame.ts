import type { GameState } from "../game/types";

const TILE = 80;

const GEAR_COLORS = [
  { light: "#a8e040", mid: "#7ab825", dark: "#1e3606", glow: "rgba(120,180,35,0.75)" },
  { light: "#f04838", mid: "#cc2820", dark: "#420606", glow: "rgba(200,40,30,0.75)" },
  { light: "#9050e0", mid: "#7030c0", dark: "#220440", glow: "rgba(110,45,190,0.75)" },
  { light: "#40c8e0", mid: "#20a8c0", dark: "#063040", glow: "rgba(30,165,190,0.75)" },
];

const TUBE_COLORS = [
  { ring: "#06b6d4", glow: "rgba(6,182,212,0.28)" },
  { ring: "#d946ef", glow: "rgba(217,70,239,0.28)" },
];

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.18,
    w / 2, h / 2, Math.max(w, h) * 0.72,
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,6,12,0.52)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawGoldenFloor(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#a88020";
  ctx.fillRect(x, y, TILE, TILE);

  // Faint seam lines so adjacent tiles read as distinct without per-tile vignette
  ctx.strokeStyle = "rgba(45,20,0,0.22)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
}

function drawWallTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#0b1a26";
  ctx.fillRect(x, y, TILE, TILE);

  const brickH = 20;
  const brickW = 34;
  ctx.fillStyle = "rgba(0,18,28,0.60)";
  for (let yy = brickH; yy < TILE; yy += brickH) {
    ctx.fillRect(x, y + yy - 1, TILE, 2);
  }
  for (let yy = 0; yy < TILE; yy += brickH) {
    const offset = ((yy / brickH) % 2) * (brickW / 2);
    for (let xx = offset; xx < TILE + brickW; xx += brickW) {
      ctx.fillRect(x + xx - 1, y + yy + 1, 2, brickH - 2);
    }
  }

  for (let yy = 0; yy < TILE; yy += brickH) {
    const offset = ((yy / brickH) % 2) * (brickW / 2);
    for (let xx = offset - brickW; xx < TILE + brickW; xx += brickW) {
      ctx.fillStyle = "rgba(0,55,75,0.10)";
      ctx.fillRect(x + xx + 2, y + yy + 2, brickW - 5, brickH - 5);
    }
  }

  ctx.strokeStyle = "rgba(0,0,0,0.38)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
}

function drawGear(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  colorIdx: number,
  unlocked: boolean,
) {
  const c = GEAR_COLORS[colorIdx % GEAR_COLORS.length];
  const outerR = 22;
  const innerR = 14;
  const teeth = 8;
  const boreR = 6;

  ctx.save();
  ctx.translate(cx, cy);

  if (unlocked) {
    ctx.shadowColor = c.mid;
    ctx.shadowBlur = 24;
  }

  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const angle = (i / (teeth * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  ctx.fillStyle = unlocked ? c.mid : c.dark;
  ctx.fill();
  ctx.strokeStyle = unlocked ? c.light : "rgba(255,255,255,0.10)";
  ctx.lineWidth = unlocked ? 2 : 1;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(0, 0, boreR, 0, Math.PI * 2);
  ctx.fillStyle = unlocked ? "rgba(255,252,200,0.95)" : "rgba(4,8,16,0.88)";
  ctx.fill();
  ctx.strokeStyle = unlocked ? c.light : "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

function drawExitPortal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  open: boolean,
) {
  const cx = x + TILE / 2;
  const cy = y + TILE / 2;
  const r = 27;
  const t = Date.now() / 1000;

  const ringColor = open ? "#40ff80" : "#e0a820";
  const innerColor = open ? "rgba(64,255,128,0.50)" : "rgba(200,148,20,0.42)";

  ctx.save();
  ctx.shadowColor = ringColor;
  ctx.shadowBlur = open ? 30 : 14;

  ctx.strokeStyle = ringColor;
  ctx.lineWidth = open ? 4 : 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.66, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, r - 3);
  g.addColorStop(0, innerColor);
  g.addColorStop(1, "rgba(0,0,0,0.74)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * (open ? 2.8 : 0.55));
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = open ? 3 : 2;
  ctx.globalAlpha = open ? 0.75 : 0.35;
  const arcCount = open ? 3 : 4;
  const arcLen = open ? 0.65 : 0.38;
  for (let i = 0; i < arcCount; i++) {
    const start = (i / arcCount) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.42, start, start + arcLen);
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  if (open) {
    ctx.fillStyle = "#80ffa0";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★", cx, cy);
  } else {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "#b88010";
    ctx.fillRect(-6, -3, 12, 9);
    ctx.strokeStyle = "#e0a820";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -3, 5, Math.PI * 0.12, Math.PI * 0.88);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.beginPath();
    ctx.arc(0, 1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawTubePortal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  colorIdx: number,
) {
  const cx = x + TILE / 2;
  const cy = y + TILE / 2;
  const r = 23;
  const { ring, glow } = TUBE_COLORS[colorIdx % TUBE_COLORS.length];
  const t = Date.now() / 1000;

  ctx.save();

  ctx.shadowColor = ring;
  ctx.shadowBlur = 18;
  ctx.strokeStyle = ring;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  const g = ctx.createRadialGradient(cx, cy, 3, cx, cy, r - 2);
  g.addColorStop(0, glow);
  g.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 1.4);
  ctx.strokeStyle = ring;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 5; i++) {
    const start = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.52, start, start + 0.32);
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  ctx.restore();
}

// stretch > 1: elongated vertically (falling), < 1: squashed (landing). 1 = normal.
function drawImp(ctx: CanvasRenderingContext2D, cx: number, cy: number, stretch = 1) {
  const r = 17;
  const sy = Math.sqrt(stretch);         // vertical scale
  const sx = 1 / sy;                     // horizontal scale (area-preserving)

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(sx, sy);

  const g = ctx.createRadialGradient(-5, -8, 2, 0, 0, r + 5);
  g.addColorStop(0, "#c0ffc0");
  g.addColorStop(0.28, "#50dd50");
  g.addColorStop(0.70, "#1e9c1e");
  g.addColorStop(1, "#072807");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(0,45,0,0.55)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.arc(-6, -7, 5.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  ballPos?: { x: number; y: number },
  ballStretch = 1,
) {
  const { grid, ball } = state;

  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  const gridW = grid[0].length * TILE;
  const gridH = grid.length * TILE;

  const offsetX = Math.floor((w - gridW) / 2);
  const offsetY = Math.floor((h - gridH) / 2);

  ctx.clearRect(0, 0, w, h);

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#07121a");
  bg.addColorStop(1, "#040c14");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const cell = grid[y][x];
      const px = offsetX + x * TILE;
      const py = offsetY + y * TILE;

      if (cell === "#") drawWallTile(ctx, px, py);
      else drawGoldenFloor(ctx, px, py);

      if (cell === "E") {
        const open = state.switchesHit.size === state.totalSwitches;
        drawExitPortal(ctx, px, py, open);
      }
    }
  }

  for (let i = 0; i < state.tubes.length; i++) {
    for (const pos of state.tubes[i]) {
      drawTubePortal(ctx, offsetX + pos.x * TILE, offsetY + pos.y * TILE, i);
    }
  }

  for (let i = 0; i < state.switches.length; i++) {
    const sw = state.switches[i];
    const unlocked = state.switchesHit.has(sw.id);
    drawGear(
      ctx,
      offsetX + sw.x * TILE + TILE / 2,
      offsetY + sw.y * TILE + TILE / 2,
      i,
      unlocked,
    );
  }

  const impX = ballPos !== undefined ? ballPos.x : ball.x;
  const impY = ballPos !== undefined ? ballPos.y : ball.y;
  drawImp(
    ctx,
    offsetX + impX * TILE + TILE / 2,
    offsetY + impY * TILE + TILE / 2,
    ballStretch,
  );

  drawVignette(ctx, w, h);
}
