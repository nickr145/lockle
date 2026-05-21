import { useCallback, useEffect, useState, useRef } from "react";
import GameCanvas from "./components/GameCanvas";
import { parseLevel } from "./game/state";
import { stepGame } from "./game/engine";
import { drawGame } from "./render/drawGame";
import type { GameState, Rotation, DailyResults } from "./game/types";
import { getDailyLevel, getDayNumber } from "./game/daily";
import { submitScore } from "./supabase";
import { fetchDailyStats } from "./game/dailyStats";
import ResultsModal from "./components/ResultsModal";
import AboutModal from "./components/AboutModal";
import { getDeviceId } from "./game/device";
import { medalFor } from "./game/medal";
import {
  getStreak,
  updateStreak,
  cacheDayResult,
  getCachedResult,
} from "./game/streak";

const TILE = 80;
const LEVEL = getDailyLevel();

function shareResults(results: DailyResults, streak: number) {
  const medal = medalFor(results.moves, results.optimalMoves);
  const movesStr = `${results.moves}/${results.optimalMoves} moves`;

  const parts = [
    `${medal.emoji} ${medal.label} ${medal.emoji}`,
    movesStr,
  ];
  if (results.total > 0) parts.push(`${results.percentile}%`);

  const lines = [
    `Lockle #${results.dayNumber}`,
    parts.join("  ·  "),
  ];
  if (streak > 1) lines.push(`🔥 ${streak}-day streak`);
  lines.push("https://lockle.vercel.app");

  navigator.clipboard.writeText(lines.join("\n"));
}

function todayKey() {
  return new Date().toLocaleDateString("en-CA");
}

function submittedKey(day: string, deviceId: string) {
  return `lockle_submitted_${day}_${deviceId}`;
}

function hasSubmittedToday(deviceId: string) {
  if (import.meta.env.DEV) return false;
  return localStorage.getItem(submittedKey(todayKey(), deviceId)) === "true";
}

function markSubmittedToday(deviceId: string) {
  localStorage.setItem(submittedKey(todayKey(), deviceId), "true");
}

