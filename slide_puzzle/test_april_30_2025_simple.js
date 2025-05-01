// Simple test script for April 30, 2025
// This script simulates the game for April 30, 2025 and checks the minimum moves

// Mock the document object
global.document = {
    getElementById: function(id) {
        return {
            textContent: '',
            className: '',
            value: ''
        };
    }
};

// Mock the window object
global.window = {
    location: {
        href: 'test_april_30_2025.html'
    }
};

// Load the required files
const fs = require('fs');
const vm = require('vm');

// Create a context for the scripts
const context = {
    console: console,
    document: global.document,
    window: global.window
};

// Load and execute the scripts in the context
const files = [
    'constants.js',
    'utils.js',
    'seededRandom.js',
     'mapCreator.js',
    'player.js'
];

files.forEach(file => {
    const script = fs.readFileSync(file, 'utf8');
    vm.runInNewContext(script, context);
});

// Create a function to test the game
function testApril302025() {
    console.log("Testing April 30, 2025...");
    
    // Create a date object for April 30, 2025
    const dateStr = "2025-04-30";
    const dateObj = new Date(dateStr + "T00:00:00");
    const dateTimeStr = dateObj.toISOString().split('.')[0]; // YYYY-MM-DDThh:mm:ss
    
    // Generate seed from date+time
    const seed = context.Utils.hashString(dateTimeStr);
    console.log("Seed:", seed);
    
    // Initialize random number generator with seed
    const rng = new context.SeededRandom(seed);
    
    // Initialize grid
    const grid = new context.MapCreator(rng);
    grid.initialize();
    
    // Initialize player
    const player = new context.Player(grid, rng);
    player.place();
    
    // Place target
    grid.placeTarget(player.pos);
    
    // Log player and target positions
    console.log("Player position:", player.initialPos);
    console.log("Target position:", grid.targetPos);
    
    // Check if the puzzle is solvable
    const result = grid.checkSolvable(player.initialPos, true);
    console.log("BFS result:", result);
    
    // Calculate possible paths manually
    console.log("Calculating possible paths manually...");
    
    // Try all four directions
    const directions = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
    for (let i = 0; i < 4; i++) {
        const path = player.calculateMovePath(i);
        console.log(`Direction ${directions[i]} (${i}):`, path);
        
        // Check if this path reaches the target
        const lastPos = path[path.length - 1];
        if (lastPos.x === grid.targetPos.x && lastPos.y === grid.targetPos.y) {
            console.log(`Target can be reached in 1 move by going ${directions[i]}`);
        }
    }
}

// Run the test
testApril302025();