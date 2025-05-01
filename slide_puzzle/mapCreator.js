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
        this.grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(EMPTY));

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
        let startX = -1, startY = -1;
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
        const queue = [{x: startX, y: startY}];
        visited.add(`${startX},${startY}`);

        while (queue.length > 0) {
            const current = queue.shift();

            // Check all four adjacent cells
            const directions = [
                {dx: 0, dy: -1}, // Up
                {dx: 1, dy: 0},  // Right
                {dx: 0, dy: 1},  // Down
                {dx: -1, dy: 0}  // Left
            ];

            for (const dir of directions) {
                const newX = current.x + dir.dx;
                const newY = current.y + dir.dy;

                // Check if the new position is valid
                if (newX >= 1 && newX < GRID_SIZE - 1 && newY >= 1 && newY < GRID_SIZE - 1) {
                    const posKey = `${newX},${newY}`;

                    // If it's an empty cell and not visited yet
                    if (this.grid[newY][newX] === EMPTY && !visited.has(posKey)) {
                        visited.add(posKey);
                        queue.push({x: newX, y: newY});
                    }
                }
            }
        }

        // If the number of visited cells equals the total number of empty cells,
        // then all empty cells are connected
        return visited.size === totalEmptyCells;
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
        const isApril302025 = typeof window !== 'undefined' && 
            document.getElementById('dateInput') && 
            document.getElementById('dateInput').value === '2025-04-30';

        if (isApril302025 && !silent) {
            console.log("DEBUG: April 30, 2025 detected in checkSolvable");
            console.log("DEBUG: Initial player position:", initialPlayerPos);
            console.log("DEBUG: Target position:", this.targetPos);
        }

        const queue = [];
        const visited = new Set();
        const distances = new Map();
        const paths = new Map(); // Store the path to each position
        const moveCounts = new Map(); // Store the actual move count (key presses) to each position

        // Start from the initial player position
        queue.push({
            x: initialPlayerPos.x,
            y: initialPlayerPos.y,
            moves: 0, // This is the number of key presses (actual moves)
            path: [{ x: initialPlayerPos.x, y: initialPlayerPos.y, dir: -1 }]
        });

        const startKey = `${initialPlayerPos.x},${initialPlayerPos.y}`;
        visited.add(startKey);
        distances.set(startKey, 0);
        paths.set(startKey, [{ x: initialPlayerPos.x, y: initialPlayerPos.y, dir: -1 }]);
        moveCounts.set(startKey, 0);

        // BFS
        while (queue.length > 0) {
            const current = queue.shift();

            // Check if reached target
            if (current.x === this.targetPos.x && current.y === this.targetPos.y) {
                if (isApril302025 && !silent) {
                    console.log("DEBUG: Target reached in BFS with moves:", current.moves);
                    console.log("DEBUG: Path to target:", current.path);
                }

                if (!silent) {
                    document.getElementById('solvableStatus').textContent = `This puzzle is solvable in ${current.moves} moves!`;
                    document.getElementById('solvableStatus').className = 'solvable';
                }

                // Return the correct minimum number of moves, which is the number of key presses
                return { solvable: true, minMoves: current.moves };
            }

            // Try all four directions
            for (let dir = 0; dir < 4; dir++) {
                let newX = current.x;
                let newY = current.y;

                // Special case for April 30, 2025 - for debugging
                const isApril302025 = typeof window !== 'undefined' && 
                    document.getElementById('dateInput') && 
                    document.getElementById('dateInput').value === '2025-04-30';

                if (isApril302025 && !silent) {
                    console.log(`DEBUG: Trying direction ${dir} from position (${current.x}, ${current.y})`);
                }

                // Simulate sliding until hitting a wall
                let moving = true;
                while (moving) {
                    let nextX = newX;
                    let nextY = newY;

                    switch (dir) {
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
                    } else if (this.grid[nextY][nextX] === WALL) {
                        moving = false;
                    } else {
                        newX = nextX;
                        newY = nextY;

                        // Check if exactly on target during sliding
                        if (newX === this.targetPos.x && newY === this.targetPos.y) {
                            // If we reached the target during sliding, we can stop and return
                            if (isApril302025 && !silent) {
                                console.log(`DEBUG: Target reached during sliding at position (${newX}, ${newY})`);
                            }

                            if (!silent) {
                                document.getElementById('solvableStatus').textContent = `This puzzle is solvable in ${current.moves + 1} moves!`;
                                document.getElementById('solvableStatus').className = 'solvable';
                            }

                            return { solvable: true, minMoves: current.moves + 1 };
                        }
                    }
                }

                if (isApril302025 && !silent) {
                    console.log(`DEBUG: After sliding in direction ${dir}, ended at position (${newX}, ${newY})`);
                }

                // Add new position to queue if not visited
                const posKey = `${newX},${newY}`;
                if (!visited.has(posKey)) {
                    visited.add(posKey);

                    // In the actual game, a single key press (one move) can result in sliding multiple cells
                    // So we increment the move count by 1, not by the number of cells traversed
                    const newMoveCount = current.moves + 1;
                    moveCounts.set(posKey, newMoveCount);

                    // For backward compatibility, we still maintain the distances map
                    // which counts each step in the sliding movement as a separate move
                    distances.set(posKey, current.moves + 1);

                    // Create a new path by copying the current path and adding the new position
                    const newPath = [...current.path, { x: newX, y: newY, dir: dir }];
                    paths.set(posKey, newPath);

                    queue.push({ 
                        x: newX, 
                        y: newY, 
                        moves: newMoveCount, // Use the new move count
                        path: newPath
                    });

                    if (isApril302025 && !silent) {
                        console.log(`DEBUG: Added position (${newX}, ${newY}) to queue with moves ${newMoveCount}`);
                    }
                }
            }
        }

        if (!silent) {
            document.getElementById('solvableStatus').textContent = 'This puzzle is NOT solvable!';
            document.getElementById('solvableStatus').className = 'unsolvable';
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
            y: playerPos.y
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
                let newX = current.x;
                let newY = current.y;

                // Simulate sliding until hitting a wall
                let moving = true;
                while (moving) {
                    let nextX = newX;
                    let nextY = newY;

                    switch (dir) {
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
                    } else if (this.grid[nextY][nextX] === WALL) {
                        moving = false;
                    } else {
                        newX = nextX;
                        newY = nextY;

                        // Mark this cell as visited during sliding
                        const slideKey = `${newX},${newY}`;
                        if (emptyCells.has(slideKey)) {
                            emptyCells.delete(slideKey);
                        }
                    }
                }

                // Add new position to queue if not visited
                const posKey = `${newX},${newY}`;
                if (!visited.has(posKey)) {
                    visited.add(posKey);
                    queue.push({ x: newX, y: newY });

                    // Remove from emptyCells if it's an empty cell
                    if (emptyCells.has(posKey)) {
                        emptyCells.delete(posKey);
                    }
                }
            }
        }

        // If emptyCells is empty, all cells are reachable
        return emptyCells.size === 0;
    }
}
