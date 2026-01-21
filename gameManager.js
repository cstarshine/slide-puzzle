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

    this.generateMapFromDate(this.currentDate);
  }

  performMapGenerationAttempt(minDifficulty) {
    this.grid = new MapCreator(this.rng);
    this.grid.initialize();

    this.player = new Player(this.grid, this.rng);
    this.player.place();

    this.grid.placeTarget(this.player.pos);

    let result = this.grid.checkSolvable(
      this.player.initialPos,
      minDifficulty,
      true,
    );
    let allCellsReachable = this.grid.checkAllCellsReachable(
      this.player.initialPos,
    );

    if (result.solvable && allCellsReachable) {
      return { success: true, result };
    }

    // Retry target placement if failed (might be too easy or unreachable)
    // We try to place target one more time to see if we get a better spot
    this.grid.setCellType(this.grid.targetPos.x, this.grid.targetPos.y, EMPTY);

    this.grid.placeTarget(this.player.pos);

    result = this.grid.checkSolvable(
      this.player.initialPos,
      minDifficulty,
      true,
    );

    if (result.solvable && result.minMoves >= minDifficulty) {
      return { success: true, result };
    }

    return { success: false, result };
  }

  tryGenerateLoop(startTime, endTime, minDifficulty) {
    let dateObj = new Date(startTime);

    // First pass: check seconds
    while (dateObj.getTime() <= endTime) {
      let currentDateTimeStr = dateObj.toISOString().split(".")[0];
      this.currentSeed = Utils.hashString(currentDateTimeStr);
      this.currentDate = currentDateTimeStr;

      this.rng = new SeededRandom(this.currentSeed);

      const attempt = this.performMapGenerationAttempt(minDifficulty);
      if (attempt.success) {
        return { success: true, result: attempt.result };
      }

      dateObj.setSeconds(dateObj.getSeconds() + 1);
    }

    // Second pass: check milliseconds (if needed, though this is very intensive)
    // To match original logic's thoroughness but respecting the fallback tiers:
    // We might skip this for the high difficulties if performance is an issue,
    // but the user's original code had it. I will keep it.
    dateObj = new Date(startTime);
    while (dateObj.getTime() <= endTime) {
      let currentDateTimeStr = dateObj.toISOString();
      this.currentSeed = Utils.hashString(currentDateTimeStr);
      this.currentDate = currentDateTimeStr;

      this.rng = new SeededRandom(this.currentSeed);

      const attempt = this.performMapGenerationAttempt(minDifficulty);
      if (attempt.success) {
        return { success: true, result: attempt.result };
      }

      dateObj.setMilliseconds(dateObj.getMilliseconds() + 100);
    }

    return null;
  }

  generateMapFromDate(dateStr) {
    try {
      this.currentDate = dateStr;

      let dateObj = new Date(dateStr + "T00:00:00");
      let result = { solvable: false, minMoves: 0 };

      const endTime = new Date(dateStr + "T23:59:59").getTime();
      const startTime = dateObj.getTime();
      let success = false;
      let foundAttempt = null;

      // Tier 1: Try Hard Difficulty
      foundAttempt = this.tryGenerateLoop(
        startTime,
        endTime,
        MIN_DIFFICULTY_MOVES,
      );

      // Tier 2: Try Medium Difficulty
      if (!foundAttempt) {
        console.log("Failed to generate hard map, trying medium...");
        foundAttempt = this.tryGenerateLoop(startTime, endTime, 4);
      }

      // Tier 3: Try Any Difficulty
      if (!foundAttempt) {
        console.log("Failed to generate medium map, trying any...");
        foundAttempt = this.tryGenerateLoop(startTime, endTime, 1);
      }

      if (foundAttempt) {
        success = true;
        result = foundAttempt.result;
        this.currentMinMoves = result.minMoves; // Store for win condition
      }

      // Update UI with minimum moves - HIDDEN as per request
      const minMovesDisplay = document.getElementById("minMovesDisplay");
      if (minMovesDisplay) {
        // Clear it or hide it. User said "Hide during play"
        minMovesDisplay.textContent = "";
      }

      this.renderer = new Renderer(this.grid, this.player);

      this.animation = new Animation(this.player, () =>
        this.checkWinCondition(),
      );

      if (!this.inputHandler) {
        this.inputHandler = new InputHandler(this);
      }

      this.player.moveCount = 0;
      this.player.updateScoreDisplay();
    } catch (error) {
      console.error("Error generating map:", error);
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
        alert(`Clear! Minimum Moves: ${this.currentMinMoves}`);
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
