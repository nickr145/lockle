type HistogramProps = {
  buckets: number[];
  youIndex: number;
};

export default function Histogram({ buckets, youIndex }: HistogramProps) {
  const max = Math.max(...buckets, 1);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
      {buckets.map((count, i) => (
        <div
          key={i}
          style={{
            width: 10,
            height: `${(count / max) * 100}%`,
            background: i === youIndex ? "#3b82f6" : "#d1d5db",
          }}
        />
      ))}
    </div>
  );
}
