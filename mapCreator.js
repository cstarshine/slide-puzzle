class MapCreator {
  constructor(rng) {
    this.grid = [];
    this.rng = rng;
    this.targetPos = { x: 0, y: 0 };
  }

  initialize() {
    this.grid = Array(GRID_SIZE)
      .fill()
      .map(() => Array(GRID_SIZE).fill(EMPTY));

    for (let i = 0; i < GRID_SIZE; i++) {
      this.grid[0][i] = WALL;
      this.grid[GRID_SIZE - 1][i] = WALL;
      this.grid[i][0] = WALL;
      this.grid[i][GRID_SIZE - 1] = WALL;
    }

    this.addStrategicWalls();
  }

  addStrategicWalls() {
    const numWalls = this.rng.randomInt(10, 15);
    const wallPositions = new Set();

    for (let i = 0; i < numWalls; i++) {
      let x, y;
      let attempts = 0;
      let validPosition = false;

      while (!validPosition && attempts < 50) {
        x = this.rng.randomInt(1, GRID_SIZE - 2);
        y = this.rng.randomInt(1, GRID_SIZE - 2);
        const posKey = `${x},${y}`;

        if (!wallPositions.has(posKey) && this.grid[y][x] !== WALL) {
          this.grid[y][x] = WALL;
          wallPositions.add(posKey);

          if (this.checkConnectivity()) {
            validPosition = true;
          } else {
            this.grid[y][x] = EMPTY;
            wallPositions.delete(posKey);
          }
        }

        attempts++;
      }

      if (!validPosition) {
        break;
      }
    }
  }

  checkConnectivity() {
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

    if (startX === -1) return true;

    let totalEmptyCells = 0;
    for (let y = 1; y < GRID_SIZE - 1; y++) {
      for (let x = 1; x < GRID_SIZE - 1; x++) {
        if (this.grid[y][x] === EMPTY) {
          totalEmptyCells++;
        }
      }
    }

    const visited = new Set();
    const queue = [{ x: startX, y: startY }];
    visited.add(`${startX},${startY}`);

    while (queue.length > 0) {
      const current = queue.shift();

      const directions = [
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
      ];

      for (const dir of directions) {
        const newX = current.x + dir.dx;
        const newY = current.y + dir.dy;

        if (
          newX >= 1 &&
          newX < GRID_SIZE - 1 &&
          newY >= 1 &&
          newY < GRID_SIZE - 1
        ) {
          const posKey = `${newX},${newY}`;

          if (this.grid[newY][newX] === EMPTY && !visited.has(posKey)) {
            visited.add(posKey);
            queue.push({ x: newX, y: newY });
          }
        }
      }
    }

    return visited.size === totalEmptyCells;
  }

  simulateMove(startPos, direction) {
    let x = startPos.x;
    let y = startPos.y;
    const path = [{ x, y }];
    let moving = true;

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

      if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
        moving = false;
      } else if (this.grid[nextY][nextX] === WALL) {
        moving = false;
      } else {
        x = nextX;
        y = nextY;
        path.push({ x, y });
      }
    }
    return { endPos: { x, y }, path };
  }

  placeTarget(playerPos) {
    do {
      this.targetPos.x = this.rng.randomInt(1, GRID_SIZE - 2);
      this.targetPos.y = this.rng.randomInt(1, GRID_SIZE - 2);
    } while (
      this.grid[this.targetPos.y][this.targetPos.x] !== EMPTY ||
      Utils.arePositionsAdjacent(playerPos, this.targetPos)
    );

    this.grid[this.targetPos.y][this.targetPos.x] = TARGET;
  }

  getCellType(x, y) {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
      return WALL;
    }
    return this.grid[y][x];
  }

  setCellType(x, y, type) {
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      this.grid[y][x] = type;
    }
  }

  checkSolvable(initialPlayerPos, silent = false) {
    const queue = [];
    const visited = new Set();

    queue.push({
      x: initialPlayerPos.x,
      y: initialPlayerPos.y,
      moves: 0,
      path: [{ x: initialPlayerPos.x, y: initialPlayerPos.y }],
    });

    const startKey = `${initialPlayerPos.x},${initialPlayerPos.y}`;
    visited.add(startKey);

    while (queue.length > 0) {
      const current = queue.shift();

      if (current.x === this.targetPos.x && current.y === this.targetPos.y) {
        return { solvable: true, minMoves: current.moves };
      }

      for (let dir = 0; dir < 4; dir++) {
        const moveResult = this.simulateMove(current, dir);
        const { endPos, path } = moveResult;

        if (endPos.x === this.targetPos.x && endPos.y === this.targetPos.y) {
          return { solvable: true, minMoves: current.moves + 1 };
        }

        const posKey = `${endPos.x},${endPos.y}`;
        if (!visited.has(posKey)) {
          visited.add(posKey);

          const newMoveCount = current.moves + 1;
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

    return { solvable: false, minMoves: 0 };
  }

  checkAllCellsReachable(playerPos) {
    const queue = [];
    const visited = new Set();
    const emptyCells = new Set();

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (this.grid[y][x] === EMPTY || this.grid[y][x] === TARGET) {
          emptyCells.add(`${x},${y}`);
        }
      }
    }

    queue.push({
      x: playerPos.x,
      y: playerPos.y,
    });

    const startKey = `${playerPos.x},${playerPos.y}`;
    visited.add(startKey);
    if (emptyCells.has(startKey)) {
      emptyCells.delete(startKey);
    }

    while (queue.length > 0) {
      const current = queue.shift();
      for (let dir = 0; dir < 4; dir++) {
        const moveResult = this.simulateMove(current, dir);
        const { endPos, path } = moveResult;

        for (const pos of path) {
          const slideKey = `${pos.x},${pos.y}`;
          if (emptyCells.has(slideKey)) {
            emptyCells.delete(slideKey);
          }
        }

        const posKey = `${endPos.x},${endPos.y}`;
        if (!visited.has(posKey)) {
          visited.add(posKey);
          queue.push({ x: endPos.x, y: endPos.y });
        }
      }
    }

    return emptyCells.size === 0;
  }
}
