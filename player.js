class Player {
  constructor(grid, rng) {
    this.grid = grid;
    this.rng = rng;
    this.pos = { x: 0, y: 0 };
    this.initialPos = { x: 0, y: 0 };
    this.pixelPos = { x: 0, y: 0 };
    this.moveCount = 0;
  }

  place() {
    do {
      this.pos.x = this.rng.randomInt(1, GRID_SIZE - 2);
      this.pos.y = this.rng.randomInt(1, GRID_SIZE - 2);
    } while (this.grid.getCellType(this.pos.x, this.pos.y) === WALL);

    this.grid.setCellType(this.pos.x, this.pos.y, PLAYER);
    this.initialPos = { ...this.pos };

    this.pixelPos = {
      x: this.pos.x * CELL_SIZE + CELL_SIZE / 2,
      y: this.pos.y * CELL_SIZE + CELL_SIZE / 2,
    };
  }

  reset() {
    // If the player is currently on the target position, restore the TARGET type
    // Otherwise set it to EMPTY
    if (Utils.arePositionsEqual(this.pos, this.grid.targetPos)) {
      this.grid.setCellType(this.pos.x, this.pos.y, TARGET);
    } else {
      this.grid.setCellType(this.pos.x, this.pos.y, EMPTY);
    }

    this.pos = { ...this.initialPos };
    this.grid.setCellType(this.pos.x, this.pos.y, PLAYER);

    this.pixelPos = {
      x: this.pos.x * CELL_SIZE + CELL_SIZE / 2,
      y: this.pos.y * CELL_SIZE + CELL_SIZE / 2,
    };

    this.moveCount = 0;
    this.updateScoreDisplay();
  }

  updateScoreDisplay() {
    document.getElementById("scoreDisplay").textContent =
      `Moves: ${this.moveCount}`;
  }

  calculateMovePath(direction) {
    const { path } = this.grid.simulateMove(this.pos, direction);
    return path;
  }
}
