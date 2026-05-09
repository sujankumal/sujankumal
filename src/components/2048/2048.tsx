"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: `repeat(${4}, 60px)`,
        gap: "2px",
        justifyContent: "center",
        margin: "10px auto",
    },
    row: {
        display: "flex",
    },
    cell: {
        width: "60px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgb(31 41 55)", // Tailwind's bg-gray-800
        fontSize: "24px",
        fontWeight: "bold",
        borderRadius: "5px",
    },
    history: {
        marginTop: "20px",
    },
    pastGrid: {
        marginBottom: "10px",
        display: "grid",
        gridTemplateColumns: `repeat(${4}, 20px)`,
        gap: "5px",
        justifyContent: "center",
    },
};

const GRID_SIZE = 4;
const INITIAL_TILES = 2;

type Grid = number[][];

function generateEmptyGrid(): Grid {
  return Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(0));
}

function getRandomEmptyCell(grid: Grid): [number, number] {
  const emptyCells: [number, number][] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === 0) {
        emptyCells.push([row, col]);
      }
    }
  }
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function addRandomTile(grid: Grid): Grid {
  const newGrid = grid.map(row => [...row]); // Deep copy
  const [row, col] = getRandomEmptyCell(newGrid);
  newGrid[row][col] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
}

function initializeGrid(): Grid {
  let grid = generateEmptyGrid();
  for (let i = 0; i < INITIAL_TILES; i++) {
    grid = addRandomTile(grid);
  }
  return grid;
}

// Helper function to slide and merge a single row (leftward)
function slideAndMergeRow(row: number[]): number[] {
  // Step 1: Filter out zeros and keep non-zero tiles
  const nonZero = row.filter(cell => cell !== 0);

  // Step 2: Merge adjacent equal tiles
  const merged: number[] = [];
  let i = 0;
  while (i < nonZero.length) {
    if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
      // Merge: double the value, skip the next tile
      merged.push(nonZero[i] * 2);
      i += 2;
    } else {
      // No merge, keep the tile
      merged.push(nonZero[i]);
      i += 1;
    }
  }

  // Step 3: Pad with zeros to maintain length
  return [...merged, ...Array(GRID_SIZE - merged.length).fill(0)];
}

