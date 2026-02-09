import Histogram from "./Histogram";
import type { DailyResults } from "../game/types";

type ResultsModalProps = {
  results: DailyResults;
  onClose: () => void;
};

export default function ResultsModal({ results, onClose }: ResultsModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: "#f5e6d6",
          padding: 24,
          width: 420,
          borderRadius: 12,
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 12, right: 12 }}
        >
          ✕
        </button>

        <h2>Results — Day {results.day}</h2>

        <div style={{ fontSize: 48, margin: "12px 0" }}>
          {results.moves}
        </div>

        <div>
          Optimal: {results.optimalMoves}
        </div>

        <div style={{ marginTop: 16 }}>
          <Histogram
            buckets={results.distribution}
            youIndex={results.moves}
          />
        </div>

        <div style={{ marginTop: 16, fontSize: 14 }}>
          You beat {results.percentile}% of players
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button>Share</button>
          <button>View Optimal</button>
        </div>
      </div>
    </div>
  );
}
