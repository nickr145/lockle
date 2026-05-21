import { useEffect, useState } from "react";
import Histogram from "./Histogram";
import type { DailyResults } from "../game/types";
import { medalFor } from "../game/medal";
import styles from "./ResultsModal.module.css";

function msUntilMidnight(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime() - now.getTime();
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

type ResultsModalProps = {
  results: DailyResults;
  streak: number;
  onClose: () => void;
  onShare: () => void;
};

export default function ResultsModal({
  results,
  streak,
  onClose,
  onShare,
}: ResultsModalProps) {
  const statsReady = results.distribution.length > 0;
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(() => msUntilMidnight());

  const medal = medalFor(results.moves, results.optimalMoves);
  const diff = results.moves - results.optimalMoves;

  useEffect(() => {
    const id = setInterval(() => setCountdown(msUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleShare() {
    onShare();
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Results</h2>
            <div className={styles.subtitle}>Day #{results.dayNumber}</div>
          </div>
          <button className={styles.close} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Medal hero */}
        <div
          className={styles.medalBadge}
          style={{
            background: medal.color + "20",
            borderColor: medal.color + "50",
          }}
        >
          <span className={styles.medalEmoji}>{medal.emoji}</span>
          <span className={styles.medalLabel} style={{ color: medal.color }}>
            {medal.label}
          </span>
        </div>

        {/* Move count + comparison */}
        <div className={styles.moveRow}>
          <span className={styles.bigNumber}>{results.moves}</span>
          <div className={styles.moveMeta}>
            <div className={styles.moveLabel}>moves</div>
            <div className={styles.moveDiff}>
              {diff === 0
                ? "on par with optimal"
                : `+${diff} from optimal (${results.optimalMoves})`}
            </div>
          </div>
        </div>

        {/* Stats pills */}
        <div className={styles.pills}>
          <div className={styles.pill}>
            <div className={styles.pillLabel}>Beat</div>
            <div className={styles.pillValue}>
              {statsReady ? `${results.percentile}%` : "…"}
            </div>
          </div>

          {streak > 0 && (
            <div className={`${styles.pill} ${styles.pillStreak}`}>
              <div className={styles.pillLabel}>🔥 Streak</div>
              <div className={styles.pillValue}>
                {streak} {streak === 1 ? "day" : "days"}
              </div>
            </div>
          )}
        </div>

        {/* Distribution card */}
        <div className={styles.card}>
          <div className={styles.cardTitleRow}>
            <div className={styles.cardTitle}>Distribution</div>
            <div className={styles.cardHint}>
              <span style={{ color: "rgba(96,165,250,0.9)" }}>▼</span> you
              &nbsp;
              <span style={{ color: "#fbbf24" }}>★</span> optimal
            </div>
          </div>

          <Histogram
            buckets={results.distribution}
            yourMoves={results.moves}
            optimalMoves={results.optimalMoves}
          />

          <div className={styles.metaRow}>
            <span>💎 ={results.optimalMoves}</span>
            <span>🥇 ≤{results.optimalMoves + 1}</span>
            <span>🥈 ≤{results.optimalMoves + 3}</span>
            {statsReady && (
              <span className={styles.metaRight}>{results.total} plays</span>
            )}
          </div>
        </div>

        {/* Countdown to next puzzle */}
        <div className={styles.countdown}>
          <span className={styles.countdownLabel}>Next puzzle in</span>
          <span className={styles.countdownTimer}>{formatMs(countdown)}</span>
        </div>

        {/* Share action */}
        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.primary} ${copied ? styles.copied : ""}`}
            onClick={handleShare}
          >
            {copied ? "Copied! ✓" : "Share Results"}
          </button>
        </div>
      </div>
    </div>
  );
}
