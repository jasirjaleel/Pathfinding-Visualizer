import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Square, Eraser, Trash2, Gauge } from 'lucide-react';
import { bfs } from '../algorithms/bfs';
import { astar } from '../algorithms/astar';
import { dijkstra } from '../algorithms/dijkstra';

const SPEED_VALUES = {
  fast: 10,
  normal: 25,
  slow: 50
};

// Custom hook for responsive grid sizing
const useResponsiveGrid = () => {
  const [dimensions, setDimensions] = useState({ rows: 23, cols: 51, cellSize: 24 });
  
  useEffect(() => {
    const calculateGrid = () => {
      const isMobile = window.innerWidth < 768;
      const padding = isMobile ? 32 : 48; // Smaller padding on mobile
      const controlsHeight = isMobile ? 180 : 120; // More space for controls on mobile
      
      const availableWidth = window.innerWidth - padding;
      const availableHeight = window.innerHeight - controlsHeight - padding;
      
      // Base number of cells on screen size
      let baseRows = isMobile ? 15 : 23;
      let baseCols = isMobile ? 21 : 51;
      
      // Calculate maximum possible cell size
      const maxCellWidth = Math.floor(availableWidth / baseCols);
      const maxCellHeight = Math.floor(availableHeight / baseRows);
      const cellSize = Math.min(maxCellWidth, maxCellHeight, isMobile ? 20 : 24);
      
      // Recalculate rows and cols to fill available space
      const cols = Math.floor(availableWidth / cellSize);
      const rows = Math.floor(availableHeight / cellSize);
      
      setDimensions({ 
        rows: Math.max(10, Math.min(rows, baseRows)), // Ensure minimum grid size
        cols: Math.max(15, Math.min(cols, baseCols)),
        cellSize
      });
    };

    calculateGrid();
    window.addEventListener('resize', calculateGrid);
    return () => window.removeEventListener('resize', calculateGrid);
  }, []);

  return dimensions;
};

