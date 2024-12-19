import React, { useState, useCallback, useRef } from 'react';
import { Play, Square, Eraser, Trash2, Gauge } from 'lucide-react';
import { bfs } from '../algorithms/bfs';
import { astar } from '../algorithms/astar';
import { dijkstra } from '../algorithms/dijkstra';



const GRID_ROWS = 23;
const GRID_COLS = 51;

const SPEED_VALUES = {
  fast: 10,
  normal: 25,
  slow: 50
};

const PathfindingVisualizer = () => {
  const [grid, setGrid] = useState(
    Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill('empty'))
  );
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('dijkstra');
  const [startPos, setStartPos] = useState({ row: 10, col: 5 });
  const [endPos, setEndPos] = useState({ row: 10, col: 35 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [speed, setSpeed] = useState('fast');
  const [isMousePressed, setIsMousePressed] = useState(false);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const animationRef = useRef({ cancel: false });

  const initializeGrid = useCallback(() => {
    const newGrid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill('empty'));
    newGrid[startPos.row][startPos.col] = 'start';
    newGrid[endPos.row][endPos.col] = 'end';
    setGrid(newGrid);
  }, [startPos, endPos]);

  React.useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  const handleMouseDown = (row, col) => {
    if (isAnimating) return;
    
    setIsMousePressed(true);
    const cellType = grid[row][col];
    
    if (cellType === 'start') {
      setIsDraggingStart(true);
      return;
    }
    
    if (cellType === 'end') {
      setIsDraggingEnd(true);
      return;
    }
    
    handleCellInteraction(row, col);
  };

  const handleMouseEnter = (row, col) => {
    if (!isMousePressed || isAnimating) return;

    if (isDraggingStart) {
      const newGrid = [...grid.map(row => [...row])];
      newGrid[startPos.row][startPos.col] = 'empty';
      newGrid[row][col] = 'start';
      setGrid(newGrid);
      setStartPos({ row, col });
      return;
    }

    if (isDraggingEnd) {
      const newGrid = [...grid.map(row => [...row])];
      newGrid[endPos.row][endPos.col] = 'empty';
      newGrid[row][col] = 'end';
      setGrid(newGrid);
      setEndPos({ row, col });
      return;
    }

    handleCellInteraction(row, col);
  };

  const handleMouseUp = () => {
    setIsMousePressed(false);
    setIsDraggingStart(false);
    setIsDraggingEnd(false);
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

  // Rest of the component remains the same...
  const clearPath = () => {
    const newGrid = grid.map(row =>
      row.map(cell => (cell === 'visited' || cell === 'path' ? 'empty' : cell))
    );
    setGrid(newGrid);
  };

  const clearWalls = () => {
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
    if (isAnimating) return;
    setIsAnimating(true);
    clearPath();
    
    animationRef.current.cancel = false;
    const newGrid = [...grid.map(row => [...row])];
    let visitedNodes = [];
    let path = [];

    switch (selectedAlgorithm) {
      case 'bfs':
        ({ visitedNodes, path } = bfs(grid, startPos, endPos));
        break;
      case 'astar':
        ({ visitedNodes, path } = astar(grid, startPos, endPos));
        break;
      case 'dijkstra':
        ({ visitedNodes, path } = dijkstra(grid, startPos, endPos));
        break;
    }

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

    setIsAnimating(false);
  };

  return (
    <div className="p-6 h-screen w-screen" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <select
            value={selectedAlgorithm}
            onChange={(e) => setSelectedAlgorithm(e.target.value)}
            className="bg-gray-800 text-gray-100 px-4 py-2 rounded-lg border border-gray-700"
          >
            <option value="dijkstra">Dijkstra's Algorithm</option>
            <option value="astar">A* Search</option>
            <option value="bfs">Breadth First Search</option>
          </select>

          <button
            onClick={visualizeAlgorithm}
            disabled={isAnimating}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <Play size={18} /> Visualize!
          </button>

          <button
            onClick={initializeGrid}
            className="px-4 py-2 bg-gray-800 rounded-lg flex items-center gap-2"
          >
            <Eraser size={18} /> Clear Board
          </button>

          <button
            onClick={clearWalls}
            className="px-4 py-2 bg-gray-800 rounded-lg flex items-center gap-2"
          >
            <Trash2 size={18} /> Clear Walls
          </button>

          <button
            onClick={clearPath}
            className="px-4 py-2 bg-gray-800 rounded-lg flex items-center gap-2"
          >
            <Square size={18} /> Clear Path
          </button>

          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
            <Gauge size={18} />
            <select
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
              className="bg-transparent text-gray-100 outline-none"
            >
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
            </select>
          </div>
        </div>

        <div 
          className="grid gap-px bg-gray-700 p-px rounded-lg w-full h-full"
          onMouseLeave={() => setIsMousePressed(false)}
        >
          {grid.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-px">
              {row.map((cell, colIdx) => (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  onMouseDown={() => handleMouseDown(rowIdx, colIdx)}
                  onMouseEnter={() => handleMouseEnter(rowIdx, colIdx)}
                  className={`w-6 h-6 transition-colors duration-200 ${
                    cell === 'empty' ? 'bg-gray-800' :
                    cell === 'wall' ? 'bg-gray-950' :
                    cell === 'start' ? 'bg-green-500' :
                    cell === 'end' ? 'bg-red-500' :
                    cell === 'visited' ? 'bg-purple-900/50' :
                    cell === 'path' ? 'bg-yellow-400' : ''
                  } hover:bg-gray-700 cursor-pointer select-none`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PathfindingVisualizer;