const tileIcons: { [key: number]: React.ReactNode } = {
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

export default function Game2048() {
  const [grid, setGrid] = useState<Grid>(generateEmptyGrid());
  const [history, setHistory] = useState<Grid[]>([]);
  const [step, setStep] = useState<number>(0);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [won, setWon] = useState<boolean>(false);
  const [stopped, setStopped] = useState<boolean>(true); // Start with overlay
  const gameRef = useRef<HTMLDivElement>(null);

  // Initialize grid client-side
  useEffect(() => {
    if (grid.every(row => row.every(cell => cell === 0))) {
      setGrid(initializeGrid());
    }
  }, [grid]); // Add grid as dependency

  useEffect(() => {
    const el = gameRef.current;
    if (!el) return;
    const prevent = (e: TouchEvent) => e.preventDefault();
    el.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      el.removeEventListener("touchmove", prevent);
    };
  }, [gameRef]); // Add gameRef as dependency

  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (stopped || won) return;
    let newGrid: Grid = grid;
    switch (direction) {
      case 'up':
        newGrid = moveUp(grid);
        break;
      case 'down':
        newGrid = moveDown(grid);
        break;
      case 'left':
        newGrid = moveLeft(grid);
        break;
      case 'right':
        newGrid = moveRight(grid);
        break;
    }
    if (JSON.stringify(newGrid) !== JSON.stringify(grid)) {
      setHistory([...history, grid]);
      setGrid(addRandomTile(newGrid));
      setStep(history.length + 1);
      // Check for win
      if (newGrid.flat().includes(2048)) {
        setWon(true);
      }
    }
  }, [stopped, won, grid, history]); // Memoize handleMove

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
  }, [handleMove]); // Use handleMove as dependency

  // Touch
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

  // Mouse drag
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

  // Go to a specific history state
  const goToHistory = (idx: number) => {
    setGrid(history[idx]);
    setHistory(history.slice(0, idx));
    setStep(idx);
  };

  return (
    <div
      ref={gameRef}
      style={{ ...styles.container, userSelect: "none", position: 'relative' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onWheel={e => e.preventDefault()}
      tabIndex={0}
      className="select-none"
    >
      <h1 className="text-orange-600 font-bold text-4xl mt-8">2048 Game</h1>
      {(won || stopped) && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.7)',
          color: 'gold',
          fontWeight: 'bold',
          fontSize: 28,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}>
          {won ? (
            <>
              🎉 Congratulations! You reached 2048! 🎉
              <button onClick={() => setStopped(true)} style={{marginTop: 16, padding: '8px 16px', fontSize: 18}}>Stop Game</button>
            </>
          ) : (
            <>
              <div>Click below to start the game</div>
              <button onClick={() => setStopped(false)} style={{marginTop: 16, padding: '8px 16px', fontSize: 18}}>Start Game</button>
            </>
          )}
        </div>
      )}
      <div className="mx-auto mt-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 font-mono text-center">
          
          <span>
            <span className="text-xs align-top mr-1">2</span>
            <span className="text-3xl">🥚</span>
          </span>

          <span>
            <span className="text-xs align-top mr-1">4</span>
            <span className="text-3xl">🐣</span>
          </span>

          <span>
            <span className="text-xs align-top mr-1">8</span>
            <span className="text-3xl">🐤</span>
          </span>

          <span>
            <span className="text-xs align-top mr-1">16</span>
            <span className="text-3xl">🐥</span>
          </span>

          <span>
            <span className="text-xs align-top mr-1">32</span>
            <span className="text-3xl">🐔</span>
          </span>

          <span>
            <span className="text-xs align-top mr-1">64</span>
            <span className="text-3xl">🐓</span>
          </span>

          <span>
            <span className="text-xs align-top mr-1">128</span>
            <span className="text-3xl">🦃</span>
          </span>

          <span>
            <span className="text-xs align-top mr-1">256</span>
            <span className="text-3xl">🦆</span>
          </span>

          <span>
            <span className="text-xs align-top mr-1">512</span>
            <span className="text-3xl">🦅</span>
          </span>

          <span>
            <span className="text-xs align-top mr-1">1024</span>
            <span className="text-3xl">🦉</span>
          </span>

          <span>
            <span className="text-xs align-top mr-1">2048</span>
            <span className="text-3xl">🦚</span>
          </span>

          <span>
            <span className="text-xs align-top mr-1">4096</span>
            <span className="text-3xl">🦜</span>
          </span>

          <span>
            <span className="text-xs align-top mr-1">8192</span>
            <span className="text-3xl">🦢</span>
          </span>

          <span>
            <span className="text-xs align-top mr-1">16384</span>
            <span className="text-3xl">🦩</span>
          </span>

        </div>
      </div>
      <div style={styles.grid}>
        {grid.flat().map((cell, idx) => (
          <div key={idx} style={styles.cell}>
            {cell !== 0 ? tileIcons[cell] || cell : ""}
          </div>
        ))}
      </div>
      <div style={styles.history}>
        <div>

        <button
          onClick={() => setStopped(true)}
          style={{ zIndex: 20, padding: '4px 12px', fontSize: 16 }}
          disabled={stopped || won}
          className="text-orange-600 border rounded-2xl hover:text-orange-900"
        >
          Stop
        </button>
        </div>
        <h2 className="p-4 font-bold">Steps: {step}</h2>
        <ul style={{ listStyle: "none", padding: 0 }} className="space-y-1 max-h-50 overflow-y-auto border-t border-dashed">
          {history.map((_, idx) => (
            <li key={idx}>
              <button
                onClick={() => goToHistory(idx)}
                className="hover:text-orange-600 duration-300 !important"
              >
                Go to step {idx + 1}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function moveLeft(grid: Grid): Grid {
  // Process each row directly
  return grid.map(row => slideAndMergeRow([...row]));
}

function moveRight(grid: Grid): Grid {
  // Reverse each row, slide left, then reverse back
  return grid.map(row => {
    const reversed = [...row].reverse();
    const slid = slideAndMergeRow(reversed);
    return slid.reverse();
  });
}

function moveUp(grid: Grid): Grid {
  // Transpose grid (rows to columns), slide left, transpose back
  const transposed = generateEmptyGrid();
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      transposed[col][row] = grid[row][col];
    }
  }
  const slid = transposed.map(row => slideAndMergeRow([...row]));
  // Transpose back
  const result = generateEmptyGrid();
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      result[row][col] = slid[col][row];
    }
  }
  return result;
}

function moveDown(grid: Grid): Grid {
  // Transpose grid, slide right, transpose back
  const transposed = generateEmptyGrid();
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      transposed[col][row] = grid[row][col];
    }
  }
  const slid = transposed.map(row => {
    const reversed = [...row].reverse();
    const slidRow = slideAndMergeRow(reversed);
    return slidRow.reverse();
  });
  // Transpose back
  const result = generateEmptyGrid();
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      result[row][col] = slid[col][row];
    }
  }
  return result;
}
