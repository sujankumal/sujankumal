"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const GRID_SIZE = 4;
const INITIAL_TILES = 2;

type Grid = number[][];

interface HistoryItem {
  grid: Grid;
  score: number;
}

const gameStyles = `
@keyframes popIn {
  0% { transform: scale(0.6); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes mergeBump {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

@keyframes floatUp {
  0% { transform: translate(-50%, 0); opacity: 1; }
  100% { transform: translate(-50%, -24px); opacity: 0; }
}

.tile-pop {
  animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.tile-merge {
  animation: mergeBump 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.score-pop {
  animation: floatUp 0.8s ease-out forwards;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
`;

function generateEmptyGrid(): Grid {
  return Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(0));
}

function getRandomEmptyCell(grid: Grid): [number, number] | undefined {
  const emptyCells: [number, number][] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === 0) {
        emptyCells.push([row, col]);
      }
    }
  }
  if (emptyCells.length === 0) return undefined;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function addRandomTile(grid: Grid): Grid {
  const newGrid = grid.map(row => [...row]); // Deep copy
  const emptyCell = getRandomEmptyCell(newGrid);
  if (emptyCell) {
    const [row, col] = emptyCell;
    newGrid[row][col] = Math.random() < 0.9 ? 2 : 4;
  }
  return newGrid;
}

function initializeGrid(): Grid {
  let grid = generateEmptyGrid();
  for (let i = 0; i < INITIAL_TILES; i++) {
    grid = addRandomTile(grid);
  }
  return grid;
}

interface SlideResult {
  row: number[];
  points: number;
}

// Helper function to slide and merge a single row (leftward)
function slideAndMergeRow(row: number[]): SlideResult {
  const nonZero = row.filter(cell => cell !== 0);
  const merged: number[] = [];
  let points = 0;
  let i = 0;
  while (i < nonZero.length) {
    if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
      const mergedValue = nonZero[i] * 2;
      merged.push(mergedValue);
      points += mergedValue;
      i += 2;
    } else {
      merged.push(nonZero[i]);
      i += 1;
    }
  }
  const paddedRow = [...merged, ...Array(GRID_SIZE - merged.length).fill(0)];
  return { row: paddedRow, points };
}

interface MoveResult {
  grid: Grid;
  points: number;
}

function moveLeft(grid: Grid): MoveResult {
  let points = 0;
  const newGrid = grid.map(row => {
    const res = slideAndMergeRow([...row]);
    points += res.points;
    return res.row;
  });
  return { grid: newGrid, points };
}

function moveRight(grid: Grid): MoveResult {
  let points = 0;
  const newGrid = grid.map(row => {
    const reversed = [...row].reverse();
    const res = slideAndMergeRow(reversed);
    points += res.points;
    return res.row.reverse();
  });
  return { grid: newGrid, points };
}

function moveUp(grid: Grid): MoveResult {
  const transposed = generateEmptyGrid();
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      transposed[col][row] = grid[row][col];
    }
  }
  let points = 0;
  const slid = transposed.map(row => {
    const res = slideAndMergeRow([...row]);
    points += res.points;
    return res.row;
  });
  const result = generateEmptyGrid();
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      result[row][col] = slid[col][row];
    }
  }
  return { grid: result, points };
}

function moveDown(grid: Grid): MoveResult {
  const transposed = generateEmptyGrid();
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      transposed[col][row] = grid[row][col];
    }
  }
  let points = 0;
  const slid = transposed.map(row => {
    const reversed = [...row].reverse();
    const res = slideAndMergeRow(reversed);
    points += res.points;
    return res.row.reverse();
  });
  const result = generateEmptyGrid();
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      result[row][col] = slid[col][row];
    }
  }
  return { grid: result, points };
}

function checkGameOver(grid: Grid): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) return false;
    }
  }
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE - 1; c++) {
      if (grid[r][c] === grid[r][c + 1]) return false;
    }
  }
  for (let r = 0; r < GRID_SIZE - 1; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === grid[r + 1][c]) return false;
    }
  }
  return true;
}

