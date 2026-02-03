// src/game/engine.ts

import type { GameState, Rotation } from "./types";
import { rotateState } from "./rotate";
import { applyGravity } from "./gravity";

/**
 * Perform a single player move:
 * - rotate the box
 * - apply gravity
 * - enforce game rules
 */
export function stepGame(state: GameState, rotation: Rotation): void {
  if (state.status !== "playing") return;

  // 1. Rotate the board
  rotateState(state, rotation);

  // 2. Gravity always pulls "down" in screen space for now
  // (Later this will map to rotation-aware gravity)
  applyGravity(state, "down");

  // 3. Final move limit enforcement
  if (state.movesUsed >= state.moveLimit && state.status === "playing") {
    state.status = "lost";
  }
}
