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
      this.currentDate = dateStr;

      let dateObj = new Date(dateStr + "T00:00:00");
      let result = { solvable: false, minMoves: 0 }; // Initialize with default

      const endTime = new Date(dateStr + "T23:59:59").getTime();
      const startTime = dateObj.getTime();
      let success = false;

      while (dateObj.getTime() <= endTime) {
        let currentDateTimeStr = dateObj.toISOString().split(".")[0];
        this.currentSeed = Utils.hashString(currentDateTimeStr);
        this.currentDate = currentDateTimeStr;

        this.rng = new SeededRandom(this.currentSeed);

        const attempt = this.performMapGenerationAttempt();
        if (attempt.success) {
          success = true;
          result = attempt.result;
          break;
        }

        dateObj.setSeconds(dateObj.getSeconds() + 1);
      }

      if (!success) {
        dateObj = new Date(startTime);

        while (dateObj.getTime() <= endTime) {
          let currentDateTimeStr = dateObj.toISOString();
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

      // Update UI with minimum moves
      const minMovesDisplay = document.getElementById("minMovesDisplay");
      if (minMovesDisplay && success && result) {
        minMovesDisplay.textContent = `Minimum Moves: ${result.minMoves}`;
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
