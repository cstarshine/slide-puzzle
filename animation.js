class Animation {
  constructor(player, onComplete) {
    this.player = player;
    this.onComplete = onComplete;
    this.isAnimating = false;
    this.path = [];
    this.currentStep = 0;
    this.startTime = 0;
    this.duration = 150;
  }

  start(path) {
    if (path.length <= 1) return;

    this.path = path;
    this.currentStep = 0;
    this.isAnimating = true;
    this.startTime = 0;
    requestAnimationFrame(this.animate.bind(this));
  }

  stop() {
    this.isAnimating = false;
    this.path = [];
    this.currentStep = 0;
    this.startTime = 0;
  }

  animate(timestamp) {
    if (!this.isAnimating) return;

    if (!this.startTime) {
      this.startTime = timestamp;

      if (this.currentStep < this.path.length - 1) {
        const currentPos = this.path[this.currentStep];
        const nextPos = this.path[this.currentStep + 1];

        this.duration = Utils.calculateAnimationDuration(currentPos, nextPos);
      }
    }

    const elapsed = timestamp - this.startTime;

    if (this.currentStep >= this.path.length - 1) {
      this.isAnimating = false;
      this.startTime = 0;

      this.player.pos.x = this.path[this.path.length - 1].x;
      this.player.pos.y = this.path[this.path.length - 1].y;
      this.player.pixelPos.x = this.player.pos.x * CELL_SIZE + CELL_SIZE / 2;
      this.player.pixelPos.y = this.player.pos.y * CELL_SIZE + CELL_SIZE / 2;

      this.player.grid.setCellType(
        this.player.pos.x,
        this.player.pos.y,
        PLAYER,
      );

      if (this.onComplete) {
        this.onComplete();
      }

      return;
    }

    const currentPos = this.path[this.currentStep];
    const nextPos = this.path[this.currentStep + 1];

    const currentCellCenter = {
      x: currentPos.x * CELL_SIZE + CELL_SIZE / 2,
      y: currentPos.y * CELL_SIZE + CELL_SIZE / 2,
    };

    const nextCellCenter = {
      x: nextPos.x * CELL_SIZE + CELL_SIZE / 2,
      y: nextPos.y * CELL_SIZE + CELL_SIZE / 2,
    };

    const cellProgress = Math.min(elapsed / this.duration, 1);

    this.player.pixelPos.x =
      currentCellCenter.x +
      (nextCellCenter.x - currentCellCenter.x) * cellProgress;
    this.player.pixelPos.y =
      currentCellCenter.y +
      (nextCellCenter.y - currentCellCenter.y) * cellProgress;

    if (cellProgress >= 1) {
      this.player.pos.x = nextPos.x;
      this.player.pos.y = nextPos.y;

      this.currentStep++;
      this.startTime = timestamp;

      if (this.currentStep < this.path.length - 1) {
        const currentPos = this.path[this.currentStep];
        const nextPos = this.path[this.currentStep + 1];

        this.duration = Utils.calculateAnimationDuration(currentPos, nextPos);
      }
    }

    if (this.isAnimating) {
      requestAnimationFrame(this.animate.bind(this));
    }
  }
}
