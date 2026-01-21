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

      while (attempts < maxAttempts) {
        attempts++;

        this.rng = new SeededRandom(this.currentSeed);

        this.grid = new MapCreator(this.rng);
        this.grid.initialize();

        this.player = new Player(this.grid, this.rng);
        this.player.place();

        this.grid.placeTarget(this.player.pos);

        result = this.grid.checkSolvable(this.player.initialPos, true);
        allCellsReachable = this.grid.checkAllCellsReachable(
          this.player.initialPos,
        );

        if (result.solvable && allCellsReachable && result.minMoves >= 4) {
          break;
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
            break;
          }
        }

        dateObj.setSeconds(dateObj.getSeconds() + 1);

        const originalDatePart = originalDate.split("T")[0];
        const newDatePart = dateObj.toISOString().split("T")[0];

        if (newDatePart !== originalDatePart) {
          dateObj = new Date(originalDate + "T00:00:00");

          this.currentSeed =
            Utils.hashString(originalDate + "T00:00:00") + attempts;
          this.currentDate = originalDate + " (modified seed)";
        } else {
          currentDateTimeStr = dateObj.toISOString().split(".")[0];
          this.currentSeed = Utils.hashString(currentDateTimeStr);
          this.currentDate = currentDateTimeStr;
        }
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

      document.getElementById("minMovesDisplay").textContent =
        `Minimum Moves: ${result.minMoves}`;

      document.getElementById("solvableStatus").textContent = "";
      document.getElementById("solvableStatus").className = "";
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
