export function dijkstra(grid, start, end) {
  const rows = grid.length;
  const cols = grid[0].length;
  const nodes = new Map();
  const unvisited = new Set();
  const visitedNodes = [];

  // Initialize nodes
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = `${row},${col}`;
      nodes.set(key, {
        position: { row, col },
        distance: Infinity,
        previous: null
      });
      unvisited.add(key);
    }
  }

  // Set start node distance to 0
  const startKey = `${start.row},${start.col}`;
  nodes.get(startKey).distance = 0;

  while (unvisited.size > 0) {
    const currentKey = getClosestNode(nodes, unvisited);
    if (!currentKey) break;

    const current = nodes.get(currentKey);
    if (current.distance === Infinity) break;

    unvisited.delete(currentKey);
    visitedNodes.push(current.position);

    if (current.position.row === end.row && current.position.col === end.col) {
      return reconstructPath(nodes, start, end, visitedNodes);
    }

    const neighbors = getNeighbors(current.position, grid);
    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.row},${neighbor.col}`;
      if (!unvisited.has(neighborKey)) continue;

      const alt = current.distance + 1;
      const neighborNode = nodes.get(neighborKey);
      
      if (alt < neighborNode.distance) {
        neighborNode.distance = alt;
        neighborNode.previous = currentKey;
      }
    }
  }

  return { visitedNodes, path: [] };
}

function getClosestNode(nodes, unvisited) {
  let minDistance = Infinity;
  let closestKey = null;

  for (const key of unvisited) {
    const node = nodes.get(key);
    if (node.distance < minDistance) {
      minDistance = node.distance;
      closestKey = key;
    }
  }

  return closestKey;
}

function getNeighbors(pos, grid) {
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const neighbors = [];

  for (const [dx, dy] of directions) {
    const newRow = pos.row + dx;
    const newCol = pos.col + dy;

    if (
      newRow >= 0 && newRow < grid.length &&
      newCol >= 0 && newCol < grid[0].length &&
      grid[newRow][newCol] !== 'wall'
    ) {
      neighbors.push({ row: newRow, col: newCol });
    }
  }

  return neighbors;
}

function reconstructPath(nodes, start, end, visitedNodes) {
  const path = [];
  let currentKey = `${end.row},${end.col}`;
  const startKey = `${start.row},${start.col}`;

  while (currentKey && currentKey !== startKey) {
    const node = nodes.get(currentKey);
    path.unshift(node.position);
    currentKey = node.previous;
  }

  return { visitedNodes, path };
}