import { useCallback, useEffect, useState } from "react";
import GameCanvas from "./components/GameCanvas";
import { parseLevel } from "./game/state";
import { stepGame } from "./game/engine";
import { drawGame } from "./render/drawGame";
import type { GameState, Rotation } from "./game/types";

const TILE = 80;

const LEVEL = [
  "#######",
  "#..S..#",
  "#..#..#",
  "#..o..#",
  "#..#E.#",
  "#######",
];

export default function App() {
  const [state, setState] = useState<GameState>(() => parseLevel(LEVEL));

  // Canvas size derived from grid
  const width = state.grid[0].length * TILE;
  const height = state.grid.length * TILE;

  // Renderer
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      drawGame(ctx, state);
    },
    [state],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // prevents holding key spam
      if (state.status !== "playing") return;

      let rot: Rotation | null = null;

      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") rot = "CCW";
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") rot = "CW";

      if (!rot) return;

      e.preventDefault();

      // use functional setState so we always get latest state
      setState((prev) => {
        const copy = structuredClone(prev);
        stepGame(copy, rot!);
        return copy;
      });
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.status]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      <h1>Lockle</h1>
      <GameCanvas draw={draw} width={width} height={height} />
      <div style={{ marginTop: 12, opacity: 0.8, fontSize: 14 }}>
        {" "}
        Rotate: ←/A and →/D{" "}
      </div>
    </div>
  );
}
