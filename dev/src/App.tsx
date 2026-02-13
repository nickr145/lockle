import { useCallback, useEffect, useState, useRef } from "react";
import GameCanvas from "./components/GameCanvas";
import { parseLevel } from "./game/state";
import { stepGame } from "./game/engine";
import { drawGame } from "./render/drawGame";
import type { GameState, Rotation, DailyResults } from "./game/types";
import { getDailyLevel } from "./game/daily";
import { submitScore } from "./supabase";
import { fetchDailyStats } from "./game/dailyStats";
import ResultsModal from "./components/ResultsModal";
import AboutModal from "./components/AboutModal";

const TILE = 80;
const LEVEL = getDailyLevel();

function medalFor(moves: number, optimal: number) {
  if (moves <= optimal) return "💎 PERFECT";
  if (moves <= optimal + 1) return "🥇 Great";
  if (moves <= optimal + 3) return "🥈 Good";
  return "🥉 Okay";
}

function shareResults(results: DailyResults) {
  const text = `https://lockle.app Day ${results.day}
${medalFor(results.moves, results.optimalMoves)}
${results.moves} moves`;

  navigator.clipboard.writeText(text);
}

function todayKey() {
  return new Date().toLocaleDateString("en-CA");
}

function hasSubmittedToday() {
  if (import.meta.env.DEV) return false;
  return localStorage.getItem("lockle_submitted_" + todayKey()) === "true";
}

function markSubmittedToday() {
  localStorage.setItem("lockle_submitted_" + todayKey(), "true");
}

export default function App() {
  const [showResults, setShowResults] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [results, setResults] = useState<DailyResults | null>(null);

  const submittedRef = useRef(false);
  const statusRef = useRef<GameState["status"]>("playing");
  const [state, setState] = useState<GameState>(() =>
    parseLevel(LEVEL.layout, LEVEL.optimalMoves),
  );

  useEffect(() => {
    statusRef.current = state.status;
  }, [state.status]);

  const [isAnimating, setIsAnimating] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [message, setMessage] = useState("");

  const animatingRef = useRef(false);
  const animationTimeoutRef = useRef<number | null>(null);

  const gridW = state.grid[0].length * TILE;
  const gridH = state.grid.length * TILE;

  // "diagonal" canvas so rotations never clip + frame never snaps
  const canvasSize = Math.ceil(Math.sqrt(gridW * gridW + gridH * gridH));

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      drawGame(ctx, state);
    },
    [state],
  );

  function resetGame() {
    statusRef.current = "playing";
    animatingRef.current = false;
    submittedRef.current = false;

    if (animationTimeoutRef.current !== null) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    setRotationDeg(0);
    setIsAnimating(false);
    setMessage("");
    setState(parseLevel(LEVEL.layout, LEVEL.optimalMoves));
  }

  function triggerRotate(rot: Rotation) {
    if (animatingRef.current) return;
    if (statusRef.current !== "playing") return;

    const deg = rot === "CW" ? 90 : -90;

    if (animationTimeoutRef.current !== null) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    animatingRef.current = true;
    setMessage("");
    setIsAnimating(true);
    setRotationDeg(deg);

    animationTimeoutRef.current = window.setTimeout(() => {
      setRotationDeg(0);

      setState((prev) => {
        if (prev.status !== "playing") return prev;

        const copy = structuredClone(prev);
        stepGame(copy, rot);

        if (
          copy.switchesHit.size === copy.totalSwitches &&
          copy.status === "playing"
        ) {
          setMessage("Locks released — trapdoor unlocked!");
        }

        if (
          copy.status === "won" &&
          !submittedRef.current &&
          !hasSubmittedToday()
        ) {
          submittedRef.current = true;

          const day = todayKey();
          const moves = copy.movesUsed;

          setResults({
            day,
            moves,
            optimalMoves: copy.optimalMoves,
            percentile: 0,
            distribution: [],
            total: 0,
            bronze: moves,
            silver: moves,
            gold: moves,
          });
          setShowResults(true);

          setTimeout(async () => {
            try {
              await submitScore(day, moves);
              markSubmittedToday();

              const stats = await fetchDailyStats(day, moves);

              setResults({
                day,
                moves,
                optimalMoves: copy.optimalMoves,
                percentile: stats.percentile,
                distribution: stats.buckets,
                total: stats.total,
                bronze: stats.bronze,
                silver: stats.silver,
                gold: stats.gold,
              });
            } catch (e) {
              console.error("Failed to submit score or fetch stats", e);
              submittedRef.current = false;
            }
          }, 0);
        }

        return copy;
      });

      animatingRef.current = false;
      setIsAnimating(false);
      animationTimeoutRef.current = null;
    }, 200);
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        e.preventDefault();
        triggerRotate("CW");
      }

      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        e.preventDefault();
        triggerRotate("CCW");
      }
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="appShell">
      <div className="topBar">
        <div className="brand">
          <div className="brandTitle">LOCKLE</div>
          <div className="brandSub">Dungeon Daily Puzzle</div>
        </div>

        <div className="hud">
          <div className="chip">
            <span>Day</span> {todayKey()}
          </div>
          <div className="chip">
            <span>Moves</span> {state.movesUsed}
          </div>
          <button
            className="btn btnIcon"
            onClick={() => setShowAbout(true)}
            aria-label="About"
          >
            ?
          </button>
          <button className="btn btnDanger" onClick={resetGame}>
            Reset
          </button>
        </div>
      </div>

      <div className="center">
        {/* one merged “cabinet” */}
        <div
          className="cabinet"
          style={{ ["--stageSize" as any]: `${canvasSize}px` }}
        >
          {/* static screen frame */}
          <div className="screenFrame">
            {/* ONLY this rotates */}
            <div
              className="boardRotator"
              style={{
                transform: `rotate(${rotationDeg}deg)`,
                transition: isAnimating
                  ? "transform 200ms ease-in-out"
                  : "none",
              }}
            >
              <GameCanvas draw={draw} width={canvasSize} height={canvasSize} />
            </div>
          </div>

          {/* control deck (merged, same card) */}
          <div className="controlDeck">
            <button
              className="btn btnPrimary"
              onClick={() => triggerRotate("CCW")}
            >
              ⟲ Rotate Left
            </button>

            <button
              className="btn btnPrimary"
              onClick={() => triggerRotate("CW")}
            >
              Rotate Right ⟳
            </button>
          </div>
        </div>
      </div>

      <div />

      {showResults && results && (
        <ResultsModal
          results={results}
          onClose={() => setShowResults(false)}
          onShare={() => shareResults(results)}
        />
      )}
      {showAbout && (
        <AboutModal
          day={todayKey()}
          state={state}
          results={results}
          onClose={() => setShowAbout(false)}
        />
      )}
    </div>
  );
}
