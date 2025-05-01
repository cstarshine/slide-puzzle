// Initialize the game when the page loads
window.onload = function() {
    const game = new GameManager();
    game.initGame();
    game.startGameLoop();
};
