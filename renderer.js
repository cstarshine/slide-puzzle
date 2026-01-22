class Renderer {
  constructor(grid, player) {
    this.grid = grid;
    this.player = player;
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = null;

    if (this.canvas) {
      this.canvas.width = CANVAS_SIZE;
      this.canvas.height = CANVAS_SIZE;
      this.ctx = this.canvas.getContext("2d");
    } else {
      console.error("Canvas element not found");
    }
  }

  draw() {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cellX = x * CELL_SIZE;
        const cellY = y * CELL_SIZE;

        this.ctx.fillStyle = "#e6f2ff";
        this.ctx.fillRect(cellX, cellY, CELL_SIZE, CELL_SIZE);

        switch (this.grid.grid[y][x]) {
          case WALL:
            this.ctx.fillStyle = "#333";
            this.ctx.fillRect(cellX, cellY, CELL_SIZE, CELL_SIZE);
            break;
          case TARGET:
            this.ctx.fillStyle = "#ff4500";
            this.ctx.fillRect(
              cellX + 5,
              cellY + 5,
              CELL_SIZE - 10,
              CELL_SIZE - 10,
            );
            break;
        }

        this.ctx.strokeStyle = "#ccc";
        this.ctx.strokeRect(cellX, cellY, CELL_SIZE, CELL_SIZE);
      }
    }

    this.ctx.fillStyle = "#1e90ff";
    this.ctx.beginPath();
    this.ctx.arc(
      this.player.pixelPos.x,
      this.player.pixelPos.y,
      CELL_SIZE / 2 - 5,
      0,
      Math.PI * 2,
    );
    this.ctx.fill();
  }
}
