export function astar(grid, start, end) {
  const openSet = new Map();
  const closedSet = new Set();
  const visitedNodes = [];

  const startKey = `${start.row},${start.col}`;
  openSet.set(startKey, {
    position: start,
    g: 0,
    h: heuristic(start, end),
    f: heuristic(start, end),
    parent: null
  });

  while (openSet.size > 0) {
    const current = getCheapestNode(openSet);
    const currentKey = `${current.position.row},${current.position.col}`;

    if (current.position.row === end.row && current.position.col === end.col) {
      return reconstructPath(current, openSet, visitedNodes);
    }

    openSet.delete(currentKey);
    closedSet.add(currentKey);
    visitedNodes.push(current.position);

    const neighbors = getNeighbors(current.position, grid);
    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.row},${neighbor.col}`;

      if (closedSet.has(neighborKey)) continue;

      const gScore = current.g + 1;
      let neighborNode = openSet.get(neighborKey);

      if (!neighborNode) {
        neighborNode = {
          position: neighbor,
          g: Infinity,
          h: heuristic(neighbor, end),
          f: Infinity,
          parent: null
        };
      }

      if (gScore < neighborNode.g) {
        neighborNode.parent = currentKey;
        neighborNode.g = gScore;
        neighborNode.f = gScore + neighborNode.h;
        openSet.set(neighborKey, neighborNode);
      }
    }
  }

  return { visitedNodes, path: [] };
}

function heuristic(pos, end) {
  return Math.abs(pos.row - end.row) + Math.abs(pos.col - end.col);
}

function getCheapestNode(openSet) {
  let cheapest = null;
  for (const node of openSet.values()) {
    if (!cheapest || node.f < cheapest.f) {
      cheapest = node;
    }
  }
  return cheapest;
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

function reconstructPath(endNode, nodes, visitedNodes) {
  const path = [];
  let current = endNode;

  while (current) {
    path.unshift(current.position);
    current = current.parent ? nodes.get(current.parent) || null : null;
  }

  return { visitedNodes, path };
}