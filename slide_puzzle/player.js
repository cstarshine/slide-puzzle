/**
 * Player class to manage player state and movement
 */
class Player {
    /**
     * Create a new Player
     * @param {MapCreator} grid - Game grid
     * @param {SeededRandom} rng - Random number generator
     */
    constructor(grid, rng) {
        this.grid = grid;
        this.rng = rng;
        this.pos = { x: 0, y: 0 };
        this.initialPos = { x: 0, y: 0 };
        this.pixelPos = { x: 0, y: 0 };
        this.moveCount = 0;
    }

    /**
     * Place the player on the grid
     */
    place() {
        // Place player using seeded RNG
        do {
            this.pos.x = this.rng.randomInt(1, GRID_SIZE - 2);
            this.pos.y = this.rng.randomInt(1, GRID_SIZE - 2);
        } while (this.grid.getCellType(this.pos.x, this.pos.y) === WALL);

        this.grid.setCellType(this.pos.x, this.pos.y, PLAYER);
        this.initialPos = { ...this.pos };

        // Initialize pixel position
        this.pixelPos = { 
            x: this.pos.x * CELL_SIZE + CELL_SIZE / 2, 
            y: this.pos.y * CELL_SIZE + CELL_SIZE / 2 
        };
    }

    /**
     * Reset player to initial position
     */
    reset() {
        // Remove player from current position
        this.grid.setCellType(this.pos.x, this.pos.y, EMPTY);

        // Reset player position
        this.pos = { ...this.initialPos };
        this.grid.setCellType(this.pos.x, this.pos.y, PLAYER);

        // Reset pixel position
        this.pixelPos = { 
            x: this.pos.x * CELL_SIZE + CELL_SIZE / 2, 
            y: this.pos.y * CELL_SIZE + CELL_SIZE / 2 
        };

        // Reset move counter
        this.moveCount = 0;
        this.updateScoreDisplay();
    }

    /**
     * Update the score display
     */
    updateScoreDisplay() {
        document.getElementById('scoreDisplay').textContent = `Moves: ${this.moveCount}`;
    }

    /**
     * Calculate the path for a move in a specific direction
     * @param {number} direction - Direction to move
     * @returns {Array} - Array of positions along the path
     */
    calculateMovePath(direction) {
        let path = [];
        let startX = this.pos.x;
        let startY = this.pos.y;
        let newX = startX;
        let newY = startY;

        // Add starting position to path
        path.push({ x: startX, y: startY });

        // Keep moving in the direction until hitting a wall
        let moving = true;
        while (moving) {
            let nextX = newX;
            let nextY = newY;

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

            // Check if next position is valid
            if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
                moving = false;
            } else if (this.grid.getCellType(nextX, nextY) === WALL) {
                moving = false;
            } else {
                newX = nextX;
                newY = nextY;

                // Add position to path
                path.push({ x: newX, y: newY });

                // Check if exactly on target
                if (Utils.arePositionsEqual({ x: newX, y: newY }, this.grid.targetPos)) {
                    break;
                }
            }
        }

        return path;
    }
}

