type HistogramProps = {
  buckets: number[];
  yourMoves: number;
  optimalMoves: number;
};

// Bar color by distance from optimal
function tierColor(offset: number): string {
  if (offset === 0) return "rgba(96,165,250,0.50)";   // perfect
  if (offset === 1) return "rgba(251,191,36,0.58)";   // great
  if (offset <= 3)  return "rgba(148,163,184,0.48)";  // good
  return "rgba(205,124,74,0.44)";                     // okay
}

export default function Histogram({ buckets, yourMoves, optimalMoves }: HistogramProps) {
  if (!buckets.length) {
    return (
      <div
        style={{
          height: 114,
          opacity: 0.15,
          display: "flex",
          gap: 5,
          alignItems: "flex-end",
          marginTop: 22,
        }}
      >
        {[35, 65, 90, 55, 40, 25, 60, 45].map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h}%`,
              background: "rgba(255,255,255,0.35)",
              borderRadius: "3px 3px 0 0",
            }}
          />
        ))}
      </div>
    );
  }

  // Only render from optimalMoves onward — scores below optimal are impossible.
  // Extend to cover yourMoves even if it's beyond the current buckets array.
  const start = Math.min(optimalMoves, buckets.length - 1);
  const end = Math.max(buckets.length - 1, yourMoves);

  const display: number[] = [];
  for (let i = start; i <= end; i++) {
    display.push(i < buckets.length ? buckets[i] : 0);
  }

  const max = Math.max(1, ...display);

  return (
    <div>
      {/* Marker row: ▼ for you, ★ for optimal */}
      <div style={{ display: "flex", gap: 5, height: 14, marginTop: 8 }}>
        {display.map((_, i) => {
          const moves = start + i;
          const isYou = moves === yourMoves;
          const isOptimal = moves === optimalMoves;
          return (
            <div
              key={i}
              style={{ flex: 1, textAlign: "center", lineHeight: 1, fontSize: 9 }}
            >
              {isYou ? (
                <span style={{ color: "rgba(96,165,250,0.95)" }}>▼</span>
              ) : isOptimal ? (
                <span style={{ color: "#fbbf24" }}>★</span>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Bars — bottom-aligned */}
      <div
        style={{
          display: "flex",
          gap: 5,
          height: 100,
          alignItems: "flex-end",
        }}
      >
        {display.map((count, i) => {
          const moves = start + i;
          const isYou = moves === yourMoves;
          const offset = moves - optimalMoves;
          // Always give the player's bar a minimum visible height
          const barH =
            count > 0
              ? Math.max(10, (count / max) * 100)
              : isYou
                ? 10
                : 0;

          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${barH}%`,
                background: isYou
                  ? "rgba(96,165,250,0.90)"
                  : tierColor(offset),
                borderRadius: "3px 3px 0 0",
                boxShadow: isYou
                  ? "0 0 10px rgba(96,165,250,0.45)"
                  : "none",
                transition: "height 0.4s ease",
              }}
            />
          );
        })}
      </div>

      {/* X-axis labels */}
      <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
        {display.map((_, i) => {
          const moves = start + i;
          const isYou = moves === yourMoves;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 9,
                color: isYou
                  ? "rgba(96,165,250,0.9)"
                  : "rgba(255,255,255,0.42)",
              }}
            >
              {moves}
            </div>
          );
        })}
      </div>
    </div>
  );
}
