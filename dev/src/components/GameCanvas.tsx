import { useEffect, useRef } from "react";

type GameCanvasProps = {
  draw: (ctx: CanvasRenderingContext2D) => void;
  width: number;
  height: number;
};

export default function GameCanvas({ draw, width, height }: GameCanvasProps) {
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
      width={width}
      height={height}
      style={{
        display: "block",
        imageRendering: "auto",
      }}
    />
  );
}