export default function App() {
  const [showResults, setShowResults] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [results, setResults] = useState<DailyResults | null>(null);
  const [streak, setStreak] = useState<number>(getStreak);
  const [winFlash, setWinFlash] = useState(false);

  const submittedRef = useRef(false);
  const statusRef = useRef<GameState["status"]>("playing");

  type BallAnim = {
    fromPos: { x: number; y: number };
    toPos: { x: number; y: number };
    startMs: number;
    durationMs: number;
  };
  const ballAnimRef = useRef<BallAnim | null>(null);
  const [state, setState] = useState<GameState>(() =>
    parseLevel(LEVEL.layout, LEVEL.optimalMoves),
  );
  const deviceIdRef = useRef<string>(getDeviceId());

  useEffect(() => {
    statusRef.current = state.status;
  }, [state.status]);

  const [isAnimating, setIsAnimating] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);

  const animatingRef = useRef(false);
  const animationTimeoutRef = useRef<number | null>(null);
  const winFlashTimeoutRef = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const gridW = state.grid[0].length * TILE;
  const gridH = state.grid.length * TILE;
  const canvasSize = Math.ceil(Math.sqrt(gridW * gridW + gridH * gridH));

  // Resume: restore today's result if already played (prod only)
  useEffect(() => {
    if (import.meta.env.DEV) return;
    const day = todayKey();
    const cached = getCachedResult(day);
    if (cached) {
      setResults({
        day,
        dayNumber: cached.dayNumber,
        moves: cached.moves,
        optimalMoves: cached.optimalMoves,
        percentile: cached.percentile,
        distribution: cached.distribution,
        total: cached.total,
        bronze: cached.bronze,
        silver: cached.silver,
        gold: cached.gold,
      });
      setTimeout(() => setShowResults(true), 300);
    }
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const anim = ballAnimRef.current;
      let ballPos: { x: number; y: number } | undefined;
      if (anim) {
        const t = Math.min(1, (Date.now() - anim.startMs) / anim.durationMs);
        const ease = t * t; // ease-in — acceleration like gravity
        ballPos = {
          x: anim.fromPos.x + (anim.toPos.x - anim.fromPos.x) * ease,
          y: anim.fromPos.y + (anim.toPos.y - anim.fromPos.y) * ease,
        };
        if (t >= 1) ballAnimRef.current = null;
      }
      drawGame(ctx, state, ballPos);
    },
    [state],
  );

  function resetGame() {
    statusRef.current = "playing";
    animatingRef.current = false;
    submittedRef.current = false;
    ballAnimRef.current = null;

    if (animationTimeoutRef.current !== null) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    if (winFlashTimeoutRef.current !== null) {
      clearTimeout(winFlashTimeoutRef.current);
      winFlashTimeoutRef.current = null;
    }

    setRotationDeg(0);
    setIsAnimating(false);
    setWinFlash(false);
    setState(parseLevel(LEVEL.layout, LEVEL.optimalMoves));
  }

  function triggerRotate(rot: Rotation) {
    if (animatingRef.current) return;
    if (statusRef.current !== "playing") return;
    ballAnimRef.current = null; // interrupt any in-progress fall

    const deg = rot === "CW" ? 90 : -90;

    if (animationTimeoutRef.current !== null) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    animatingRef.current = true;
    setIsAnimating(true);
    setRotationDeg(deg);

    animationTimeoutRef.current = window.setTimeout(() => {
      setRotationDeg(0);

      const ballAnimCapture = {
        from: null as { x: number; y: number } | null,
        to: null as { x: number; y: number } | null,
      };
      setState((prev) => {
        if (prev.status !== "playing") return prev;

        const copy = structuredClone(prev);
        const { ballAfterRotation } = stepGame(copy, rot);
        ballAnimCapture.from = ballAfterRotation;
        ballAnimCapture.to = { ...copy.ball };

        if (
          copy.status === "won" &&
          !submittedRef.current &&
          !hasSubmittedToday(deviceIdRef.current)
        ) {
          submittedRef.current = true;

          const day = todayKey();
          const moves = copy.movesUsed;
          const optimalMoves = copy.optimalMoves;

          const dayNumber = getDayNumber();

          // Preliminary results visible during the win flash
          setResults({
            day,
            dayNumber,
            moves,
            optimalMoves,
            percentile: 0,
            distribution: [],
            total: 0,
            gold: optimalMoves,
            silver: optimalMoves + 1,
            bronze: optimalMoves + 3,
          });

          // Win flash → open modal after 700 ms
          setWinFlash(true);
          winFlashTimeoutRef.current = window.setTimeout(() => {
            setWinFlash(false);
            setShowResults(true);
          }, 700);

          // Submit + fetch stats in background
          setTimeout(async () => {
            try {
              await submitScore(day, moves);
              markSubmittedToday(deviceIdRef.current);

              const stats = await fetchDailyStats(day, moves, optimalMoves);
              const newStreak = updateStreak(day);
              setStreak(newStreak);

              const fullResult = {
                moves,
                optimalMoves,
                dayNumber,
                percentile: stats.percentile,
                distribution: stats.buckets,
                total: stats.total,
                bronze: stats.bronze,
                silver: stats.silver,
                gold: stats.gold,
              };
              cacheDayResult(day, fullResult);

              setResults({ day, ...fullResult });
            } catch (e) {
              console.error("Failed to submit score or fetch stats", e);
              submittedRef.current = false;
            }
          }, 0);
        }

        return copy;
      });

      // Kick off ball fall animation
      const { from: animFrom, to: animTo } = ballAnimCapture;
      if (animFrom && animTo) {
        const dist =
          Math.abs(animTo.y - animFrom.y) +
          Math.abs(animTo.x - animFrom.x);
        if (dist > 0) {
          ballAnimRef.current = {
            fromPos: animFrom,
            toPos: animTo,
            startMs: Date.now(),
            durationMs: Math.min(80 + dist * 50, 400),
          };
        }
      }

      animatingRef.current = false;
      setIsAnimating(false);
      animationTimeoutRef.current = null;
    }, 240);
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

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    triggerRotate(dx > 0 ? "CW" : "CCW");
  }

  return (
    <div className="appShell">
      <div className="topBar">
        <div className="brand">
          <div className="brandTitle">LOCKLE</div>
          <div className="brandSub">Dungeon Daily Puzzle</div>
        </div>

        <div className="hud">
          <div className="chip">
            <span>Day</span> {getDayNumber()}
          </div>
          <div className="chip">
            <span>Moves</span> {state.movesUsed}
          </div>
          {state.totalSwitches > 0 && (
            <div className="chip">
              <span>Gears</span>{" "}
              {state.switchesHit.size}/{state.totalSwitches}
            </div>
          )}
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
        <div
          className="cabinet"
          style={{ ["--stageSize" as any]: `${canvasSize}px` }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className={`screenFrame${winFlash ? " screenFrameWin" : ""}`}>
            <div
              className="boardRotator"
              style={{
                transform: `rotate(${rotationDeg}deg)`,
                transition: isAnimating
                  ? "transform 240ms cubic-bezier(0.4,0,0.2,1)"
                  : "none",
              }}
            >
              <GameCanvas draw={draw} width={canvasSize} height={canvasSize} />
            </div>
          </div>

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
          streak={streak}
          onClose={() => setShowResults(false)}
          onShare={() => shareResults(results, streak)}
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
