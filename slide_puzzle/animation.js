/**
 * Animation class to handle player movement animation
 */
class Animation {
    /**
     * Create a new Animation
     * @param {Player} player - Player object
     * @param {function} onComplete - Callback when animation completes
     */
    constructor(player, onComplete) {
        this.player = player;
        this.onComplete = onComplete;
        this.isAnimating = false;
        this.path = [];
        this.currentStep = 0;
        this.startTime = 0;
        this.duration = 150; // milliseconds per cell
    }

    /**
     * Start animation along a path
     * @param {Array} path - Array of positions to animate through
     */
    start(path) {
        if (path.length <= 1) return;

        this.path = path;
        this.currentStep = 0;
        this.isAnimating = true;
        this.startTime = 0;
        requestAnimationFrame(this.animate.bind(this));
    }

    /**
     * Stop the current animation
     */
    stop() {
        this.isAnimating = false;
        this.path = [];
        this.currentStep = 0;
        this.startTime = 0;
    }

    /**
     * Animate one frame
     * @param {number} timestamp - Current timestamp
     */
    animate(timestamp) {
        if (!this.isAnimating) return;

        if (!this.startTime) {
            this.startTime = timestamp;

            // Calculate animation duration for consistent speed
            if (this.currentStep < this.path.length - 1) {
                const currentPos = this.path[this.currentStep];
                const nextPos = this.path[this.currentStep + 1];

                // Set animation duration based on distance
                this.duration = Utils.calculateAnimationDuration(currentPos, nextPos);
            }
        }

        // Calculate progress
        const elapsed = timestamp - this.startTime;

        if (this.currentStep >= this.path.length - 1) {
            // Animation complete
            this.isAnimating = false;
            this.startTime = 0;

            // Update final player position
            this.player.pos.x = this.path[this.path.length - 1].x;
            this.player.pos.y = this.path[this.path.length - 1].y;
            this.player.pixelPos.x = this.player.pos.x * CELL_SIZE + CELL_SIZE / 2;
            this.player.pixelPos.y = this.player.pos.y * CELL_SIZE + CELL_SIZE / 2;

            // Mark final position as player
            this.player.grid.setCellType(this.player.pos.x, this.player.pos.y, PLAYER);

            // Call the completion callback
            if (this.onComplete) {
                this.onComplete();
            }

            return;
        }

        // Get current and next positions in the path
        const currentPos = this.path[this.currentStep];
        const nextPos = this.path[this.currentStep + 1];

        // Calculate cell centers in pixels
        const currentCellCenter = {
            x: currentPos.x * CELL_SIZE + CELL_SIZE / 2,
            y: currentPos.y * CELL_SIZE + CELL_SIZE / 2
        };

        const nextCellCenter = {
            x: nextPos.x * CELL_SIZE + CELL_SIZE / 2,
            y: nextPos.y * CELL_SIZE + CELL_SIZE / 2
        };

        // Calculate progress between cells (0 to 1)
        const cellProgress = Math.min(elapsed / this.duration, 1);

        // Calculate current pixel position using linear interpolation
        this.player.pixelPos.x = currentCellCenter.x + (nextCellCenter.x - currentCellCenter.x) * cellProgress;
        this.player.pixelPos.y = currentCellCenter.y + (nextCellCenter.y - currentCellCenter.y) * cellProgress;

        // If we've completed the movement to the next cell
        if (cellProgress >= 1) {
            // Update player position to the next cell
            this.player.pos.x = nextPos.x;
            this.player.pos.y = nextPos.y;

            // Move to next step
            this.currentStep++;
            this.startTime = timestamp;

            // Calculate new animation duration for next segment if there is one
            if (this.currentStep < this.path.length - 1) {
                const currentPos = this.path[this.currentStep];
                const nextPos = this.path[this.currentStep + 1];

                // Set animation duration based on distance
                this.duration = Utils.calculateAnimationDuration(currentPos, nextPos);
            }
        }

        // Request next frame
        if (this.isAnimating) {
            requestAnimationFrame(this.animate.bind(this));
        }
    }
}

