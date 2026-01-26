import { useCallback, useEffect } from "react";
import GameCanvas from "./components/GameCanvas";

export default function App() {
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, 400, 400);
    ctx.font = "20px sans-serif";
    ctx.fillText("Phase 1: Engine not wired yet", 40, 200);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        console.log("Rotate left");
      }
      if (e.key === "ArrowRight") {
        console.log("Rotate right");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Lockle</h1>
      <GameCanvas draw={draw} />
    </div>
  );
}