/**
 * MapCreator class to manage the game grid
 */
class MapCreator {
  /**
   * Create a new MapCreator
   * @param {SeededRandom} rng - Random number generator
   */
  constructor(rng) {
    this.grid = [];
    this.rng = rng;
    this.targetPos = { x: 0, y: 0 };
  }

  /**
   * Initialize the grid with walls and empty cells
   */
  initialize() {
    // Create empty grid
    this.grid = Array(GRID_SIZE)
      .fill()
      .map(() => Array(GRID_SIZE).fill(EMPTY));

    // Add walls around the edges
    for (let i = 0; i < GRID_SIZE; i++) {
      this.grid[0][i] = WALL;
      this.grid[GRID_SIZE - 1][i] = WALL;
      this.grid[i][0] = WALL;
      this.grid[i][GRID_SIZE - 1] = WALL;
    }

    // Add walls in a more strategic way to avoid isolated areas
    this.addStrategicWalls();
  }

  /**
   * Add walls in a strategic way to avoid isolated areas
   */
  addStrategicWalls() {
    // Number of walls to add
    const numWalls = this.rng.randomInt(10, 15);

    // Keep track of wall positions to avoid duplicates
    const wallPositions = new Set();

    // Add walls one by one
    for (let i = 0; i < numWalls; i++) {
      let x, y;
      let attempts = 0;
      let validPosition = false;

      // Try to find a valid position for the wall
      while (!validPosition && attempts < 50) {
        x = this.rng.randomInt(1, GRID_SIZE - 2);
        y = this.rng.randomInt(1, GRID_SIZE - 2);
        const posKey = `${x},${y}`;

        // Check if this position already has a wall
        if (!wallPositions.has(posKey) && this.grid[y][x] !== WALL) {
          // Temporarily add the wall
          this.grid[y][x] = WALL;
          wallPositions.add(posKey);

          // Check if adding this wall would create isolated areas
          // We'll use a flood fill algorithm to check connectivity
          if (this.checkConnectivity()) {
            validPosition = true;
          } else {
            // If it creates isolated areas, remove the wall
            this.grid[y][x] = EMPTY;
            wallPositions.delete(posKey);
          }
        }

        attempts++;
      }

      // If we couldn't find a valid position after 50 attempts, stop adding walls
      if (!validPosition) {
        break;
      }
    }
  }

  /**
   * Check if the grid is fully connected (no isolated areas)
   * @returns {boolean} - True if the grid is fully connected
   */
  checkConnectivity() {
    // Find the first empty cell
    let startX = -1,
      startY = -1;
    for (let y = 1; y < GRID_SIZE - 1; y++) {
      for (let x = 1; x < GRID_SIZE - 1; x++) {
        if (this.grid[y][x] === EMPTY) {
          startX = x;
          startY = y;
          break;
        }
      }
      if (startX !== -1) break;
    }

    // If no empty cell found, return true
    if (startX === -1) return true;

    // Count total empty cells
    let totalEmptyCells = 0;
    for (let y = 1; y < GRID_SIZE - 1; y++) {
      for (let x = 1; x < GRID_SIZE - 1; x++) {
        if (this.grid[y][x] === EMPTY) {
          totalEmptyCells++;
        }
      }
    }

    // Flood fill from the first empty cell
    const visited = new Set();
    const queue = [{ x: startX, y: startY }];
    visited.add(`${startX},${startY}`);

    while (queue.length > 0) {
      const current = queue.shift();

      // Check all four adjacent cells
      const directions = [
        { dx: 0, dy: -1 }, // Up
        { dx: 1, dy: 0 }, // Right
        { dx: 0, dy: 1 }, // Down
        { dx: -1, dy: 0 }, // Left
      ];

      for (const dir of directions) {
        const newX = current.x + dir.dx;
        const newY = current.y + dir.dy;

        // Check if the new position is valid
        if (
          newX >= 1 &&
          newX < GRID_SIZE - 1 &&
          newY >= 1 &&
          newY < GRID_SIZE - 1
        ) {
          const posKey = `${newX},${newY}`;

          // If it's an empty cell and not visited yet
          if (this.grid[newY][newX] === EMPTY && !visited.has(posKey)) {
            visited.add(posKey);
            queue.push({ x: newX, y: newY });
          }
        }
      }
    }

    // If the number of visited cells equals the total number of empty cells,
    // then all empty cells are connected
    return visited.size === totalEmptyCells;
  }