const PathfindingVisualizer = () => {
  const { rows: GRID_ROWS, cols: GRID_COLS, cellSize } = useResponsiveGrid();
  const [grid, setGrid] = useState([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('');
  const [startPos, setStartPos] = useState({ row: 0, col: 0 });
  const [endPos, setEndPos] = useState({ row: 0, col: 0 });
  const [isMousePressed, setIsMousePressed] = useState(false);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [error, setError] = useState('');
  const [speed, setSpeed] = useState('normal');
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef({ cancel: false });

  const initializeGrid = useCallback(() => {
    const newGrid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill('empty'));
    const startRow = Math.floor(GRID_ROWS / 2);
    const startCol = Math.floor(GRID_COLS / 4);
    const endRow = Math.floor(GRID_ROWS / 2);
    const endCol = Math.floor((GRID_COLS / 4) * 3);
    
    newGrid[startRow][startCol] = 'start';
    newGrid[endRow][endCol] = 'end';
    
    setStartPos({ row: startRow, col: startCol });
    setEndPos({ row: endRow, col: endCol });
    setGrid(newGrid);
    setIsAnimating(false);
    animationRef.current.cancel = true;
  }, [GRID_ROWS, GRID_COLS]);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  const handleMouseDown = (row, col) => {
    if (isAnimating) return;
    setIsMousePressed(true);
    const cellType = grid[row][col];
    
    if (cellType === 'start') {
      setIsDraggingStart(true);
    } else if (cellType === 'end') {
      setIsDraggingEnd(true);
    } else {
      handleCellInteraction(row, col);
    }
  };

  const handleMouseEnter = (row, col) => {
    if (!isMousePressed || isAnimating) return;

    if (isDraggingStart) {
      const newGrid = grid.map(row => [...row]);
      // Only update if the target cell is empty or visited
      if (newGrid[row][col] !== 'wall' && newGrid[row][col] !== 'end') {
        newGrid[startPos.row][startPos.col] = 'empty';
        newGrid[row][col] = 'start';
        setGrid(newGrid);
        setStartPos({ row, col });
      }
      return;
    }

    if (isDraggingEnd) {
      const newGrid = grid.map(row => [...row]);
      // Only update if the target cell is empty or visited
      if (newGrid[row][col] !== 'wall' && newGrid[row][col] !== 'start') {
        newGrid[endPos.row][endPos.col] = 'empty';
        newGrid[row][col] = 'end';
        setGrid(newGrid);
        setEndPos({ row, col });
      }
      return;
    }

    handleCellInteraction(row, col);
  };

  const handleMouseUp = () => {
    setIsMousePressed(false);
    setIsDraggingStart(false);
    setIsDraggingEnd(false);
  };

  const handleCellClick = (row, col) => {
    if (isAnimating) return;
    
    const cellType = grid[row][col];
    if (cellType === 'start' || cellType === 'end') {
      // If clicking start or end, prepare for dragging
      handleMouseDown(row, col);
    } else if (isDraggingStart) {
      // Complete start point movement
      const newGrid = grid.map(row => [...row]);
      if (newGrid[row][col] !== 'wall' && newGrid[row][col] !== 'end') {
        newGrid[startPos.row][startPos.col] = 'empty';
        newGrid[row][col] = 'start';
        setGrid(newGrid);
        setStartPos({ row, col });
        setIsDraggingStart(false);
      }
    } else if (isDraggingEnd) {
      // Complete end point movement
      const newGrid = grid.map(row => [...row]);
      if (newGrid[row][col] !== 'wall' && newGrid[row][col] !== 'start') {
        newGrid[endPos.row][endPos.col] = 'empty';
        newGrid[row][col] = 'end';
        setGrid(newGrid);
        setEndPos({ row, col });
        setIsDraggingEnd(false);
      }
    } else {
      handleCellInteraction(row, col);
    }
  };

  const handleCellInteraction = (row, col) => {
    if (isAnimating) return;
    const newGrid = [...grid.map(row => [...row])];
    const currentCell = newGrid[row][col];
    
    if (currentCell !== 'start' && currentCell !== 'end') {
      newGrid[row][col] = currentCell === 'wall' ? 'empty' : 'wall';
    }

    setGrid(newGrid);
  };

  const clearPath = () => {
    if (isAnimating) return;
    const newGrid = grid.map(row =>
      row.map(cell => (cell === 'visited' || cell === 'path' ? 'empty' : cell))
    );
    setGrid(newGrid);
  };

  const clearWalls = () => {
    if (isAnimating) return;
    const newGrid = grid.map(row =>
      row.map(cell => (cell === 'wall' ? 'empty' : cell))
    );
    setGrid(newGrid);
  };

  const stopVisualization = () => {
    if (isAnimating) {
      animationRef.current.cancel = true;
      setIsAnimating(false);
      clearPath();
    }
  };

  const visualizeAlgorithm = async () => {
    if (!selectedAlgorithm) {
      setError('Please select an algorithm first!');
      return;
    }
    if (isAnimating) return;
    
    setError('');
    setIsAnimating(true);
    clearPath();
    
    animationRef.current.cancel = false;
    const newGrid = [...grid.map(row => [...row])];
    let result = { visitedNodes: [], path: [] };

    switch (selectedAlgorithm) {
      case 'bfs':
        result = bfs(newGrid, startPos, endPos);
        break;
      case 'astar':
        result = astar(newGrid, startPos, endPos);
        break;
      case 'dijkstra':
        result = dijkstra(newGrid, startPos, endPos);
        break;
      default:
        return;
    }

    const { visitedNodes, path } = result;

    // Animate visited nodes
    for (let i = 0; i < visitedNodes.length; i++) {
      if (animationRef.current.cancel) {
        setIsAnimating(false);
        return;
      }

      const { row, col } = visitedNodes[i];
      if (newGrid[row][col] !== 'start' && newGrid[row][col] !== 'end') {
        newGrid[row][col] = 'visited';
        setGrid([...newGrid]);
        await new Promise(resolve => setTimeout(resolve, SPEED_VALUES[speed]));
      }
    }

    // Animate the path
    if (path && path.length > 0) {
      for (let i = 0; i < path.length; i++) {
        if (animationRef.current.cancel) {
          setIsAnimating(false);
          return;
        }

        const { row, col } = path[i];
        if (newGrid[row][col] !== 'start' && newGrid[row][col] !== 'end') {
          newGrid[row][col] = 'path';
          setGrid([...newGrid]);
          await new Promise(resolve => setTimeout(resolve, SPEED_VALUES[speed]));
        }
      }
    }

    setIsAnimating(false);
  };

  return (
    <div className="p-4 md:p-6 h-screen w-screen overflow-hidden">
      <div className="h-full flex flex-col max-w-7xl mx-auto">
        <div className="mb-4 md:mb-6 flex flex-wrap items-center gap-2 md:gap-4">
          <select
            value={selectedAlgorithm}
            onChange={(e) => {
              setSelectedAlgorithm(e.target.value);
              setError('');
            }}
            className="flex-grow md:flex-grow-0 bg-gray-800 text-gray-100 px-3 py-2 rounded-lg border border-gray-700 text-sm md:text-base"
          >
            <option value="">Select Algorithm</option>
            <option value="dijkstra">Dijkstra's Algorithm</option>
            <option value="astar">A* Search</option>
            <option value="bfs">Breadth First Search</option>
          </select>

          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={visualizeAlgorithm}
              disabled={isAnimating}
              className="px-3 py-2 bg-emerald-500 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 text-sm md:text-base"
            >
              <Play size={16} /> <span className="hidden md:inline">Visualize!</span>
            </button>

            <button
              onClick={initializeGrid}
              disabled={isAnimating}
              className="p-2 md:px-3 md:py-2 bg-gray-800 rounded-lg flex items-center gap-2 text-sm md:text-base"
            >
              <Eraser size={16} /> <span className="hidden md:inline">Clear Board</span>
            </button>

            <button
              onClick={clearWalls}
              disabled={isAnimating}
              className="p-2 md:px-3 md:py-2 bg-gray-800 rounded-lg flex items-center gap-2 text-sm md:text-base"
            >
              <Trash2 size={16} /> <span className="hidden md:inline">Clear Walls</span>
            </button>

            <button
              onClick={clearPath}
              disabled={isAnimating}
              className="p-2 md:px-3 md:py-2 bg-gray-800 rounded-lg flex items-center gap-2 text-sm md:text-base"
            >
              <Square size={16} /> <span className="hidden md:inline">Clear Path</span>
            </button>

            <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg border border-gray-700">
              <Gauge size={16} />
              <select
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
                className="bg-transparent text-gray-100 outline-none text-sm md:text-base"
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-500/10 text-red-500 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center">
          <div 
            className="grid gap-px bg-gray-700 p-px rounded-lg"
            style={{
              display: 'grid',
              gridTemplateRows: `repeat(${GRID_ROWS}, ${cellSize}px)`,
              gridTemplateColumns: `repeat(${GRID_COLS}, ${cellSize}px)`,
            }}
            onMouseLeave={handleMouseUp}
            onMouseUp={handleMouseUp}
          >
            {grid.map((row, rowIdx) => (
              row.map((cell, colIdx) => (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  onClick={() => handleCellClick(rowIdx, colIdx)}
                  onMouseDown={() => handleMouseDown(rowIdx, colIdx)}
                  onMouseEnter={() => handleMouseEnter(rowIdx, colIdx)}
                  onTouchStart={() => handleMouseDown(rowIdx, colIdx)}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const element = document.elementFromPoint(touch.clientX, touch.clientY);
                    const [row, col] = element?.dataset?.position?.split('-').map(Number) || [];
                  if (row !== undefined && col !== undefined) {
                    handleMouseEnter(row, col);
                  }
                }}
                data-position={`${rowIdx}-${colIdx}`}
                className={`transition-colors duration-200 ${
                  cell === 'empty' ? 'bg-gray-800' :
                  cell === 'wall' ? 'bg-gray-950' :
                  cell === 'start' ? 'bg-green-500' :
                  cell === 'end' ? 'bg-red-500' :
                  cell === 'visited' ? 'bg-purple-900/50' :
                  cell === 'path' ? 'bg-yellow-400' : ''
                } hover:bg-gray-700 cursor-pointer select-none`}
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`
                }}
              />
            ))
          ))}
        </div>
      </div>
    </div>
  </div>
  );
};

export default PathfindingVisualizer;