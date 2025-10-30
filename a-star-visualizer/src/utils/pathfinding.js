/**
 * A* Pathfinding Algorithm - JavaScript Implementation
 */

export class Node {
  constructor(x, y, isWalkable = true) {
    this.x = x;
    this.y = y;
    this.isWalkable = isWalkable;
    this.gCost = Infinity;
    this.hCost = 0;
    this.fCost = Infinity;
    this.parent = null;
  }

  get position() {
    return { x: this.x, y: this.y };
  }
}

export class Grid {
  constructor(width, height, type = 'random') {
    this.width = width;
    this.height = height;

    switch(type) {
      case 'easy':
        this.nodes = this.createPresetMaze('easy');
        break;
      case 'medium':
        this.nodes = this.createPresetMaze('medium');
        break;
      case 'hard':
        this.nodes = this.createPresetMaze('hard');
        break;
      case 'random':
        this.nodes = this.createMaze();
        break;
      default:
        this.nodes = this.createMaze();
    }
  }

  /**
   * Creates preset maze layouts with different difficulty levels
   */
  createPresetMaze(difficulty) {
    // Initialize empty grid (all walkable)
    const grid = [];
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        row.push(new Node(x, y, true));
      }
      grid.push(row);
    }

    // Add border walls
    for (let x = 0; x < this.width; x++) {
      grid[0][x].isWalkable = false;
      grid[this.height - 1][x].isWalkable = false;
    }
    for (let y = 0; y < this.height; y++) {
      grid[y][0].isWalkable = false;
      grid[y][this.width - 1].isWalkable = false;
    }

    if (difficulty === 'easy') {
      // Easy: Wide corridors, few dead ends
      for (let y = 5; y < this.height - 5; y += 8) {
        for (let x = 5; x < this.width - 10; x++) {
          if (x % 10 !== 0) {
            grid[y][x].isWalkable = false;
          }
        }
      }
      // Vertical walls with gaps
      for (let x = 10; x < this.width - 10; x += 10) {
        for (let y = 1; y < this.height - 1; y++) {
          if (y % 8 !== 0 && y % 8 !== 1) {
            grid[y][x].isWalkable = false;
          }
        }
      }
    } else if (difficulty === 'medium') {
      // Medium: Moderate corridors, some dead ends
      // Create grid pattern
      for (let y = 4; y < this.height - 4; y += 6) {
        for (let x = 4; x < this.width - 4; x++) {
          if (x % 8 !== 0 && x % 8 !== 1) {
            grid[y][x].isWalkable = false;
          }
        }
      }
      for (let x = 8; x < this.width - 8; x += 8) {
        for (let y = 1; y < this.height - 1; y++) {
          if (y % 6 !== 0 && y % 6 !== 1 && y % 6 !== 2) {
            grid[y][x].isWalkable = false;
          }
        }
      }
      // Add some obstacles
      for (let i = 0; i < 15; i++) {
        const x = Math.floor(Math.random() * (this.width - 4)) + 2;
        const y = Math.floor(Math.random() * (this.height - 4)) + 2;
        if (grid[y][x].isWalkable) {
          grid[y][x].isWalkable = false;
          grid[y][x + 1].isWalkable = false;
        }
      }
    } else if (difficulty === 'hard') {
      // Hard: Narrow paths, many dead ends, complex structure
      // Dense grid pattern
      for (let y = 3; y < this.height - 3; y += 4) {
        for (let x = 3; x < this.width - 3; x++) {
          if (x % 6 !== 0) {
            grid[y][x].isWalkable = false;
          }
        }
      }
      for (let x = 6; x < this.width - 6; x += 6) {
        for (let y = 1; y < this.height - 1; y++) {
          if (y % 4 !== 0 && y % 4 !== 1) {
            grid[y][x].isWalkable = false;
          }
        }
      }
      // Add many random obstacles
      for (let i = 0; i < 30; i++) {
        const x = Math.floor(Math.random() * (this.width - 4)) + 2;
        const y = Math.floor(Math.random() * (this.height - 4)) + 2;
        if (grid[y][x].isWalkable) {
          grid[y][x].isWalkable = false;
          if (Math.random() > 0.5 && x + 1 < this.width - 1) {
            grid[y][x + 1].isWalkable = false;
          }
          if (Math.random() > 0.5 && y + 1 < this.height - 1) {
            grid[y + 1][x].isWalkable = false;
          }
        }
      }
    }

    return grid;
  }

  createRandomGrid(density) {
    const grid = [];
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        const isWalkable = Math.random() < density;
        row.push(new Node(x, y, isWalkable));
      }
      grid.push(row);
    }
    return grid;
  }

  /**
   * Creates a maze using recursive backtracking algorithm
   * This creates a perfect maze with guaranteed paths
   */
  createMaze() {
    // Initialize grid with all walls
    const grid = [];
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        row.push(new Node(x, y, false));
      }
      grid.push(row);
    }

    // Recursive backtracking to carve paths
    const visited = new Set();
    const stack = [];

    // Start from random position (must be odd coordinates for proper maze)
    const startX = Math.floor(Math.random() * Math.floor(this.width / 2)) * 2 + 1;
    const startY = Math.floor(Math.random() * Math.floor(this.height / 2)) * 2 + 1;

    stack.push({ x: startX, y: startY });
    visited.add(`${startX},${startY}`);
    grid[startY][startX].isWalkable = true;

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = this.getUnvisitedNeighbors(current, visited, 2);

      if (neighbors.length > 0) {
        // Choose random neighbor
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];

        // Carve path between current and next
        const wallX = current.x + (next.x - current.x) / 2;
        const wallY = current.y + (next.y - current.y) / 2;

        grid[wallY][wallX].isWalkable = true;
        grid[next.y][next.x].isWalkable = true;

        visited.add(`${next.x},${next.y}`);
        stack.push(next);
      } else {
        stack.pop();
      }
    }

    // Add some extra openings to make it less perfect
    for (let i = 0; i < Math.floor((this.width * this.height) * 0.05); i++) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);
      if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
        grid[y][x].isWalkable = true;
      }
    }

    return grid;
  }

  getUnvisitedNeighbors(cell, visited, step = 2) {
    const neighbors = [];
    const directions = [
      { x: 0, y: -step }, // Up
      { x: 0, y: step },  // Down
      { x: -step, y: 0 }, // Left
      { x: step, y: 0 },  // Right
    ];

    for (const dir of directions) {
      const nx = cell.x + dir.x;
      const ny = cell.y + dir.y;

      if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
        if (!visited.has(`${nx},${ny}`)) {
          neighbors.push({ x: nx, y: ny });
        }
      }
    }

    return neighbors;
  }

  getNode(x, y) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.nodes[y][x];
    }
    return null;
  }

  getNeighbors(node) {
    const neighbors = [];
    const directions = [
      { x: 0, y: -1 }, // Up
      { x: 0, y: 1 },  // Down
      { x: -1, y: 0 }, // Left
      { x: 1, y: 0 },  // Right
    ];

    for (const dir of directions) {
      const neighbor = this.getNode(node.x + dir.x, node.y + dir.y);
      if (neighbor && neighbor.isWalkable) {
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  reset() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const node = this.nodes[y][x];
        node.gCost = Infinity;
        node.hCost = 0;
        node.fCost = Infinity;
        node.parent = null;
      }
    }
  }
}

