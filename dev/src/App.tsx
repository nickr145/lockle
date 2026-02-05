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
  const [isAnimating, setIsAnimating] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);

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
      if (e.repeat) return;
      if (isAnimating) return;

      let rot: Rotation | null = null;
      let deg = 0;

      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        rot = "CW";
        deg = 90;
      }

      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        rot = "CCW";
        deg = -90;
      }

      if (!rot) return;

      e.preventDefault();
      setIsAnimating(true);
      setRotationDeg(deg);

      setTimeout(() => {
        setRotationDeg(0);

        setState((prev) => {
          if (prev.status !== "playing") return prev;

          const copy = structuredClone(prev);
          stepGame(copy, rot!);
          return copy;
        });

        setIsAnimating(false);
      }, 200);
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAnimating]);

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

      <div
        style={{
          transformOrigin: "center center",
          transform: `rotate(${rotationDeg}deg)`,
          transition: isAnimating ? "transform 200ms ease-in-out" : "none",
        }}
      >
        <GameCanvas draw={draw} width={width} height={height} />
      </div>

      {isAnimating && (
        <div style={{ marginTop: 8, opacity: 0.6 }}>Rotating…</div>
      )}

      <div style={{ marginTop: 12, opacity: 0.8, fontSize: 14 }}>
        Rotate: ←/A and →/D
      </div>
    </div>
  );
}
