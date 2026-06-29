"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Types
export interface Tile {
  id: string;
  value: number;
  isNew?: boolean;
  isMerged?: boolean;
}

export type Grid = (Tile | null)[][];

export interface HistoryItem {
  grid: Grid;
  score: number;
  bestScore: number;
  step: number;
  won: boolean;
  gameOver: boolean;
  wonDeclared: boolean;
}

// Evolution Stages Metadata
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

const gameStyles = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

.game-container {
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

@keyframes popIn {
  0% { transform: scale(0.6); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes mergeBump {
  0% { transform: scale(0.9); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

@keyframes floatUp {
  0% { transform: translate(-50%, 0); opacity: 1; }
  100% { transform: translate(-50%, -30px); opacity: 0; }
}

.tile-pop {
  animation: popIn 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.tile-merge {
  animation: mergeBump 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
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

// Helper: check if two boards are identical (comparing IDs and values)
function boardsEqual(a: Grid, b: Grid): boolean {
  if (a.length !== b.length) return false;
  for (let r = 0; r < a.length; r++) {
    if (a[r].length !== b[r].length) return false;
    for (let c = 0; c < a[r].length; c++) {
      const ta = a[r][c];
      const tb = b[r][c];
      if (!ta && !tb) continue;
      if (!ta || !tb) return false;
      if (ta.id !== tb.id || ta.value !== tb.value) return false;
    }
  }
  return true;
}

// Helper: transpose grid
function transpose(grid: Grid): Grid {
  const size = grid.length;
  const result: Grid = Array.from({ length: size }, () => Array(size).fill(null));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      result[c][r] = grid[r][c];
    }
  }
  return result;
}

// Helper: slide and merge a single row
function slideAndMergeRow(row: (Tile | null)[], size: number): { newRow: (Tile | null)[]; points: number } {
  // Filter out nulls
  const nonNull = row.filter((tile): tile is Tile => tile !== null);
  const newRow: (Tile | null)[] = [];
  let points = 0;

  for (let i = 0; i < nonNull.length; i++) {
    if (i + 1 < nonNull.length && nonNull[i].value === nonNull[i + 1].value) {
      // Merge
      const val = nonNull[i].value * 2;
      points += val;
      const mergedId = `tile-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
      newRow.push({
        id: mergedId,
        value: val,
        isMerged: true,
        isNew: false,
      });
      i++; // Skip the next tile because it merged
    } else {
      // Keep tile but reset anim states
      newRow.push({
        id: nonNull[i].id,
        value: nonNull[i].value,
        isMerged: false,
        isNew: false,
      });
    }
  }

  // Pad with nulls to match the board size
  while (newRow.length < size) {
    newRow.push(null);
  }

  return { newRow, points };
}

// Helper: perform move on board
function performMove(grid: Grid, direction: 'up' | 'down' | 'left' | 'right'): { grid: Grid; points: number } {
  const size = grid.length;
  let points = 0;
  let newGrid: Grid = [];

  if (direction === 'left') {
    for (let r = 0; r < size; r++) {
      const res = slideAndMergeRow(grid[r], size);
      newGrid.push(res.newRow);
      points += res.points;
    }
  } else if (direction === 'right') {
    for (let r = 0; r < size; r++) {
      const reversed = [...grid[r]].reverse();
      const res = slideAndMergeRow(reversed, size);
      newGrid.push(res.newRow.reverse());
      points += res.points;
    }
  } else if (direction === 'up') {
    const transposed = transpose(grid);
    const tempGrid: Grid = [];
    for (let r = 0; r < size; r++) {
      const res = slideAndMergeRow(transposed[r], size);
      tempGrid.push(res.newRow);
      points += res.points;
    }
    newGrid = transpose(tempGrid);
  } else if (direction === 'down') {
    const transposed = transpose(grid);
    const tempGrid: Grid = [];
    for (let r = 0; r < size; r++) {
      const reversed = [...transposed[r]].reverse();
      const res = slideAndMergeRow(reversed, size);
      tempGrid.push(res.newRow.reverse());
      points += res.points;
    }
    newGrid = transpose(tempGrid);
  }

  return { grid: newGrid, points };
}

// Helper: check if game is over
function checkGameOver(grid: Grid): boolean {
  const size = grid.length;
  // 1. If any cell is empty, it's not game over
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === null) return false;
    }
  }
  // 2. Check horizontal merges
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 1; c++) {
      const current = grid[r][c];
      const next = grid[r][c + 1];
      if (current && next && current.value === next.value) return false;
    }
  }
  // 3. Check vertical merges
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size; c++) {
      const current = grid[r][c];
      const next = grid[r + 1][c];
      if (current && next && current.value === next.value) return false;
    }
  }
  return true;
}

// Helper: add random tile (2 or 4) to empty spot
function addRandomTile(grid: Grid): Grid {
  const size = grid.length;
  const emptyCells: [number, number][] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === null) {
        emptyCells.push([r, c]);
      }
    }
  }
  if (emptyCells.length === 0) return grid;

  const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newGrid = grid.map(r => [...r]);
  const newId = `tile-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
  const newValue = Math.random() < 0.9 ? 2 : 4;
  
  newGrid[row][col] = {
    id: newId,
    value: newValue,
    isNew: true,
    isMerged: false,
  };
  return newGrid;
}

// Helper: initialize dynamic empty grid with two tiles
function initializeGrid(size: number): Grid {
  let grid: Grid = Array.from({ length: size }, () => Array(size).fill(null));
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  return grid;
}

// Helper: parse and validate saved grid schemas
function parseSavedGrid(savedStr: string, size: number): Grid | null {
  try {
    const parsed = JSON.parse(savedStr);
    if (!Array.isArray(parsed) || parsed.length !== size) return null;
    for (let r = 0; r < size; r++) {
      if (!Array.isArray(parsed[r]) || parsed[r].length !== size) return null;
      for (let c = 0; c < size; c++) {
        const item = parsed[r][c];
        if (item !== null && (typeof item !== "object" || typeof item.id !== "string" || typeof item.value !== "number")) {
          return null; // schema outdated or corrupt
        }
      }
    }
    return parsed as Grid;
  } catch {
    return null;
  }
}

export default function Game2048() {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [boardSize, setBoardSize] = useState<number>(4);
  const [grid, setGrid] = useState<Grid>(() => Array.from({ length: 4 }, () => Array(4).fill(null)));
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [step, setStep] = useState<number>(0);
  const [won, setWon] = useState<boolean>(false);
  const [wonDeclared, setWonDeclared] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [stopped, setStopped] = useState<boolean>(true); // start showing board size selection screen
  
  const [pointsEarned, setPointsEarned] = useState<number>(0);
  const [showScorePopup, setShowScorePopup] = useState<boolean>(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [mouseStart, setMouseStart] = useState<{ x: number; y: number } | null>(null);

  // Custom Confirmation Dialog state for changing modes during active games
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [pendingSize, setPendingSize] = useState<number | null>(null);

  const gameRef = useRef<HTMLDivElement>(null);

  // Load state client-side
  useEffect(() => {
    setIsMounted(true);
    
    const savedSizeStr = localStorage.getItem("2048_boardSize");
    const savedGridStr = localStorage.getItem("2048_grid");
    const savedScoreStr = localStorage.getItem("2048_score");
    const savedBestScoreStr = localStorage.getItem("2048_bestScore");
    const savedHistoryStr = localStorage.getItem("2048_history");
    const savedStepStr = localStorage.getItem("2048_step");
    const savedWonStr = localStorage.getItem("2048_won");
    const savedWonDeclaredStr = localStorage.getItem("2048_wonDeclared");
    const savedGameOverStr = localStorage.getItem("2048_gameOver");

    let size = 4;
    if (savedSizeStr) {
      const parsedSize = parseInt(savedSizeStr, 10);
      if (parsedSize === 4 || parsedSize === 5 || parsedSize === 6) {
        size = parsedSize;
      }
    }
    setBoardSize(size);

    if (savedGridStr) {
      const parsedGrid = parseSavedGrid(savedGridStr, size);
      if (parsedGrid) {
        setGrid(parsedGrid);
        setStopped(false); // resume existing game
      } else {
        setGrid(initializeGrid(size));
        setStopped(true);
      }
    } else {
      setGrid(initializeGrid(size));
      setStopped(true);
    }

    if (savedScoreStr) setScore(parseInt(savedScoreStr, 10));
    if (savedBestScoreStr) setBestScore(parseInt(savedBestScoreStr, 10));
    if (savedStepStr) setStep(parseInt(savedStepStr, 10));
    if (savedWonStr) setWon(JSON.parse(savedWonStr));
    if (savedWonDeclaredStr) setWonDeclared(JSON.parse(savedWonDeclaredStr));
    if (savedGameOverStr) setGameOver(JSON.parse(savedGameOverStr));

    if (savedHistoryStr) {
      try {
        const parsedHistory = JSON.parse(savedHistoryStr);
        if (Array.isArray(parsedHistory)) {
          setHistory(parsedHistory);
        }
      } catch {}
    }
  }, []);

  // Save states to localStorage when they change
  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem("2048_boardSize", boardSize.toString());
    localStorage.setItem("2048_grid", JSON.stringify(grid));
    localStorage.setItem("2048_score", score.toString());
    localStorage.setItem("2048_bestScore", bestScore.toString());
    localStorage.setItem("2048_history", JSON.stringify(history));
    localStorage.setItem("2048_step", step.toString());
    localStorage.setItem("2048_won", JSON.stringify(won));
    localStorage.setItem("2048_wonDeclared", JSON.stringify(wonDeclared));
    localStorage.setItem("2048_gameOver", JSON.stringify(gameOver));
  }, [boardSize, grid, score, bestScore, history, step, won, wonDeclared, gameOver, isMounted]);

  // Touch move prevent default scroll
  useEffect(() => {
    const el = gameRef.current;
    if (!el) return;
    const prevent = (e: TouchEvent) => {
      if (!stopped && !won && !gameOver && !showResetConfirm) {
        e.preventDefault();
      }
    };
    el.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      el.removeEventListener("touchmove", prevent);
    };
  }, [gameRef, stopped, won, gameOver, showResetConfirm]);

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

  // Primary Move Executer
  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (stopped || won || gameOver || showResetConfirm) return;

    const { grid: nextGridAfterMove, points } = performMove(grid, direction);
    const moved = !boardsEqual(grid, nextGridAfterMove);

    if (moved) {
      // 1. Record complete history state (deep copy of current state before move)
      const stateSnapshot: HistoryItem = {
        grid: grid.map(r => r.map(tile => tile ? { ...tile } : null)),
        score,
        bestScore,
        step,
        won,
        gameOver,
        wonDeclared,
      };
      
      const newHistory = [...history, stateSnapshot];
      setHistory(newHistory);

      // 2. Add new tile
      const nextGrid = addRandomTile(nextGridAfterMove);
      setGrid(nextGrid);
      
      const nextStep = step + 1;
      setStep(nextStep);

      // 3. Update score & best score
      const nextScore = score + points;
      setScore(nextScore);
      const nextBestScore = nextScore > bestScore ? nextScore : bestScore;
      setBestScore(nextBestScore);
      triggerScorePopup(points);

      // 4. Check for 2048 tile win (only if not already declared)
      const has2048 = nextGrid.flat().some(tile => tile !== null && tile.value === 2048);
      if (has2048 && !wonDeclared) {
        setWon(true);
        setWonDeclared(true);
      }

      // 5. Check if no moves possible on new grid
      const isOver = checkGameOver(nextGrid);
      if (isOver) {
        setGameOver(true);
      }
    }
  }, [grid, score, bestScore, step, won, wonDeclared, gameOver, history, stopped, showResetConfirm, triggerScorePopup]);

  // Keyboard events listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault(); // Prevent page scroll
      }
      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          handleMove('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          handleMove('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          handleMove('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
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

  // Select board size with confirmation warning if mid-game
  const handleSelectBoardSize = (newSize: number) => {
    if (newSize === boardSize) return;

    const gameInProgress = score > 0 && !gameOver;
    if (gameInProgress) {
      setPendingSize(newSize);
      setShowResetConfirm(true);
    } else {
      setBoardSize(newSize);
      const initial = initializeGrid(newSize);
      setGrid(initial);
      setScore(0);
      setHistory([]);
      setStep(0);
      setWon(false);
      setWonDeclared(false);
      setGameOver(false);
      setStopped(false);
    }
  };

  const confirmSizeChange = () => {
    if (pendingSize) {
      setBoardSize(pendingSize);
      const initial = initializeGrid(pendingSize);
      setGrid(initial);
      setScore(0);
      setHistory([]);
      setStep(0);
      setWon(false);
      setWonDeclared(false);
      setGameOver(false);
      setStopped(false);
      setPendingSize(null);
    }
    setShowResetConfirm(false);
  };

  const cancelSizeChange = () => {
    setPendingSize(null);
    setShowResetConfirm(false);
  };

  const resetGame = () => {
    const initial = initializeGrid(boardSize);
    setGrid(initial);
    setScore(0);
    setHistory([]);
    setStep(0);
    setWon(false);
    setWonDeclared(false);
    setGameOver(false);
    setStopped(false);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setGrid(lastState.grid);
    setScore(lastState.score);
    setBestScore(lastState.bestScore);
    setStep(lastState.step);
    setWon(lastState.won);
    setGameOver(lastState.gameOver);
    setWonDeclared(lastState.wonDeclared);
    setHistory(history.slice(0, -1));
  };

  const goToHistory = (idx: number) => {
    if (idx < 0 || idx >= history.length) return;
    const targetState = history[idx];
    setGrid(targetState.grid);
    setScore(targetState.score);
    setBestScore(targetState.bestScore);
    setStep(targetState.step);
    setWon(targetState.won);
    setGameOver(targetState.gameOver);
    setWonDeclared(targetState.wonDeclared);
    // Discard future history cleanly
    setHistory(history.slice(0, idx));
  };

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 font-mono">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-bold tracking-wider">LOADING EGG TO CHICKEN...</span>
      </div>
    );
  }

  // Dynamic board size styles computation
  let gapClass = "gap-2";
  let roundedClass = "rounded-xl";
  let emojiFontSize = "text-3xl sm:text-4xl";
  let labelFontSize = "text-[9px] sm:text-[10px]";

  if (boardSize === 4) {
    gapClass = "gap-2";
    roundedClass = "rounded-xl";
    emojiFontSize = "text-3xl sm:text-4xl";
    labelFontSize = "text-[9px] sm:text-[10px]";
  } else if (boardSize === 5) {
    gapClass = "gap-1.5";
    roundedClass = "rounded-lg";
    emojiFontSize = "text-2xl sm:text-3xl";
    labelFontSize = "text-[8px] sm:text-[9px]";
  } else if (boardSize === 6) {
    gapClass = "gap-1";
    roundedClass = "rounded-md";
    emojiFontSize = "text-xl sm:text-2xl";
    labelFontSize = "text-[6px] sm:text-[7px]";
  }

  return (
    <div className="game-container flex flex-col items-center justify-start max-w-md mx-auto px-4 select-none min-h-screen text-slate-200">
      <style>{gameStyles}</style>

      {/* Header Panel */}
      <div className="text-center mt-6 mb-4">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-md">
          Egg to Chicken
        </h1>
        <p className="text-xs text-slate-400 font-semibold mt-1 tracking-wider uppercase">
          An Evolving 2048 Puzzle
        </p>
      </div>

      {/* Mode Select Tabs */}
      <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-1 mb-4 flex gap-1 shadow-inner relative">
        <button
          onClick={() => handleSelectBoardSize(4)}
          className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
            boardSize === 4
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md scale-[1.02]"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          Classic (4x4)
        </button>
        <button
          onClick={() => handleSelectBoardSize(5)}
          className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
            boardSize === 5
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md scale-[1.02]"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          Adventure (5x5)
        </button>
        <button
          onClick={() => handleSelectBoardSize(6)}
          className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
            boardSize === 6
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md scale-[1.02]"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          Marathon (6x6)
        </button>
      </div>

      {/* Dashboard Stats */}
      <div className="w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 shadow-xl mb-4 flex flex-col gap-3 backdrop-blur-md">
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
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-extrabold py-2 px-3 rounded-xl shadow-md active:scale-95 transition-all duration-150 text-xs flex items-center justify-center gap-1.5 border border-orange-400/20 cursor-pointer"
          >
            <span>🔄</span> New Game
          </button>
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className={`flex-1 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border active:scale-95 transition-all duration-150 cursor-pointer ${
              history.length === 0
                ? "bg-slate-900/20 border-slate-900/40 text-slate-600 cursor-not-allowed"
                : "bg-slate-800/80 border-slate-700/50 hover:bg-slate-800 text-slate-200 hover:text-white"
            }`}
          >
            <span>↩️</span> Undo ({history.length})
          </button>
        </div>
      </div>

      {/* Evolution Roadmap */}
      <div className="w-full bg-slate-900/30 border border-slate-800/60 rounded-2xl p-3 shadow-md mb-4 backdrop-blur-sm">
        <h3 className="text-[10px] font-bold text-slate-400 mb-2 text-left uppercase tracking-wider flex items-center gap-1">
          <span>🐓</span> Evolution Roadmap (Active Glows)
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-hide snap-x">
          {Object.entries(tileIcons).map(([valueStr, icon]) => {
            const val = parseInt(valueStr, 10);
            const isCurrent = grid.flat().some(tile => tile !== null && tile.value === val);
            return (
              <div
                key={val}
                className={`flex-shrink-0 snap-start flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-300 w-12 ${
                  isCurrent
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/10"
                    : "bg-slate-850/40 border-slate-800/80 text-slate-600"
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
          className={`grid h-full w-full relative ${gapClass}`}
          style={{
            gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`
          }}
        >
          {grid.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const isEmpty = cell === null;
              if (isEmpty) {
                return (
                  <div
                    key={`empty-${rIdx}-${cIdx}`}
                    className={`aspect-square bg-slate-900/20 border border-slate-900/60 ${roundedClass} shadow-inner`}
                  />
                );
              }

              const colorConfig = tileColors[cell.value] || {
                bg: "bg-gradient-to-br from-slate-700 to-slate-800",
                text: "text-slate-200",
                shadow: "shadow-slate-800/30",
              };

              const animClass = cell.isMerged
                ? "tile-merge"
                : cell.isNew
                ? "tile-pop"
                : "";

              return (
                <div
                  key={cell.id}
                  className={`aspect-square flex flex-col items-center justify-center font-bold border transition-all duration-150 relative select-none ${roundedClass} ${colorConfig.bg} ${colorConfig.text} ${colorConfig.shadow} ${colorConfig.border || "border-slate-800/40"} ${animClass}`}
                >
                  <span className={`${emojiFontSize} transform hover:scale-105 transition-transform duration-150`}>
                    {tileIcons[cell.value] || cell.value}
                  </span>
                  <span className={`absolute bottom-1 right-1.5 opacity-70 font-mono font-bold leading-none ${labelFontSize}`}>
                    {cell.value}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Start Overlay */}
        {stopped && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm rounded-3xl z-20 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-5xl mb-3 animate-bounce">🥚</span>
            <h2 className="text-xl font-black text-amber-400 mb-1.5 uppercase tracking-wider">Start Evolving</h2>
            <p className="text-xs text-slate-400 max-w-[240px] mb-5 leading-normal">
              Combine stage tiles to grow your animal grid from egg to majestic chicken and beyond!
            </p>
            <div className="flex flex-col gap-2 w-full max-w-[220px]">
              <button
                onClick={() => handleSelectBoardSize(4)}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-extrabold py-2 px-4 rounded-xl shadow-lg active:scale-95 transition-all duration-150 text-xs cursor-pointer"
              >
                Classic 4x4 Mode
              </button>
              <button
                onClick={() => handleSelectBoardSize(5)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold py-2 px-4 rounded-xl shadow-lg active:scale-95 transition-all duration-150 text-xs cursor-pointer"
              >
                Adventure 5x5 Mode
              </button>
              <button
                onClick={() => handleSelectBoardSize(6)}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-slate-950 font-extrabold py-2 px-4 rounded-xl shadow-lg active:scale-95 transition-all duration-150 text-xs cursor-pointer"
              >
                Marathon 6x6 Mode
              </button>
            </div>
          </div>
        )}

        {/* Custom Reset Confirmation Modal overlay */}
        {showResetConfirm && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm rounded-3xl z-30 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-5xl mb-3">⚠️</span>
            <h2 className="text-lg font-black text-amber-500 mb-1.5 uppercase tracking-wider">Reset Progress?</h2>
            <p className="text-xs text-slate-400 max-w-[240px] mb-5 leading-normal">
              Changing your board mode will abandon your active game and reset the current score.
            </p>
            <div className="flex gap-2 w-full max-w-[240px]">
              <button
                onClick={confirmSizeChange}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg text-xs cursor-pointer"
              >
                Reset & Change
              </button>
              <button
                onClick={cancelSizeChange}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 px-3 rounded-lg text-xs border border-slate-700/50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Victory/Won Overlay */}
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
      <div className="w-full bg-slate-900/20 border border-slate-800/40 rounded-2xl p-4 mb-8 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Moves Tracker</span>
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
