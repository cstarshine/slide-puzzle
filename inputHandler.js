/**
 * InputHandler class to manage user input
 */
class InputHandler {
  /**
   * Create a new InputHandler
   * @param {GameManager} game - Game object
   */
  constructor(game) {
    this.game = game;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.minSwipeDistance = 30;
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("touchstart", this.handleTouchStart.bind(this), {
      passive: false,
    });
    document.addEventListener("touchend", this.handleTouchEnd.bind(this), {
      passive: false,
    });

    const newGameBtn = document.getElementById("newGameBtn");
    if (newGameBtn) {
      newGameBtn.addEventListener("click", () => this.game.initGame());
    }

    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => this.game.resetPlayer());
    }

    const loadDateBtn = document.getElementById("loadDateBtn");
    if (loadDateBtn) {
      loadDateBtn.addEventListener("click", () => {
        const dateInput = document.getElementById("dateInput");
        if (dateInput && dateInput.value) {
          this.game.generateMapFromDate(dateInput.value);
        } else {
        }
      });
    }
  }

  /**
   * Handle key down events
   * @param {Event} e - Key event
   */
  handleKeyDown(e) {
    if (this.game.animation.isAnimating) return;

    let direction;
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
      default:
        return; // Not an arrow key
    }

    this.game.movePlayer(direction);
  }

  /**
   * Handle touch start event
   * @param {TouchEvent} e
   */
  handleTouchStart(e) {
    this.touchStartX = e.changedTouches[0].clientX;
    this.touchStartY = e.changedTouches[0].clientY;
  }

  /**
   * Handle touch end event to detect swipes
   * @param {TouchEvent} e
   */
  handleTouchEnd(e) {
    if (this.game.animation.isAnimating) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const dx = touchEndX - this.touchStartX;
    const dy = touchEndY - this.touchStartY;

    // Check if movement is significant enough
    if (
      Math.abs(dx) > this.minSwipeDistance ||
      Math.abs(dy) > this.minSwipeDistance
    ) {
      // Determine mainly horizontal or vertical swipe
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal
        if (dx > 0) {
          this.game.movePlayer(RIGHT);
        } else {
          this.game.movePlayer(LEFT);
        }
      } else {
        // Vertical
        if (dy > 0) {
          this.game.movePlayer(DOWN);
        } else {
          this.game.movePlayer(UP);
        }
      }
    }
  }
}
