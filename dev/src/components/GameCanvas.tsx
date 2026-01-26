import { useEffect, useRef } from "react";

type GameCanvasProps = {
  draw: (ctx: CanvasRenderingContext2D) => void;
};

export default function GameCanvas({ draw }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    draw(ctx);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      style={{ border: "1px solid black" }}
    />
  );
}