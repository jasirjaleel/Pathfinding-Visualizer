export function bfs(grid, start, end) {
  const rows = grid.length;
  const cols = grid[0].length;
  const queue = [start];
  const visited = new Set();
  const parent = new Map();
  
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const visitedNodes = [];

  while (queue.length > 0) {
    const current = queue.shift();
    const currentKey = `${current.row},${current.col}`;

    if (current.row === end.row && current.col === end.col) {
      return reconstructPath(parent, start, end, visitedNodes);
    }

    if (!visited.has(currentKey)) {
      visited.add(currentKey);
      visitedNodes.push(current);

      for (const [dx, dy] of directions) {
        const newRow = current.row + dx;
        const newCol = current.col + dy;
        const newKey = `${newRow},${newCol}`;

        if (
          newRow >= 0 && newRow < rows &&
          newCol >= 0 && newCol < cols &&
          grid[newRow][newCol] !== 'wall' &&
          !visited.has(newKey)
        ) {
          queue.push({ row: newRow, col: newCol });
          parent.set(newKey, currentKey);
        }
      }
    }
  }

  return { visitedNodes, path: [] };
}

function reconstructPath(parent, start, end, visitedNodes) {
  const path = [];
  let current = `${end.row},${end.col}`;
  const startKey = `${start.row},${start.col}`;

  while (current !== startKey && parent.has(current)) {
    const [row, col] = current.split(',').map(Number);
    path.unshift({ row, col });
    current = parent.get(current);
  }

  return { visitedNodes, path };
}