const tileIcons: { [key: number]: string } = {
  2: "🥚",
  4: "🐣",
  8: "🐤",
  16: "🐥",
  32: "🐔",
  64: "🐓",
  128: "🦃",
  256: "🦆",
  512: "🦅",
  1024: "🦉",
  2048: "🦚",
  4096: "🦜",
  8192: "🦢",
  16384: "🦩",
};

const tileColors: { [key: number]: { bg: string; text: string; shadow: string; border?: string } } = {
  2: {
    bg: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-800/40",
    text: "text-amber-900 dark:text-amber-200",
    shadow: "shadow-amber-100/10",
    border: "border-amber-200/30"
  },
  4: {
    bg: "bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-800/50 dark:to-yellow-800/30",
    text: "text-amber-950 dark:text-yellow-100",
    shadow: "shadow-amber-200/10",
    border: "border-amber-300/30"
  },
  8: {
    bg: "bg-gradient-to-br from-yellow-200 to-yellow-300 dark:from-yellow-700/60 dark:to-yellow-600/60",
    text: "text-yellow-950 dark:text-yellow-50",
    shadow: "shadow-yellow-300/20",
    border: "border-yellow-400/20"
  },
  16: {
    bg: "bg-gradient-to-br from-yellow-300 to-yellow-400 dark:from-yellow-600/70 dark:to-yellow-500/70",
    text: "text-yellow-950 dark:text-yellow-50",
    shadow: "shadow-yellow-400/20",
    border: "border-yellow-500/20"
  },
  32: {
    bg: "bg-gradient-to-br from-orange-400 to-orange-500",
    text: "text-white",
    shadow: "shadow-orange-500/30"
  },
  64: {
    bg: "bg-gradient-to-br from-orange-500 to-red-500",
    text: "text-white",
    shadow: "shadow-red-500/30"
  },
  128: {
    bg: "bg-gradient-to-br from-red-500 to-rose-500",
    text: "text-white",
    shadow: "shadow-rose-500/40"
  },
  256: {
    bg: "bg-gradient-to-br from-teal-400 to-emerald-500",
    text: "text-white",
    shadow: "shadow-teal-500/40"
  },
  512: {
    bg: "bg-gradient-to-br from-cyan-400 to-blue-500",
    text: "text-white",
    shadow: "shadow-blue-500/40"
  },
  1024: {
    bg: "bg-gradient-to-br from-indigo-500 to-violet-600",
    text: "text-white",
    shadow: "shadow-indigo-600/40"
  },
  2048: {
    bg: "bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500",
    text: "text-white",
    shadow: "shadow-purple-500/50",
    border: "border-yellow-400 border-2"
  },
  4096: {
    bg: "bg-gradient-to-br from-rose-600 to-pink-700",
    text: "text-white",
    shadow: "shadow-rose-700/50"
  },
  8192: {
    bg: "bg-gradient-to-br from-purple-600 to-indigo-700",
    text: "text-white",
    shadow: "shadow-purple-700/50"
  },
  16384: {
    bg: "bg-gradient-to-br from-fuchsia-600 to-pink-800",
    text: "text-white",
    shadow: "shadow-fuchsia-800/50"
  }
};