/**
 * Manhattan distance heuristic
 */
export function heuristic(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Reconstruct path from end node to start node
 */
export function reconstructPath(endNode) {
  const path = [];
  let current = endNode;

  while (current !== null) {
    path.push({ x: current.x, y: current.y });
    current = current.parent;
  }

  return path.reverse();
}

/**
 * Priority Queue implementation using binary heap
 */
class PriorityQueue {
  constructor() {
    this.heap = [];
  }

  push(node) {
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const root = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.bubbleDown(0);
    return root;
  }

  bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[index].fCost >= this.heap[parentIndex].fCost) break;

      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      index = parentIndex;
    }
  }

  bubbleDown(index) {
    while (true) {
      let smallest = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (leftChild < this.heap.length && this.heap[leftChild].fCost < this.heap[smallest].fCost) {
        smallest = leftChild;
      }

      if (rightChild < this.heap.length && this.heap[rightChild].fCost < this.heap[smallest].fCost) {
        smallest = rightChild;
      }

      if (smallest === index) break;

      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  contains(node) {
    return this.heap.some(n => n.x === node.x && n.y === node.y);
  }
}

/**
 * A* Pathfinding Algorithm
 * @param {Grid} grid - The grid to search
 * @param {Object} start - Start position {x, y}
 * @param {Object} end - End position {x, y}
 * @param {Function} onVisit - Optional callback for visualization
 * @returns {Array|null} - Path as array of positions or null if no path found
 */
export async function findPathAStar(grid, start, end, onVisit = null) {
  const startNode = grid.getNode(start.x, start.y);
  const endNode = grid.getNode(end.x, end.y);

  if (!startNode || !startNode.isWalkable) {
    console.error('Start position is not walkable');
    return null;
  }

  if (!endNode || !endNode.isWalkable) {
    console.error('End position is not walkable');
    return null;
  }

  // Reset grid
  grid.reset();

  // Initialize start node
  startNode.gCost = 0;
  startNode.hCost = heuristic(startNode, endNode);
  startNode.fCost = startNode.hCost;

  const openSet = new PriorityQueue();
  openSet.push(startNode);

  const closedSet = new Set();
  const visitedNodes = [];

  while (!openSet.isEmpty()) {
    const current = openSet.pop();

    // Found the path
    if (current.x === end.x && current.y === end.y) {
      const path = reconstructPath(current);
      if (onVisit) {
        await onVisit(visitedNodes, path, true);
      }
      return path;
    }

    closedSet.add(`${current.x},${current.y}`);
    visitedNodes.push({ x: current.x, y: current.y });

    // Visualize current step
    if (onVisit) {
      await onVisit(visitedNodes, [], false);
    }

    // Check all neighbors
    const neighbors = grid.getNeighbors(current);

    for (const neighbor of neighbors) {
      if (closedSet.has(`${neighbor.x},${neighbor.y}`)) {
        continue;
      }

      const tentativeGCost = current.gCost + 1;

      if (tentativeGCost < neighbor.gCost) {
        neighbor.parent = current;
        neighbor.gCost = tentativeGCost;
        neighbor.hCost = heuristic(neighbor, endNode);
        neighbor.fCost = neighbor.gCost + neighbor.hCost;

        if (!openSet.contains(neighbor)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  // No path found
  if (onVisit) {
    await onVisit(visitedNodes, [], true);
  }
  return null;
}
