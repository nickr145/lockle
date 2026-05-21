// src/game/types.ts

export type Cell =
  | "#" // wall
  | "." // empty
  | "S" // switch
  | "E"; // exit

export type Grid = Cell[][];

export type Position = {
  x: number;
  y: number;
};

export type Switch = {
  id: number;
  x: number;
  y: number;
};

export type Direction = "up" | "down" | "left" | "right";

export type Rotation = "CW" | "CCW";

export type GameStatus = "playing" | "won"; // | "lost";

export type TubePair = [Position, Position];

export type GameState = {
  grid: Grid;
  ball: Position;
  switches: Switch[];
  switchesHit: Set<number>;
  totalSwitches: number;
  movesUsed: number;
  optimalMoves: number;
  status: GameStatus;
  tubes: TubePair[];
};

export type DailyResults = {
  day: string;       // ISO date string — used as the Supabase row key
  dayNumber: number; // display number (days since launch)
  moves: number;
  optimalMoves: number;
  percentile: number; // 0–100
  distribution: number[]; // histogram buckets
  total: number;
  bronze: number;
  silver: number;
  gold: number;
};
