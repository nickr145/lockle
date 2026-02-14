import { useEffect } from "react";
import Histogram from "./Histogram";
import type { DailyResults } from "../game/types";
import styles from "./ResultsModal.module.css";

type ResultsModalProps = {
  results: DailyResults;
  onClose: () => void;
  onShare: () => void;
};

export default function ResultsModal({
  results,
  onClose,
  onShare,
}: ResultsModalProps) {
  const statsReady = results.distribution.length > 0;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Results</h2>
            <div className={styles.subtitle}>Day {results.day}</div>
          </div>

          <button className={styles.close} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className={styles.bigNumber}>{results.moves}</div>

        <div className={styles.pills}>
          <div className={styles.pill}>
            <div className={styles.pillLabel}>Optimal</div>
            <div className={styles.pillValue}>{results.optimalMoves}</div>
          </div>

          <div className={styles.pill}>
            <div className={styles.pillLabel}>Percentile</div>
            <div className={styles.pillValue}>
              {statsReady ? `${results.percentile}%` : "…"}
            </div>
          </div>
        </div>

        <div className={styles.metaRow}>
          <div>🥇 ≤ {results.gold}</div>
          <div>🥈 ≤ {results.silver}</div>
          <div>🥉 ≤ {results.bronze}</div>
          <div className={styles.metaRight}>{results.total} plays</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitleRow}>
            <div className={styles.cardTitle}>Distribution</div>
            <div className={styles.cardHint}>Your bar is highlighted</div>
          </div>

          <Histogram buckets={results.distribution} yourMoves={results.moves} />
        </div>

        <div className={styles.percentile}>
          {statsReady
            ? `You beat ${results.percentile}% of players`
            : "Calculating today’s stats…"}
        </div>

        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.primary}`}
            onClick={onShare}
          >
            Share
          </button>

          <button className={`${styles.btn} ${styles.secondary}`}>
            View Optimal
          </button>
        </div>
      </div>
    </div>
  );
}
