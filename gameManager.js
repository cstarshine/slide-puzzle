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

    this.initModalEvents();
    this.generateMapFromDate(this.currentDate);
  }

  initModalEvents() {
    const shareBtn = document.getElementById("shareBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");

    if (shareBtn) shareBtn.addEventListener("click", () => this.shareResult());
    if (closeModalBtn)
      closeModalBtn.addEventListener("click", () => this.closeClearModal());
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

      foundAttempt = this.tryGenerateLoop(
        startTime,
        endTime,
        MIN_DIFFICULTY_MOVES,
      );

      if (!foundAttempt) {
        console.log("Failed to generate hard map, trying medium...");
        foundAttempt = this.tryGenerateLoop(startTime, endTime, 4);
      }

      if (!foundAttempt) {
        console.log("Failed to generate medium map, trying any...");
        foundAttempt = this.tryGenerateLoop(startTime, endTime, 1);
      }

      if (foundAttempt) {
        success = true;
        result = foundAttempt.result;
        this.currentMinMoves = result.minMoves;
      }

      const minMovesDisplay = document.getElementById("minMovesDisplay");
      if (minMovesDisplay) {
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
        this.showClearModal();
      }, 100);
    }
  }

  showClearModal() {
    const modal = document.getElementById("clearModal");
    const statsDiv = document.getElementById("clearStats");

    let moveDiff = this.player.moveCount - this.currentMinMoves;
    let diffStr = moveDiff <= 0 ? " (Perfect!)" : ` (+${moveDiff})`;

    statsDiv.innerHTML = `
      Date: ${this.currentDate}<br>
      Moves: <strong>${this.player.moveCount}</strong>${diffStr}<br>
      Minimum Moves: ${this.currentMinMoves}
    `;

    modal.style.display = "flex";
  }

  closeClearModal() {
    const modal = document.getElementById("clearModal");
    modal.style.display = "none";
  }

  shareResult() {
    const diff = this.player.moveCount - this.currentMinMoves;
    const diffStr = diff > 0 ? ` (+${diff})` : " (Perfect!)";

    const text = `Ice Slide Puzzle ${this.currentDate}\nMoves: ${this.player.moveCount} / ${this.currentMinMoves}${diffStr}\n\nCan you beat the ice? 🧊`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          this.showToast("Copied to clipboard!");
        })
        .catch((err) => {
          console.error("Clipboard API failed: ", err);
          this.fallbackCopyText(text);
        });
    } else {
      this.fallbackCopyText(text);
    }
  }

  fallbackCopyText(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);

    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand("copy");
      const msg = successful ? "Copied to clipboard!" : "Failed to copy text";
      this.showToast(msg);
    } catch (err) {
      console.error("Fallback copy failed", err);
      this.showToast("Failed to copy");
    }

    document.body.removeChild(textArea);
  }

  showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = "toast show";
    setTimeout(function () {
      toast.className = toast.className.replace("show", "");
    }, 3000);
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
