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
    // Lower threshold for better sensitivity
    this.minSwipeDistance = 20;

    // Bind methods once to ensure 'this' context is always correct
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleTouchCancel = this.handleTouchCancel.bind(this);

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Keyboard events
    document.addEventListener("keydown", this.handleKeyDown);

    // Touch events - Attached to document to catch swipes anywhere
    // Passive: false is required to use preventDefault() in touchmove
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

    // UI Buttons
    const newGameBtn = document.getElementById("newGameBtn");
    if (newGameBtn) {
      newGameBtn.addEventListener("click", () => this.game?.initGame());
    }

    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => this.game?.resetPlayer());
    }

    const loadDateBtn = document.getElementById("loadDateBtn");
    if (loadDateBtn) {
      loadDateBtn.addEventListener("click", () => {
        const dateInput = document.getElementById("dateInput");
        if (dateInput && dateInput.value) {
          this.game.generateMapFromDate(dateInput.value);
        }
      });
    }
  }

  /**
   * Handle key down events
   * @param {KeyboardEvent} e - Key event
   */
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

  /**
   * Handle touch start event
   * @param {TouchEvent} e
   */
  handleTouchStart(e) {
    // We don't preventDefault here to allow button clicks to process normally

    if (e.changedTouches && e.changedTouches.length > 0) {
      this.touchStartX = e.changedTouches[0].clientX;
      this.touchStartY = e.changedTouches[0].clientY;
    }
  }

  /**
   * Handle touch move event to prevent scrolling
   * @param {TouchEvent} e
   */
  handleTouchMove(e) {
    // Strictly prevent default to stop scrolling/pull-to-refresh
    if (e.cancelable) {
      e.preventDefault();
    }
  }

  /**
   * Handle touch end event to detect swipes
   * @param {TouchEvent} e
   */
  handleTouchEnd(e) {
    if (this.game.animation && this.game.animation.isAnimating) return;

    if (!e.changedTouches || e.changedTouches.length === 0) return;

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

  /**
   * Resets touch coordinates if touch is cancelled
   */
  handleTouchCancel(e) {
    this.touchStartX = 0;
    this.touchStartY = 0;
  }
}
