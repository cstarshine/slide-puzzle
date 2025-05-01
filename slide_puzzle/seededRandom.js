/**
 * Seeded random number generator
 */
class SeededRandom {
    /**
     * Create a new SeededRandom instance
     * @param {number} seed - Seed value
     */
    constructor(seed) {
        this.seed = seed;
    }

    /**
     * Get random number between 0 and 1
     * @returns {number} - Random number between 0 and 1
     */
    random() {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    /**
     * Get random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} - Random integer between min and max
     */
    randomInt(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }
}