export default function Game2048() {
  const [isMounted, setIsMounted] = useState(false);
  const [grid, setGrid] = useState<Grid>(generateEmptyGrid());
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [step, setStep] = useState<number>(0);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [won, setWon] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [stopped, setStopped] = useState<boolean>(true); // Start with overlay
  const [pointsEarned, setPointsEarned] = useState<number>(0);
  const [showScorePopup, setShowScorePopup] = useState<boolean>(false);

  const gameRef = useRef<HTMLDivElement>(null);

  // Initialize and load state client-side
  useEffect(() => {
    setIsMounted(true);
    const savedGrid = localStorage.getItem("2048_grid");
    const savedScore = localStorage.getItem("2048_score");
    const savedBestScore = localStorage.getItem("2048_bestScore");
    const savedHistory = localStorage.getItem("2048_history");
    const savedStep = localStorage.getItem("2048_step");
    const savedWon = localStorage.getItem("2048_won");
    const savedGameOver = localStorage.getItem("2048_gameOver");

    if (savedGrid) {
      setGrid(JSON.parse(savedGrid));
    } else {
      setGrid(initializeGrid());
    }

    if (savedScore) setScore(parseInt(savedScore, 10));
    if (savedBestScore) setBestScore(parseInt(savedBestScore, 10));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedStep) setStep(parseInt(savedStep, 10));
    if (savedWon) setWon(JSON.parse(savedWon));
    if (savedGameOver) setGameOver(JSON.parse(savedGameOver));
  }, []);

  // Save states to localStorage when they change
  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem("2048_grid", JSON.stringify(grid));
    localStorage.setItem("2048_score", score.toString());
    localStorage.setItem("2048_bestScore", bestScore.toString());
    localStorage.setItem("2048_history", JSON.stringify(history));
    localStorage.setItem("2048_step", step.toString());
    localStorage.setItem("2048_won", JSON.stringify(won));
    localStorage.setItem("2048_gameOver", JSON.stringify(gameOver));
  }, [grid, score, bestScore, history, step, won, gameOver, isMounted]);

  // Touch move prevent default scroll
  useEffect(() => {
    const el = gameRef.current;
    if (!el) return;
    const prevent = (e: TouchEvent) => {
      if (!stopped && !won && !gameOver) {
        e.preventDefault();
      }
    };
    el.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      el.removeEventListener("touchmove", prevent);
    };
  }, [gameRef, stopped, won, gameOver]);

  const triggerScorePopup = useCallback((points: number) => {
    if (points <= 0) return;
    setPointsEarned(points);
    setShowScorePopup(true);
  }, []);

  // Score pop timer reset
  useEffect(() => {
    if (showScorePopup) {
      const timer = setTimeout(() => setShowScorePopup(false), 800);
      return () => clearTimeout(timer);
    }
  }, [showScorePopup]);

  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (stopped || won || gameOver) return;

    let result: MoveResult;
    switch (direction) {
      case 'up':
        result = moveUp(grid);
        break;
      case 'down':
        result = moveDown(grid);
        break;
      case 'left':
        result = moveLeft(grid);
        break;
      case 'right':
        result = moveRight(grid);
        break;
    }

    const { grid: newGrid, points } = result;
    const moved = JSON.stringify(newGrid) !== JSON.stringify(grid);

    if (moved) {
      // 1. Record history
      setHistory(prev => [...prev, { grid, score }]);

      // 2. Add new tile
      const nextGrid = addRandomTile(newGrid);
      setGrid(nextGrid);
      setStep(prev => prev + 1);

      // 3. Update score & best score
      setScore(prev => {
        const nextScore = prev + points;
        setBestScore(best => (nextScore > best ? nextScore : best));
        return nextScore;
      });
      triggerScorePopup(points);

      // 4. Check for 2048 tile win
      if (nextGrid.flat().includes(2048)) {
        setWon(true);
      }

      // 5. Check if no moves possible on new grid
      if (checkGameOver(nextGrid)) {
        setGameOver(true);
      }
    }
  }, [stopped, won, gameOver, grid, score, bestScore, triggerScorePopup]);

  // Keyboard events listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault(); // Prevent page scroll
      }
      switch (event.key) {
        case 'ArrowUp':
          handleMove('up');
          break;
        case 'ArrowDown':
          handleMove('down');
          break;
        case 'ArrowLeft':
          handleMove('left');
          break;
        case 'ArrowRight':
          handleMove('right');
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStart) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) handleMove('right');
      else if (dx < -30) handleMove('left');
    } else {
      if (dy > 30) handleMove('down');
      else if (dy < -30) handleMove('up');
    }
    setTouchStart(null);
  };

  // Mouse drag handlers
  const [mouseStart, setMouseStart] = useState<{ x: number; y: number } | null>(null);
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setMouseStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mouseStart) return;
    const dx = e.clientX - mouseStart.x;
    const dy = e.clientY - mouseStart.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) handleMove('right');
      else if (dx < -30) handleMove('left');
    } else {
      if (dy > 30) handleMove('down');
      else if (dy < -30) handleMove('up');
    }
    setMouseStart(null);
  };

  const resetGame = () => {
    const initial = initializeGrid();
    setGrid(initial);
    setScore(0);
    setHistory([]);
    setStep(0);
    setWon(false);
    setGameOver(false);
    setStopped(false);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setGrid(lastState.grid);
    setScore(lastState.score);
    setHistory(history.slice(0, -1));
    setStep(prev => Math.max(0, prev - 1));
    setGameOver(false);
  };

  const goToHistory = (idx: number) => {
    if (idx < 0 || idx >= history.length) return;
    const targetState = history[idx];
    setGrid(targetState.grid);
    setScore(targetState.score);
    setHistory(history.slice(0, idx));
    setStep(idx);
    setGameOver(false);
  };

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-bold tracking-wider font-mono">LOADING EGG TO CHICKEN...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start max-w-md mx-auto px-4 select-none">
      <style>{gameStyles}</style>

      {/* Header Panel */}
      <div className="text-center mt-6 mb-4">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-md">
          Egg to Chicken
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-1 tracking-wider uppercase">
          An Evolving 2048 Puzzle
        </p>
      </div>

      {/* Dashboard Stats */}
      <div className="w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 shadow-xl mb-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl py-2 px-3 text-center relative shadow-inner">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Score</span>
            <span className="text-2xl font-extrabold text-amber-400 font-mono leading-none mt-1 block">{score}</span>
            {showScorePopup && (
              <span className="score-pop absolute left-1/2 bottom-8 text-sm font-extrabold text-emerald-400 font-mono">
                +{pointsEarned}
              </span>
            )}
          </div>
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl py-2 px-3 text-center shadow-inner">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Best Score</span>
            <span className="text-2xl font-extrabold text-yellow-500 font-mono leading-none mt-1 block">{bestScore}</span>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex justify-between items-center gap-2">
          <button
            onClick={resetGame}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-2 px-3 rounded-xl shadow-md active:scale-95 transition-all duration-150 text-xs flex items-center justify-center gap-1.5 border border-orange-400/20 cursor-pointer"
          >
            <span>🔄</span> New Game
          </button>
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className={`flex-1 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border active:scale-95 transition-all duration-150 cursor-pointer ${history.length === 0
              ? "bg-slate-900/20 border-slate-900/40 text-slate-600 cursor-not-allowed"
              : "bg-slate-800/80 border-slate-700/50 hover:bg-slate-800 text-slate-200 hover:text-white"
              }`}
          >
            <span>↩️</span> Undo ({history.length})
          </button>
        </div>
      </div>

      {/* Evolution Roadmap */}
      <div className="w-full bg-slate-900/30 border border-slate-800/60 rounded-2xl p-3 shadow-md mb-4">
        <h3 className="text-[10px] font-bold text-slate-800 mb-2 text-left uppercase tracking-wider flex items-center gap-1">
          <span>🐓</span> Evolution Roadmap (Active Glows)
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
          {Object.entries(tileIcons).map(([valueStr, icon]) => {
            const val = parseInt(valueStr, 10);
            const isCurrent = grid.flat().includes(val);
            return (
              <div
                key={val}
                className={`flex-shrink-0 snap-start flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-300 w-12 ${isCurrent
                  ? "bg-amber-500/10 border-slate-500 text-white shadow-sm shadow-amber-500/10"
                  : "bg-slate-800/20 border-slate-800/20 text-black-300"
                  }`}
              >
                <span className="text-xl mb-0.5">{icon}</span>
                <span className="text-[8px] font-extrabold font-mono">{val}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Container */}
      <div className="relative w-full aspect-square p-2 bg-slate-950/90 border border-slate-900 rounded-3xl shadow-2xl mb-4 touch-none">

        {/* Actual Grid Board */}
        <div
          ref={gameRef}
          onWheel={e => e.preventDefault()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className="grid grid-cols-4 gap-2 h-full w-full relative"
        >
          {grid.flat().map((cell, idx) => {
            const colorConfig = tileColors[cell] || { bg: "bg-slate-800/40", text: "text-slate-500", shadow: "" };
            const isEmpty = cell === 0;
            const tileKey = `${idx}-${cell}`;
            const animClass = isEmpty ? "" : (cell > 4 ? "tile-merge" : "tile-pop");

            return (
              <div
                key={tileKey}
                className={`aspect-square flex flex-col items-center justify-center rounded-xl font-bold shadow-sm border border-slate-800/30 transition-all duration-300 relative select-none ${colorConfig.bg} ${colorConfig.text} ${colorConfig.shadow} ${colorConfig.border || ""} ${animClass}`}
              >
                {!isEmpty && (
                  <>
                    <span className="text-3xl sm:text-4xl transform hover:scale-105 transition-transform duration-150">
                      {tileIcons[cell] || cell}
                    </span>
                    <span className="absolute bottom-1 right-1.5 text-[8px] sm:text-[9px] opacity-70 font-mono font-medium leading-none">
                      {cell}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* StartOverlay */}
        {stopped && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm rounded-3xl z-20 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-5xl mb-3 animate-bounce">🥚</span>
            <h2 className="text-xl font-black text-amber-400 mb-1.5 uppercase tracking-wider">Start Evolving</h2>
            <p className="text-xs text-slate-400 max-w-[240px] mb-5 leading-normal">
              Combine stage tiles to grow your animal grid from egg to majestic chicken and beyond!
            </p>
            <button
              onClick={() => setStopped(false)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold py-2.5 px-6 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all duration-150 text-sm cursor-pointer"
            >
              Start Game
            </button>
          </div>
        )}

        {/* Won Overlay */}
        {won && (
          <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-sm rounded-3xl z-20 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-5xl mb-3 animate-bounce">🦚</span>
            <h2 className="text-xl font-black text-emerald-400 mb-1.5 uppercase tracking-wider">Victory Reached!</h2>
            <p className="text-xs text-emerald-200 max-w-[240px] mb-5 leading-normal">
              Congratulations! You evolved the ultimate peacock (2048) tile!
            </p>
            <div className="flex gap-2 w-full max-w-[240px]">
              <button
                onClick={() => setWon(false)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs cursor-pointer"
              >
                Keep Going
              </button>
              <button
                onClick={resetGame}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 px-3 rounded-lg text-xs border border-slate-700/50 cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-rose-950/90 backdrop-blur-sm rounded-3xl z-20 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-5xl mb-3 animate-pulse">🍗</span>
            <h2 className="text-xl font-black text-rose-400 mb-1.5 uppercase tracking-wider">Game Over</h2>
            <p className="text-xs text-rose-200 max-w-[240px] mb-5 leading-normal">
              No more grid spaces or merges are left to slide.
            </p>
            <div className="flex gap-2 w-full max-w-[240px]">
              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 font-bold py-2 px-3 rounded-lg text-xs border border-slate-700/50 cursor-pointer"
              >
                Undo Move
              </button>
              <button
                onClick={resetGame}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-md cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History Steps Panel */}
      <div className="w-full bg-slate-900/20 border border-slate-800/40 rounded-2xl p-4 mb-8">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Moves Tracker</span>
          <span className="text-xs font-extrabold text-slate-300 font-mono bg-slate-900/60 border border-slate-800 rounded-lg px-2 py-0.5">
            Total Steps: {step}
          </span>
        </div>
        <ul className="space-y-1 max-h-36 overflow-y-auto scrollbar-hide border-t border-slate-800/50 pt-2 text-left">
          {history.length === 0 ? (
            <li className="text-[11px] text-slate-600 text-center py-4 italic font-medium">
              No moves made yet. Evolve a tile to start tracking steps.
            </li>
          ) : (
            history.map((_, idx) => (
              <li key={idx} className="flex items-center justify-between py-1 border-b border-slate-900/30 last:border-0">
                <span className="text-[10px] font-bold text-slate-500 font-mono">Move #{idx + 1}</span>
                <button
                  onClick={() => goToHistory(idx)}
                  className="text-[10px] text-amber-500 hover:text-amber-400 font-semibold px-2 py-0.5 bg-slate-950/60 border border-slate-800/80 rounded-md hover:bg-slate-950 transition-colors duration-150 cursor-pointer"
                >
                  Rewind Here
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
