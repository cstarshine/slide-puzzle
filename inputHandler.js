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
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    document.addEventListener("keydown", this.handleKeyDown.bind(this));

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
}
