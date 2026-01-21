class GameManager {
  constructor() {
    this.currentDate = "";
    this.currentSeed = 0;
    this.rng = null;
    this.grid = null;
    this.player = null;
    this.renderer = null;
    this.animation = null;
    this.inputHandler = null;
  }

  initGame() {
    const today = new Date();
    this.currentDate = today.toISOString().split("T")[0];

    const dateInput = document.getElementById("dateInput");
    if (dateInput) {
      dateInput.value = this.currentDate;
    }

    this.generateMapFromDate(this.currentDate);
  }

  performMapGenerationAttempt() {
    this.grid = new MapCreator(this.rng);
    this.grid.initialize();

    this.player = new Player(this.grid, this.rng);
    this.player.place();

    this.grid.placeTarget(this.player.pos);

    let result = this.grid.checkSolvable(this.player.initialPos, true);
    let allCellsReachable = this.grid.checkAllCellsReachable(
      this.player.initialPos,
    );

    if (result.solvable && allCellsReachable && result.minMoves >= 4) {
      return { success: true, result };
    }

    if (result.solvable && allCellsReachable && result.minMoves < 4) {
      this.grid.setCellType(
        this.grid.targetPos.x,
        this.grid.targetPos.y,
        EMPTY,
      );

      this.grid.placeTarget(this.player.pos);

      result = this.grid.checkSolvable(this.player.initialPos, true);

      if (result.solvable && result.minMoves >= 4) {
        return { success: true, result };
      }
    }
    return { success: false, result };
  }

  generateMapFromDate(dateStr) {
    try {
      const originalDate = dateStr;
      this.currentDate = originalDate;

      let dateObj = new Date(dateStr + "T00:00:00");
      let currentDateTimeStr = dateObj.toISOString().split(".")[0];

      this.currentSeed = Utils.hashString(currentDateTimeStr);

      let result = null;
      let allCellsReachable = false;
      let attempts = 0;
      const maxAttempts = 100;

      // Loop until end of day (23:59:59)
      const endTime = new Date(dateStr + "T23:59:59").getTime();
      const startTime = dateObj.getTime();
      let success = false;

      // Pass 1: Check seconds
      while (dateObj.getTime() <= endTime) {
        let currentDateTimeStr = dateObj.toISOString().split(".")[0];
        // Ensure seed is updated every iteration
        this.currentSeed = Utils.hashString(currentDateTimeStr);
        this.currentDate = currentDateTimeStr;

        this.rng = new SeededRandom(this.currentSeed);

        const attempt = this.performMapGenerationAttempt();
        if (attempt.success) {
          success = true;
          result = attempt.result;
          break;
        }

        // Increment time by 1 second
        dateObj.setSeconds(dateObj.getSeconds() + 1);
      }

      // Pass 2: If seconds failed, reset and try milliseconds (100ms intervals)
      if (!success) {
        console.log("Seconds pass failed. Trying milliseconds pass...");
        dateObj = new Date(startTime);

        while (dateObj.getTime() <= endTime) {
          let currentDateTimeStr = dateObj.toISOString(); // Full string with MS
          this.currentSeed = Utils.hashString(currentDateTimeStr);
          this.currentDate = currentDateTimeStr;

          this.rng = new SeededRandom(this.currentSeed);

          const attempt = this.performMapGenerationAttempt();
          if (attempt.success) {
            success = true;
            result = attempt.result;
            break;
          }

          dateObj.setMilliseconds(dateObj.getMilliseconds() + 100);
        }
      }

      // If we couldn't find a solvable puzzle after max attempts
      if (!result.solvable || result.minMoves === 0) {
        console.warn(
          "Could not generate a solvable puzzle with the current constraints",
        );
        document.getElementById("solvableStatus").textContent =
          "Could not generate solvable puzzle!";
        document.getElementById("solvableStatus").className = "unsolvable";
        // You might want to return here or handle it differently
        // For now, we allow the game to init but the user knows it's broken or just hard?
        // Actually, preventing play is better if we strictly want solvable games.
        // But let's at least show the warning.
        document.getElementById("minMovesDisplay").textContent =
          "Minimum Moves: N/A";
      } else {
        document.getElementById("minMovesDisplay").textContent =
          `Minimum Moves: ${result.minMoves}`;

        document.getElementById("solvableStatus").textContent = "";
        document.getElementById("solvableStatus").className = "";
      }

      this.renderer = new Renderer(this.grid, this.player);

      this.animation = new Animation(this.player, () =>
        this.checkWinCondition(),
      );

      if (!this.inputHandler) {
        this.inputHandler = new InputHandler(this);
      }

      this.updateDateDisplay();

      this.player.moveCount = 0;
      this.player.updateScoreDisplay();
    } catch (error) {
      console.error("Error generating map:", error);
    }
  }

  updateDateDisplay() {
    const dateDisplay = document.getElementById("dateDisplay");
    if (dateDisplay) {
      let displayText = "";
      if (this.currentDate.includes("T")) {
        const [datePart, timePart] = this.currentDate.split("T");
        displayText = `Date: ${datePart} Time: ${timePart} (Seed: ${this.currentSeed})`;
      } else if (this.currentDate.includes("(modified seed)")) {
        const datePart = this.currentDate.split(" (modified seed)")[0];
        displayText = `Date: ${datePart} (Modified Seed: ${this.currentSeed})`;
      } else {
        displayText = `Date: ${this.currentDate} (Seed: ${this.currentSeed})`;
      }
      dateDisplay.textContent = displayText;
    }
  }

  movePlayer(direction) {
    if (this.animation.isAnimating) return;

    const path = this.player.calculateMovePath(direction);

    if (path.length <= 1) return;

    this.player.moveCount++;
    this.player.updateScoreDisplay();

    this.grid.setCellType(this.player.pos.x, this.player.pos.y, EMPTY);

    this.animation.start(path);
  }

  checkWinCondition() {
    if (Utils.arePositionsEqual(this.player.pos, this.grid.targetPos)) {
      setTimeout(() => {
        this.initGame();
      }, 100);
    }
  }

  resetPlayer() {
    this.animation.stop();
    this.player.reset();
  }

  startGameLoop() {
    const gameLoop = (timestamp) => {
      this.renderer.draw();
      requestAnimationFrame(gameLoop);
    };
    requestAnimationFrame(gameLoop);
  }
}
