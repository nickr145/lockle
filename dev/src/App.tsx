import { useCallback, useEffect, useState, useRef } from "react";
import GameCanvas from "./components/GameCanvas";
import { parseLevel } from "./game/state";
import { stepGame } from "./game/engine";
import { drawGame } from "./render/drawGame";
import type { GameState, Rotation, DailyResults } from "./game/types";
import { getDailyLevel } from "./game/daily";
import { supabase, submitScore } from "./supabase";
import { fetchDailyStats } from "./game/dailyStats";
import ResultsModal from "./components/ResultsModal";

const TILE = 80;
const LEVEL = getDailyLevel();

function todayKey() {
  return new Date().toLocaleDateString("en-CA");
}

function hasSubmittedToday() {
  return localStorage.getItem("lockle_submitted_" + todayKey()) === "true";
}

function markSubmittedToday() {
  localStorage.setItem("lockle_submitted_" + todayKey(), "true");
}

export default function App() {
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<DailyResults | null>(null);
  const submittedRef = useRef(false);
  const statusRef = useRef<GameState["status"]>("playing");
  const [state, setState] = useState<GameState>(() =>
    parseLevel(LEVEL.layout, LEVEL.optimalMoves),
  );

  useEffect(() => {
    statusRef.current = state.status;
  }, [state.status]);

  useEffect(() => {
    supabase.from("submissions").select("*").then(console.log);
  }, []);

  const [isAnimating, setIsAnimating] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [message, setMessage] = useState("");

  // hard locks
  const animatingRef = useRef(false);
  const animationTimeoutRef = useRef<number | null>(null);

  const width = state.grid[0].length * TILE;
  const height = state.grid.length * TILE;

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
        // const before = copy.switchesHit.size;

        stepGame(copy, rot);

        // if (copy.switchesHit.size > before) {
        //   setMessage("Switch activated!");
        // }

        if (
          copy.switchesHit.size === copy.totalSwitches &&
          copy.status === "playing"
        ) {
          setMessage("All switches activated — exit unlocked!");
        }

        if (copy.status === "won" && !submittedRef.current) { // && !hasSubmittedToday()) {
          submittedRef.current = true;
          markSubmittedToday();

          const results: DailyResults = {
            day: todayKey(),
            moves: copy.movesUsed,
            optimalMoves: copy.optimalMoves,
            percentile: 78, // placeholder for now
            distribution: [0, 1, 3, 8, 15, 22, 10, 4], // placeholder
          };

          setResults(results);
          setShowResults(true);

          setMessage("You escaped!");

          submitScore(todayKey(), copy.movesUsed);
        }
        // if (copy.status === "lost") setMessage("Out of moves!");

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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      <h1>Lockle</h1>
      <div style={{ opacity: 0.6, fontSize: 12 }}>Daily Puzzle</div>

      <div
        style={{
          transformOrigin: "center center",
          transform: `rotate(${rotationDeg}deg)`,
          transition: isAnimating ? "transform 200ms ease-in-out" : "none",
        }}
      >
        <GameCanvas draw={draw} width={width} height={height} />
      </div>

      {message && (
        <div style={{ marginTop: 10, fontSize: 14, opacity: 0.85 }}>
          {message}
        </div>
      )}

      <div style={{ fontSize: 14, opacity: 0.8 }}>
        {state.status === "won"
          ? `Solved in ${state.movesUsed} moves. Optimal: ${state.optimalMoves} moves.`
          : "Moves made: " + state.movesUsed}
      </div>

      <button onClick={resetGame}>Reset</button>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => triggerRotate("CCW")}>⟲ Left</button>
        <button onClick={() => triggerRotate("CW")}>Right ⟳</button>
      </div>

      <div style={{ marginTop: 12, opacity: 0.8, fontSize: 14 }}>
        Rotate: ←/A and →/D
      </div>

      {showResults && results && (
        <ResultsModal results={results} onClose={() => setShowResults(false)} />
      )}
    </div>
  );
}
