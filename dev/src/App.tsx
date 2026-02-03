import { useCallback, useEffect } from "react";
import GameCanvas from "./components/GameCanvas";
import { parseLevel } from "./game/state";
import { rotateState } from "./game/rotate";
import { applyGravity } from "./game/gravity";
import { stepGame } from "./game/engine";

export default function App() {
  const LEVEL = [
    "#######",
    "#..S..#",
    "#..#..#",
    "#..o..#",
    "#..#E.#",
    "#######",
  ];
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, 400, 400);
    ctx.font = "20px sans-serif";
    ctx.fillText("Phase 1: Engine not wired yet", 40, 200);
  }, []);

  useEffect(() => {
    // const handler = (e: KeyboardEvent) => {
    //   if (e.key === "ArrowLeft") {
    //     console.log("Rotate left");
    //   }
    //   if (e.key === "ArrowRight") {
    //     console.log("Rotate right");
    //   }
    // };

    // window.addEventListener("keydown", handler);
    // return () => window.removeEventListener("keydown", handler);
    const state = parseLevel(LEVEL);

    console.log("Initial:");
    console.table(state.grid);
    console.log("Ball:", state.ball);

    stepGame(state, "CW");

    console.log("After step:");
    console.table(state.grid);
    console.log("Ball:", state.ball);
    console.log("Moves:", state.movesUsed);
    console.log("Status:", state.status);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Lockle</h1>
      <GameCanvas draw={draw} />
    </div>
  );
}