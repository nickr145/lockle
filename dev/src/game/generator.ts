import { solve } from "./solver";

// Seeded LCG PRNG — same algorithm used by tools/generate.ts
export function seededRng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export type GeneratedLevel = {
  layout: string[];
  optimalMoves: number;
};

/**
 * Attempt to generate one valid level from a single seed.
 *
 * @param seed        Deterministic seed. Same seed always produces the same output.
 * @param minMoves    Minimum acceptable optimal move count (default 3).
 * @param maxMoves    Maximum acceptable optimal move count (default 12).
 * @param numSwitches Override switch count; if omitted, derived from the seed.
 *
 * Returns null when the seed produces an unsolvable or out-of-range puzzle.
 * Callers should advance the seed and retry until a level is found.
 */
export function generateLevel(
  seed: number,
  minMoves = 3,
  maxMoves = 12,
  numSwitches?: number,
  tubeChance = 0,
): GeneratedLevel | null {
  const rng = seededRng(seed);

  const W = 5 + Math.floor(rng() * 4); // 5–8
  const H = 5 + Math.floor(rng() * 4); // 5–8

  // Always consume this RNG call so the grid-fill sequence is stable
  // whether or not numSwitches is provided externally.
  const switchRoll = Math.floor(rng() * 6);
  const nSwitches = numSwitches ?? [1, 1, 2, 2, 2, 3][switchRoll];

  // Outer ring = walls; interior = random with 28% wall density
  const grid: string[][] = Array.from({ length: H }, (_, y) =>
    Array.from({ length: W }, (_, x) =>
      y === 0 || y === H - 1 || x === 0 || x === W - 1
        ? "#"
        : rng() < 0.28
          ? "#"
          : ".",
    ),
  );

  const free: Array<[number, number]> = [];
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (grid[y][x] === ".") free.push([y, x]);
    }
  }

  if (free.length < nSwitches + 2) return null;

  // Fisher-Yates shuffle
  for (let i = free.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [free[i], free[j]] = [free[j], free[i]];
  }

  const [ballPos, exitPos, ...rest] = free;
  const switchPositions = rest.slice(0, nSwitches);
  const tubePool = rest.slice(nSwitches);

  grid[ballPos[0]][ballPos[1]] = "o";
  grid[exitPos[0]][exitPos[1]] = "E";
  for (const [sy, sx] of switchPositions) {
    grid[sy][sx] = "S";
  }

  if (tubeChance > 0) {
    const tubeRoll = rng();
    if (tubeRoll < tubeChance && tubePool.length >= 2) {
      const idxA = Math.floor(rng() * tubePool.length);
      const remaining = tubePool.filter((_, i) => i !== idxA);
      const idxB = Math.floor(rng() * remaining.length);
      const [ay, ax] = tubePool[idxA];
      const [by, bx] = remaining[idxB];
      if (Math.abs(ay - by) + Math.abs(ax - bx) >= 3) {
        grid[ay][ax] = "a";
        grid[by][bx] = "a";
      }
    }
  }

  const layout = grid.map((row) => row.join(""));
  const result = solve(layout, maxMoves);

  if (!result || result.optimal < minMoves) return null;

  return { layout, optimalMoves: result.optimal };
}
