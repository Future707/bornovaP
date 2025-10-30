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
  constructor(width, height, density = 0.65) {
    this.width = width;
    this.height = height;
    this.nodes = this.createRandomGrid(density);
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
