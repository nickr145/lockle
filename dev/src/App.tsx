import { useCallback, useEffect, useState, useRef } from "react";
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
  const [message, setMessage] = useState("");

  // hard locks
  const animatingRef = useRef(false);
  const animationTimeoutRef = useRef<number | null>(null);

  const width = state.grid[0].length * TILE;
  const height = state.grid.length * TILE;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      drawGame(ctx, state);
    },
    [state]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (animatingRef.current) return;

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

      // kill any stray timeout
      if (animationTimeoutRef.current !== null) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }

      animatingRef.current = true;
      setMessage("");
      setIsAnimating(true);
      setRotationDeg(deg);

      animationTimeoutRef.current = window.setTimeout(() => {
        setRotationDeg(0);

        setState((prev) => {
          if (prev.status !== "playing") return prev;

          const copy = structuredClone(prev);
          const before = copy.switchesHit.size;

          stepGame(copy, rot!);

          if (copy.switchesHit.size > before) {
            setMessage("Switch activated!");
          }

          if (
            copy.switchesHit.size === copy.totalSwitches &&
            copy.status === "playing"
          ) {
            setMessage("All switches activated — exit unlocked!");
          }

          if (copy.status === "won") {
            setMessage("🎉 You escaped!");
          }
          
          if (copy.status === "lost") {
            setMessage("Move limit reached! You lost.");
          }

          return copy;
        });

        animatingRef.current = false;
        setIsAnimating(false);
        animationTimeoutRef.current = null;
      }, 200);
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

      {message && (
        <div style={{ marginTop: 10, fontSize: 14, opacity: 0.85 }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: 12, opacity: 0.8, fontSize: 14 }}>
        Rotate: ←/A and →/D
      </div>
    </div>
  );
}
