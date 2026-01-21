class InputHandler {
  constructor(game) {
    this.game = game;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.minSwipeDistance = 20;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleTouchCancel = this.handleTouchCancel.bind(this);

    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener("keydown", this.handleKeyDown);

    document.addEventListener("touchstart", this.handleTouchStart, {
      passive: false,
    });
    document.addEventListener("touchmove", this.handleTouchMove, {
      passive: false,
    });
    document.addEventListener("touchend", this.handleTouchEnd, {
      passive: false,
    });
    document.addEventListener("touchcancel", this.handleTouchCancel, {
      passive: false,
    });

    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => this.game?.resetPlayer());
    }
  }

  handleKeyDown(e) {
    if (this.game.animation && this.game.animation.isAnimating) return;

    let direction = null;
    switch (e.key) {
      case "ArrowUp":
        direction = UP;
        break;
      case "ArrowRight":
        direction = RIGHT;
        break;
      case "ArrowDown":
        direction = DOWN;
        break;
      case "ArrowLeft":
        direction = LEFT;
        break;
    }

    if (direction !== null) {
      this.game.movePlayer(direction);
    }
  }

  handleTouchStart(e) {
    if (e.changedTouches && e.changedTouches.length > 0) {
      this.touchStartX = e.changedTouches[0].clientX;
      this.touchStartY = e.changedTouches[0].clientY;
    }
  }

  handleTouchMove(e) {
    if (e.cancelable) {
      e.preventDefault();
    }
  }

  handleTouchEnd(e) {
    if (this.game.animation && this.game.animation.isAnimating) return;

    if (!e.changedTouches || e.changedTouches.length === 0) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const dx = touchEndX - this.touchStartX;
    const dy = touchEndY - this.touchStartY;

    if (
      Math.abs(dx) > this.minSwipeDistance ||
      Math.abs(dy) > this.minSwipeDistance
    ) {
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) {
          this.game.movePlayer(RIGHT);
        } else {
          this.game.movePlayer(LEFT);
        }
      } else {
        if (dy > 0) {
          this.game.movePlayer(DOWN);
        } else {
          this.game.movePlayer(UP);
        }
      }
    }
  }

  handleTouchCancel(e) {
    this.touchStartX = 0;
    this.touchStartY = 0;
  }
}
