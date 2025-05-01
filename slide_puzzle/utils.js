/**
 * Utility class with static helper methods
 */
class Utils {
    /**
     * Simple hash function to convert string to number
     * @param {string} str - String to hash
     * @returns {number} - Hash value
     */
    static hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Check if two positions are adjacent or the same
     * @param {Object} pos1 - First position {x, y}
     * @param {Object} pos2 - Second position {x, y}
     * @returns {boolean} - True if positions are adjacent or the same
     */
    static arePositionsAdjacent(pos1, pos2) {
        // Check if positions are the same
        if (pos1.x === pos2.x && pos1.y === pos2.y) {
            return true;
        }

        // Check if positions are adjacent horizontally or vertically
        const dx = Math.abs(pos1.x - pos2.x);
        const dy = Math.abs(pos1.y - pos2.y);

        return (dx <= 1 && dy <= 1);
    }

    /**
     * Check if two positions are exactly the same
     * @param {Object} pos1 - First position {x, y}
     * @param {Object} pos2 - Second position {x, y}
     * @returns {boolean} - True if positions are exactly the same
     */
    static arePositionsEqual(pos1, pos2) {
        return pos1.x === pos2.x && pos1.y === pos2.y;
    }

    /**
     * Calculate animation duration based on distance
     * @param {Object} pos1 - Start position {x, y}
     * @param {Object} pos2 - End position {x, y}
     * @returns {number} - Animation duration in milliseconds
     */
    static calculateAnimationDuration(pos1, pos2) {
        // Calculate distance between cells
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Return animation duration (100ms per unit distance)
        return distance * 100;
    }
}
