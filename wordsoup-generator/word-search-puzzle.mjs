
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
        let i = 0
        return {
            next() {
                return {
                    done: i >= 7,
                    value: i >= 7 ? i : ++i
                }
            }
        }
    }
})

const PLACEMENT_DIR_ENUM = Object.freeze({
    [DIR_ENUM.RIGHT]: [1, 0],
    [DIR_ENUM.DOWN_RIGHT]: [1, -1],
    [DIR_ENUM.DOWN]: [0, -1],
    [DIR_ENUM.DOWN_LEFT]: [-1, -1],
    [DIR_ENUM.LEFT]: [-1, 0],
    [DIR_ENUM.UP_LEFT]: [-1, 1],
    [DIR_ENUM.UP]: [0, 1],
    [DIR_ENUM.UP_RIGHT]: [1, 1],
})

const FITS_ENUM = Object.freeze({
    [DIR_ENUM.RIGHT]: (x, y, wLen, width, height) => x + wLen <= width,
    [DIR_ENUM.DOWN_RIGHT]: (x, y, wLen, width, height) => x + wLen <= width && y + wLen <= height,
    [DIR_ENUM.DOWN]: (x, y, wLen, width, height) => y + wLen <= height,
    [DIR_ENUM.DOWN_LEFT]: (x, y, wLen, width, height) => x - wLen >= -1 && y + wLen <= height,
    [DIR_ENUM.LEFT]: (x, y, wLen, width, height) => x - wLen >= -1,
    [DIR_ENUM.UP_LEFT]: (wLen, width, height) => x - wLen >= -1 && y - wLen >= -1,
    [DIR_ENUM.UP]: (x, y, wLen, width, height) => x + wLen <= width,
    [DIR_ENUM.UP_RIGHT]: (x, y, wLen, width, height) => x + wLen <= width && x + wLen <= width,
})

class WordSearchPuzzleData {

    /**
     * Height of the puzzle in grid cells
     */
    #height
    /**
     * Width of the puzzle in grid cells
     */
    #width
    /**
     * Grid of the puzzle
     * @type {string[][]}
     */
    #grid
    /**
     * Positions occupied by words
     * @type {int[][]}
     */
    #occupationGrid
    /**
     * Words placed in the puzzle
     * @type {Map<string, [string, number, number, number]>}
     */
    #words = new Map()

    /**
     * 
     * @param {number} width Width of the puzzle in cells
     * @param {number} height Height of the puzzle in cells
     */
    constructor(width, height) {
        this.#width = width
        this.#height = height

        this.#grid = new Array(height)
        this.#occupationGrid = new Array(height)
        for (let row = 0; row < height; row++) {
            this.#grid[row] = new Array(width)

            this.#occupationGrid[row] = new Array(width)
            this.#occupationGrid[row].fill(0)
        }
    }

    /**
     * @param {string} word
     * @param {[number, number, number]} position
     * @returns {boolean}
     */
    tryPlaceWord(word, position) {
        const [row, col, dir] = position
        const key = `${word}-${row}-${col}-${dir}`
        if (!FITS_ENUM[dir](row, col, word.length, this.#width, this.#height)) return false
        if (this.#words.has(key)) return false;     
        if (!this.#verifyPlacement(word, position)) return false;

        let r = row, c = col
        let [rInc, cInc] = PLACEMENT_DIR_ENUM[dir];
        for (let char of word) {
            this.#occupationGrid[r][c] += 1;
            this.#grid[r][c] = char;
            r += rInc;
            c += cInc;
        }
        this.#words.set(key, [word, row, col, dir]);

        return true
    }

    /**
     * 
     * @param {string} word 
     * @param {number} position 
     */
    #verifyPlacement(word, position) {
        const [row, col, dir] = position
        let r = row, c = col
        const [rInc, cInc] = PLACEMENT_DIR_ENUM[dir]

        for (let char of word) {
            if (this.#occupationGrid[r][c] > 0 && this.#grid[r][c] != char) return false;
            r += rInc;
            c += cInc;
        }

        return true
    }

    /**
     * 
     * @param {string} word 
     * @param {[number, number, number]} position
     */
    removeWord(word, position) {
        const [row, col, dir] = position
        const key = `${word}-${row}-${col}-${dir}`
        let r = row, c = col
        let [rInc, cInc] = PLACEMENT_DIR_ENUM[dir];

        if (!this.#words.has(key)) return true;

        for (let _ of word) {
            this.#occupationGrid[r][c] -= 1;
            if (this.#occupationGrid[r][c] == 0) this.#grid[r][c] = undefined;
            r += rInc;
            c += cInc;
        }

        this.#words.delete(key)
    }

    /**
     * 
     * @param {string[]} letterSpace 
     */
    randomizeRemainingSpaces(letterSpace) {
        
        return true
    }

    get grid() {
        return this.#grid
    }

    /**
     * @type {[string, [number, number, number]][]}
     */
    get solutions() {
        const solutions = []
        this.#words.forEach(([word, row, col, dir]) => {solutions.push( [word, [row, col, dir]] )})
        return solutions
    }
}

class WordData {
    /**
     * The string this word corresponds to.
     */
    #str
    /**
     * List of possible combinations
     * @type {[number, number, number][]}
     */
    #positions = []
    /**
     * The current position index
     */
    #posIdx = 0

    /**
     * 
     * @param {WordSearchPuzzleData} puzzle 
     * @param {string} str 
     */
    constructor(puzzle, str) {
        this.#str = str

        for (let row = 0; row < puzzle.height; row++) {
            for (let col = 0; col < puzzle.width; col++) {
                for (let dir of DIR_ENUM) {
                    this.#positions.push([row, col, dir])
                }
            }
        }
        this.regeneratePositions()
    }

    regeneratePositions() {
        shuffleArray(this.#positions)
        this.#posIdx = 0
    }

    next() {
        if (this.#posIdx >= this.#positions.length - 1) return false
        this.#posIdx++
        return true
    }

    get pos() {
        return this.#positions[this.#posIdx]
    }

    get str() {
        return this.#str
    }
}


//
// Utility Functions
//

/**
 * 
 * @param {any[]} array 
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = getRandomInt(0, i)
        let tmp = array[i]
        array[i] = array[j]
        array[j] = tmp
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
}