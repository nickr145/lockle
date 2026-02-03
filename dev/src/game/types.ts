// src/game/types.ts

export type Cell =
  | "#"   // wall
  | "."   // empty
  | "S"   // switch
  | "E";  // exit

export type Grid = Cell[][];

export type Position = {
  x: number;
  y: number;
};

export type Direction = "up" | "down" | "left" | "right";

export type Rotation = "CW" | "CCW";

export type GameStatus = "playing" | "won" | "lost";

export type GameState = {
  grid: Grid;
  ball: Position;
  switchesHit: Set<string>;
  movesUsed: number;
  moveLimit: number;
  status: GameStatus;
};