  /**
   * Simulate a move from a position in a direction
   * @param {Object} startPos - Start position {x, y}
   * @param {number} direction - Direction to move
   * @returns {Object} - Result { endPos: {x, y}, hitTarget: boolean, path: Array }
   */
  simulateMove(startPos, direction) {
    let x = startPos.x;
    let y = startPos.y;
    const path = [{ x, y }];
    let moving = true;
    let hitTarget = false;

    while (moving) {
      let nextX = x;
      let nextY = y;

      switch (direction) {
        case UP:
          nextY--;
          break;
        case RIGHT:
          nextX++;
          break;
        case DOWN:
          nextY++;
          break;
        case LEFT:
          nextX--;
          break;
      }

      // Check validity
      if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
        moving = false; // Hit edge
      } else if (this.grid[nextY][nextX] === WALL) {
        moving = false; // Hit wall
      } else {
        x = nextX;
        y = nextY;
        path.push({ x, y });

        // Check target
        if (x === this.targetPos.x && y === this.targetPos.y) {
          hitTarget = true;
          moving = false; // Stop at target (Player matches this behavior)
        }
      }
    }
    return { endPos: { x, y }, hitTarget, path };
  }

  /**
   * Place the target on the grid
   * @param {Object} playerPos - Player position {x, y}
   */
  placeTarget(playerPos) {
    // Place target using seeded RNG
    // Ensure target is not within one cell of the player
    do {
      this.targetPos.x = this.rng.randomInt(1, GRID_SIZE - 2);
      this.targetPos.y = this.rng.randomInt(1, GRID_SIZE - 2);
    } while (
      this.grid[this.targetPos.y][this.targetPos.x] !== EMPTY ||
      Utils.arePositionsAdjacent(playerPos, this.targetPos)
    );

    this.grid[this.targetPos.y][this.targetPos.x] = TARGET;
  }

  /**
   * Get the cell type at a specific position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} - Cell type
   */
  getCellType(x, y) {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
      return WALL; // Out of bounds is treated as wall
    }
    return this.grid[y][x];
  }

  /**
   * Set the cell type at a specific position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} type - Cell type
   */
  setCellType(x, y, type) {
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      this.grid[y][x] = type;
    }
  }

  /**
   * Check if the puzzle is solvable using BFS
   * @param {Object} initialPlayerPos - Initial player position {x, y}
   * @param {boolean} silent - Whether to update UI
   * @returns {Object} - Object containing solvable status and minimum moves
   */
  checkSolvable(initialPlayerPos, silent = false) {
    // Special case for April 30, 2025 - for debugging
    const isApril302025 =
      typeof window !== "undefined" &&
      document.getElementById("dateInput") &&
      document.getElementById("dateInput").value === "2025-04-30";

    const queue = [];
    const visited = new Set();

    // Start from the initial player position
    queue.push({
      x: initialPlayerPos.x,
      y: initialPlayerPos.y,
      moves: 0, // This is the number of key presses (actual moves)
      path: [{ x: initialPlayerPos.x, y: initialPlayerPos.y }],
    });

    const startKey = `${initialPlayerPos.x},${initialPlayerPos.y}`;
    visited.add(startKey);

    // BFS
    while (queue.length > 0) {
      const current = queue.shift();

      // Check if reached target (already checked inside simulateMove, but good to check here if path had target)
      if (current.x === this.targetPos.x && current.y === this.targetPos.y) {
        if (!silent) {
          document.getElementById("solvableStatus").textContent =
            `This puzzle is solvable in ${current.moves} moves!`;
          document.getElementById("solvableStatus").className = "solvable";
        }
        return { solvable: true, minMoves: current.moves };
      }

      // Try all four directions
      for (let dir = 0; dir < 4; dir++) {
        const moveResult = this.simulateMove(current, dir);
        const { endPos, hitTarget, path } = moveResult;

        if (hitTarget) {
          // Win detected
          if (!silent) {
            document.getElementById("solvableStatus").textContent =
              `This puzzle is solvable in ${current.moves + 1} moves!`;
            document.getElementById("solvableStatus").className = "solvable";
          }
          return { solvable: true, minMoves: current.moves + 1 };
        }

        // Add new position to queue if not visited
        const posKey = `${endPos.x},${endPos.y}`;
        if (!visited.has(posKey)) {
          visited.add(posKey);

          const newMoveCount = current.moves + 1;

          // Add direction to new path segments... actually checkSolvable didn't use `dir` in path properly before?
          // The old code: path: [...current.path, { x: newX, y: newY, dir: dir }]
          // We don't really use the path property except potentially for debugging.
          const newPath = [...current.path, { x: endPos.x, y: endPos.y }];

          queue.push({
            x: endPos.x,
            y: endPos.y,
            moves: newMoveCount,
            path: newPath,
          });
        }
      }
    }

    if (!silent) {
      document.getElementById("solvableStatus").textContent =
        "This puzzle is NOT solvable!";
      document.getElementById("solvableStatus").className = "unsolvable";
    }
    return { solvable: false, minMoves: 0 };
  }

  /**
   * Check if all empty cells are reachable from the player position
   * @param {Object} playerPos - Player position {x, y}
   * @returns {boolean} - True if all empty cells are reachable
   */
  checkAllCellsReachable(playerPos) {
    const queue = [];
    const visited = new Set();
    const emptyCells = new Set();

    // Count all empty cells
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (this.grid[y][x] === EMPTY || this.grid[y][x] === TARGET) {
          emptyCells.add(`${x},${y}`);
        }
      }
    }

    // Start BFS from player position
    queue.push({
      x: playerPos.x,
      y: playerPos.y,
    });

    const startKey = `${playerPos.x},${playerPos.y}`;
    visited.add(startKey);
    if (emptyCells.has(startKey)) {
      emptyCells.delete(startKey);
    }

    // BFS to find all reachable cells
    while (queue.length > 0) {
      const current = queue.shift();

      // Try all four directions
      for (let dir = 0; dir < 4; dir++) {
        const moveResult = this.simulateMove(current, dir);
        const { endPos, path } = moveResult;

        // Process path to mark visited cells
        // Path includes start pos, so we iterate all
        for (const pos of path) {
          const slideKey = `${pos.x},${pos.y}`;
          if (emptyCells.has(slideKey)) {
            emptyCells.delete(slideKey);
          }
        }

        // Add new position to queue if not visited
        const posKey = `${endPos.x},${endPos.y}`;
        if (!visited.has(posKey)) {
          visited.add(posKey);
          queue.push({ x: endPos.x, y: endPos.y });
        }
      }
    }

    // If emptyCells is empty, all cells are reachable
    return emptyCells.size === 0;
  }
}
