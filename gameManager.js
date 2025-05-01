/**
 * GameManager class to manage the overall game state and logic
 */
class GameManager {
    /**
     * Create a new GameManager
     */
    constructor() {
        this.currentDate = '';
        this.currentSeed = 0;
        this.rng = null;
        this.grid = null;
        this.player = null;
        this.renderer = null;
        this.animation = null;
        this.inputHandler = null;
    }

    /**
     * Initialize the game
     */
    initGame() {
        // Get current date in YYYY-MM-DD format
        const today = new Date();
        this.currentDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

        // Set the date input to today's date
        const dateInput = document.getElementById('dateInput');
        if (dateInput) {
            dateInput.value = this.currentDate;
        }

        // Generate map based on the date
        this.generateMapFromDate(this.currentDate);
    }

    /**
     * Generate map from a specific date
     * @param {string} dateStr - Date string in YYYY-MM-DD format
     */
    generateMapFromDate(dateStr) {
        try {
            // Store the original date
            const originalDate = dateStr;
            this.currentDate = originalDate;

            // Create a Date object from the date string
            // Add a default time (00:00:00) to start
            let dateObj = new Date(dateStr + "T00:00:00");
            let currentDateTimeStr = dateObj.toISOString().split('.')[0]; // YYYY-MM-DDThh:mm:ss

            // Generate seed from date+time
            this.currentSeed = Utils.hashString(currentDateTimeStr);

            let result = null;
            let allCellsReachable = false;
            let attempts = 0;
            const maxAttempts = 100; // Safety limit to prevent browser freezing

            // Keep trying with different time-based seeds until we find a valid map
            while (attempts < maxAttempts) {
                attempts++;

                // Initialize random number generator with current seed
                this.rng = new SeededRandom(this.currentSeed);

                // Initialize grid
                this.grid = new MapCreator(this.rng);
                this.grid.initialize();

                // Initialize player
                this.player = new Player(this.grid, this.rng);
                this.player.place();

                // Place target
                this.grid.placeTarget(this.player.pos);

                // Check if the puzzle is solvable and all cells are reachable
                result = this.grid.checkSolvable(this.player.initialPos, true);
                allCellsReachable = this.grid.checkAllCellsReachable(this.player.initialPos);

                // If the map is valid, break out of the loop
                if (result.solvable && allCellsReachable && result.minMoves >= 4) {
                    break;
                }

                // If the puzzle is solvable but requires less than 4 moves, try repositioning the target
                if (result.solvable && allCellsReachable && result.minMoves < 4) {
                    // Remove the current target
                    this.grid.setCellType(this.grid.targetPos.x, this.grid.targetPos.y, EMPTY);

                    // Try to place the target farther away
                    this.grid.placeTarget(this.player.pos);

                    // Check if the new target position makes the puzzle solvable with at least 4 moves
                    result = this.grid.checkSolvable(this.player.initialPos, true);

                    // If the puzzle is now solvable with at least 4 moves, break out of the loop
                    if (result.solvable && result.minMoves >= 4) {
                        break;
                    }
                }

                // If not valid, increment the time by 1 second and try again
                dateObj.setSeconds(dateObj.getSeconds() + 1);

                // Check if we've crossed to the next day
                const originalDatePart = originalDate.split('T')[0];
                const newDatePart = dateObj.toISOString().split('T')[0];

                // If we've crossed to the next day, reset time to 00:00:00 and try a different approach
                if (newDatePart !== originalDatePart) {
                    console.log(`Crossed to next day (${newDatePart}), resetting time to 00:00:00`);
                    // Reset to the original date with 00:00:00 time
                    dateObj = new Date(originalDate + "T00:00:00");

                    // Try a different approach: modify the seed directly instead of incrementing time
                    this.currentSeed = Utils.hashString(originalDate + "T00:00:00") + attempts;
                    this.currentDate = originalDate + " (modified seed)"; // Update the current date
                } else {
                    // Still within the same day, use the incremented time
                    currentDateTimeStr = dateObj.toISOString().split('.')[0];
                    this.currentSeed = Utils.hashString(currentDateTimeStr);
                    this.currentDate = currentDateTimeStr; // Update the current date with time
                }

                console.log(`Attempt ${attempts}: Trying with seed: ${this.currentSeed}`);
            }

            // Initialize renderer
            this.renderer = new Renderer(this.grid, this.player);

            // Initialize animation
            this.animation = new Animation(this.player, () => this.checkWinCondition());

            // Initialize input handler if not already initialized
            if (!this.inputHandler) {
                this.inputHandler = new InputHandler(this);
            }

            // Update date display
            this.updateDateDisplay();

            // Reset move counter
            this.player.moveCount = 0;
            this.player.updateScoreDisplay();

            // Update minimum moves display
            document.getElementById('minMovesDisplay').textContent = `Minimum Moves: ${result.minMoves}`;

            // Clear solvable status
            document.getElementById('solvableStatus').textContent = '';
            document.getElementById('solvableStatus').className = '';
        } catch (error) {
            console.error("Error generating map:", error);
            alert("An error occurred while generating the map. Please try again with a different date.");
        }
    }

    /**
     * Update the date display
     */
    updateDateDisplay() {
        const dateDisplay = document.getElementById('dateDisplay');
        if (dateDisplay) {
            // Format the date+time string nicely
            let displayText = '';
            if (this.currentDate.includes('T')) {
                // If it includes time (T separator), format it nicely
                const [datePart, timePart] = this.currentDate.split('T');
                displayText = `Date: ${datePart} Time: ${timePart} (Seed: ${this.currentSeed})`;
            } else if (this.currentDate.includes('(modified seed)')) {
                // Modified seed case
                const datePart = this.currentDate.split(' (modified seed)')[0];
                displayText = `Date: ${datePart} (Modified Seed: ${this.currentSeed})`;
            } else {
                // Just date, no time
                displayText = `Date: ${this.currentDate} (Seed: ${this.currentSeed})`;
            }
            dateDisplay.textContent = displayText;
        }
    }

    /**
     * Move player in a direction
     * @param {number} direction - Direction to move
     */
    movePlayer(direction) {
        // If already animating, ignore the input
        if (this.animation.isAnimating) return;

        // Calculate path
        const path = this.player.calculateMovePath(direction);

        // If there's no movement, return
        if (path.length <= 1) return;

        // Increment move counter
        this.player.moveCount++;
        this.player.updateScoreDisplay();

        // Remove player from current position
        this.grid.setCellType(this.player.pos.x, this.player.pos.y, EMPTY);

        // Start animation
        this.animation.start(path);
    }

    /**
     * Check if the player has won
     */
    checkWinCondition() {
        // Check if reached target (player is exactly on target)
        if (Utils.arePositionsEqual(this.player.pos, this.grid.targetPos)) {
            setTimeout(() => {
                alert(`Congratulations! You reached the target in ${this.player.moveCount} moves!`);
                this.initGame();
            }, 100);
        }
    }

    /**
     * Reset player to initial position
     */
    resetPlayer() {
        // Cancel any ongoing animation
        this.animation.stop();

        // Reset player
        this.player.reset();
    }

    /**
     * Start the game loop
     */
    startGameLoop() {
        const gameLoop = (timestamp) => {
            // Draw the game
            this.renderer.draw();

            // Request next frame
            requestAnimationFrame(gameLoop);
        };

        // Start the loop
        requestAnimationFrame(gameLoop);
    }
}
