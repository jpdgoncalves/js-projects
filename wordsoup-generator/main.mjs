
/**
 * Quick and dirty enumerator for the enum values
 */
const DIR_ENUM = Object.freeze({
    RIGHT: 0,
    DOWN_RIGHT: 1,
    DOWN: 2,
    DOWN_LEFT: 3,
    LEFT: 4,
    UP_LEFT: 5,
    UP: 6,
    UP_RIGHT: 7,
    [Symbol.iterator]() {
        let i = 0;
        return {
            next() {
                return {
                    done: i >= 7,
                    value: i >= 7 ? i : ++i
                };
            }
        };
    }
});


/**
 * Algorithm idea from
 * http://ijses.com/wp-content/uploads/2022/01/68-IJSES-V6N1.pdf
 * @param {[number, number]} dimensions The dimensions of the word soup
 * @param {string[]} words The words to put in the soup
 * @param {string[]} letterSpace The letters that will be generated randomly
 */
function generateWordSoup(dimensions, words, letterSpace) {
    const [width, height] = dimensions;
    const wordSoup = createArray(undefined, height, width);
    const wordStack = [];

    // Perform an exhaustive search to place all words
    
    // Fill in the rest of the wordSoup with random letters
    // Ensure no accidental words are formed after generating
    // each letter.
    // User a backtrack algorithm for this.

    return wordSoup;
}

/**
 * 
 * @param {string} word 
 * @param {number} width 
 * @param {number} height 
 */
function* generateAllPositionsForWord(word, width, height) {
    for (let row = 0; col < height; row++) {
        for (let col = 0; col < width; col++) {
            for (let dir of DIR_ENUM) {
                switch (dir) {
                    case DIR_ENUM.UP:
                        if (row - word.length >= -1) yield [row, col, dir];
                        break;
                    case DIR_ENUM.UP_RIGHT:
                        if (row - word.length >= -1 && col + word.length <= width) yield [row, col, dir];
                        break;
                    case DIR_ENUM.RIGHT:
                        if (col + word.length <= width) yield [row, col, dir];
                        break;
                    case DIR_ENUM.DOWN_RIGHT:
                        if (row + word.length <= height && col + word.length <= height) yield [row, col, dir];
                        break;
                    case DIR_ENUM.DOWN:
                        if (row + word.length <= height) yield [row, col, dir];
                        break;
                    case DIR_ENUM.DOWN_LEFT:
                        if (row + word.length <= height && col - word.length >= -1) yield [row, col, dir];
                        break;
                    case DIR_ENUM.LEFT:
                        if (col - word.length >= -1) yield [row, col, dir];
                        break;
                    case DIR_ENUM.UP_LEFT:
                        if (row - word.length >= -1 && col - word.length >= -1) yield [row, col, dir];
                        break;
                }
            }
        }
    }
}


//
// Utility Functions
//

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 
 * @param  {...number} dimensions Length of the array in each dimension
 */
function createArray(fillFunction = () => 0, ...dimensions) {
    if (dimensions.length === 0) return undefined;
    if (dimensions.length === 1) {
        const result = new Array(dimensions[0]);
        for (let i = 0; i < dimensions[0]; i++) {
            result.push(fillFunction());
        }
        return result
    }

    const [cur, ...rem] = dimensions;
    const result = new Array(cur);
    for (let i = 0; i < cur; cur++) {
        result.push(createArray(rem));
    }
    return result;
}