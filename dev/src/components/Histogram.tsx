type HistogramProps = {
  buckets: number[];
  yourMoves: number;
};

export default function Histogram({ buckets, yourMoves }: HistogramProps) {
  // Lightweight placeholder when loading / empty
  if (!buckets.length) {
    return (
      <div
        style={{
          height: 140,
          opacity: 0.35,
          display: "flex",
          gap: 8,
          alignItems: "flex-end",
          marginTop: 12,
        }}
      >
        {[40, 70, 55, 85, 60].map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h}%`,
              background: "rgba(0,0,0,0.18)",
              borderRadius: 6,
            }}
          />
        ))}
      </div>
    );
  }

  const max = Math.max(1, ...buckets);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        height: 140,
        gap: 6,
        marginTop: 12,
      }}
    >
      {buckets.map((count, moves) => {
        const heightPercent = Math.max(8, (count / max) * 100); // min bar height prevents “single thin bar”
        const isYou = moves === yourMoves;

        return (
          <div
            key={moves}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                height: `${heightPercent}%`,
                background: isYou ? "#3b82f6" : "rgba(0,0,0,0.2)",
                borderRadius: 6,
                transition: "height 0.3s ease",
                boxShadow: isYou ? "0 0 14px rgba(59,130,246,0.35)" : "none",
              }}
            />
            <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>
              {moves}
            </div>
          </div>
        );
      })}
    </div>
  );
}
