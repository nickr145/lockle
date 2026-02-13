import { useEffect, useMemo, useState } from "react";
import type { GameState, DailyResults } from "../game/types";
import styles from "./AboutModal.module.css";

type AboutModalProps = {
  day: string;
  state: GameState;
  results: DailyResults | null; // optional: shows plays + your result when available
  onClose: () => void;
};

type Tab = "howto" | "level";

export default function AboutModal({ day, state, results, onClose }: AboutModalProps) {
  const [tab, setTab] = useState<Tab>("howto");

  const gridW = state.grid[0]?.length ?? 0;
  const gridH = state.grid.length ?? 0;

  const timesPlayed = results?.total ?? null;
  const yourMoves = results?.moves ?? null;

  const levelRows = useMemo(
    () => [
      { k: "Day", v: day },
      { k: "Size", v: `${gridW} × ${gridH}` },
      { k: "Locks", v: String(state.totalSwitches) },
      { k: "Optimal", v: String(state.optimalMoves) },
      ...(timesPlayed !== null ? [{ k: "Times Played", v: String(timesPlayed) }] : []),
      ...(yourMoves !== null ? [{ k: "Your Result", v: `${yourMoves} moves` }] : []),
    ],
    [day, gridW, gridH, state.totalSwitches, state.optimalMoves, timesPlayed, yourMoves],
  );

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
        aria-label="About Lockle"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className={styles.close} onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "howto" ? styles.tabActive : ""}`}
            onClick={() => setTab("howto")}
            type="button"
          >
            How to Play
          </button>

          <button
            className={`${styles.tab} ${tab === "level" ? styles.tabActive : ""}`}
            onClick={() => setTab("level")}
            type="button"
          >
            This Level
          </button>
        </div>

        {tab === "howto" ? (
          <div className={styles.content}>
            <h2 className={styles.h2}>Goal</h2>
            <p className={styles.p}>
              Rotate the dungeon to roll the metal orb into <b>all locks</b>. When they’re all hit,
              the <b>trapdoor unlocks</b> — roll into it to escape.
            </p>

            <h2 className={styles.h2}>Rules</h2>
            <ul className={styles.ul}>
              <li>Each rotation (left/right) counts as a move.</li>
              <li>Hit every lock to unlock the trapdoor.</li>
              <li>Then roll into the trapdoor tile to win.</li>
              <li>
                Keyboard: <span className={styles.kbd}>A</span>/<span className={styles.kbd}>←</span> and{" "}
                <span className={styles.kbd}>D</span>/<span className={styles.kbd}>→</span>
              </li>
            </ul>

            <div className={styles.note}>
              Tip: try to plan rotations so you “collect” locks on the way to the exit.
            </div>
          </div>
        ) : (
          <div className={styles.content}>
            <h2 className={styles.h2}>Stats</h2>

            <div className={styles.table}>
              {levelRows.map((r) => (
                <div key={r.k} className={styles.row}>
                  <div className={styles.left}>{r.k}</div>
                  <div className={styles.right}>{r.v}</div>
                </div>
              ))}
            </div>

            {timesPlayed === null && (
              <div className={styles.note}>
                “Times Played” appears after you finish (when today’s stats load).
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
