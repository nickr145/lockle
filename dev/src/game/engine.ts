// src/game/engine.ts

import type { GameState, Position, Rotation } from "./types";
import { rotateState } from "./rotate";
import { applyGravity } from "./gravity";

// Returns the ball position after rotation but before gravity — used for fall animation.
export function stepGame(state: GameState, rotation: Rotation): { ballAfterRotation: Position } {
  if (state.status !== "playing") return { ballAfterRotation: { ...state.ball } };

  rotateState(state, rotation);
  const ballAfterRotation = { ...state.ball };
  applyGravity(state, "down");
  return { ballAfterRotation };
}
