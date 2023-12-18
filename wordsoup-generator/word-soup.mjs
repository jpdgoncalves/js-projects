
export default class WordSoup {
    static DIRECTIONS = {
        Right: [0, 1],
        DownRight: [1, 1],
        Down: [1, 0],
        DownLeft: [1, -1],
        Left: [0, -1],
        UpLeft: [-1, -1],
        Up: [-1, 0],
        UpRight: [-1, 1],
    };

    /**
     * @type {string[]}
     */
    #storage;

    /**
     * Dictionary containing the words
     * that have been placed so far, their location
     * and direction. The keys are created with
     * #createWordDictKey() method.
     * @type {Map<string, [string, [number, number], [number, number]]>}
     */
    #wordsDict = new Map();
    /**
     * Cells occupied by words
     */
    #wOccupation;
    /**
     * Cells occupied by chars
     */
    #cOccupation;

    #rowCount;
    #colCount;

    /**
     * 
     * @param {number} rowCount 
     * @param {number} colCount 
     */
    constructor(rowCount, colCount) {
        this.#rowCount = rowCount;
        this.#colCount = colCount;
        this.#wOccupation = new Array(rowCount * colCount);
        this.#wOccupation.fill(0);
        this.#cOccupation = new Array(rowCount * colCount);
        this.#cOccupation.fill(0);
        this.#storage = new Array(rowCount * colCount);
        this.#storage.fill(' ');
    }

    get rowCount() { return this.#rowCount }
    get colCount() { return this.#colCount }
    get solutions() { return this.#wordsDict.values() }

    computeFreeCells() {
        const freeCells = [];

        for (let r = 0; r < this.#rowCount; r++) {
            for (let c = 0; c < this.#colCount; c++) {
                const cell = [r, c];
                const idx = this.#calcIdx(cell);
                if (this.#cOccupation[idx] > 0 || this.#wOccupation[idx] > 0) continue;
                freeCells.push(cell);
            }
        }

        return freeCells;
    }

    get(loc) {
        const idx = this.#calcIdx(loc);

        if (idx < 0 && idx >= this.#storage.length) return ' '
        return this.#storage[idx];
    }

    set(char, loc) {
        const idx = this.#calcIdx(loc);

        if (idx < 0 || idx >= this.#storage.length) return false;
        if (this.#wOccupation[idx] > 0 || this.#cOccupation[idx] > 0) return false;

        this.#storage[idx] = char;
        this.#cOccupation[idx] = 1;
    }

    unset(loc) {
        const idx = this.#calcIdx(loc);
        
        if (idx < 0 || idx >= this.#storage.length) return false;
        if (this.#wOccupation[idx] > 0) return false;

        this.#storage[idx] = " ";
        this.#cOccupation[idx] = 0;
    }

    hasWord(word, loc, dir) {
        const key = this.#createWordDictKey(word, loc, dir);
        return this.#wordsDict.has(key);
    }

    place(word, loc, dir) {
        const key = this.#createWordDictKey(word, loc, dir);
        if (this.#wordsDict.has(key)) return false;
        if (!this.canFit(word, loc, dir)) return false;

        this.#wordsDict.set(key, [word, loc, dir]);
        for (
            let sIdx = this.#calcIdx(loc), idx = 0;
            idx < word.length;
            sIdx += this.#calcInc(dir), idx += 1
        ) {
            this.#storage[sIdx] = word[idx];
            this.#wOccupation[sIdx] += 1;
        }

        return true;
    }

    unplace(word, loc, dir) {
        const key = this.#createWordDictKey(word, loc, dir);
        if (!this.#wordsDict.has(key)) return false;

        this.#wordsDict.delete(key);
        for (
            let sIdx = this.#calcIdx(loc), idx = 0;
            idx < word.length;
            sIdx += this.#calcInc(dir), idx += 1
        ) {
            this.#storage[sIdx] = ' ';
            this.#wOccupation[sIdx] -= 1;
        }

        return true;
    }

    canFit(word, loc, dir) {
        const [row, col] = loc;
        const [rowInc, colInc] = dir;

        const sIdxStart = this.#calcIdx(loc);
        const sIdxEnd = this.#calcIdx([row + rowInc * word.length, col + colInc * word.length]);

        if (sIdxStart < 0 || sIdxStart >= this.#storage.length) return false;
        if (sIdxEnd < 0 || sIdxEnd >= this.#storage.length) return false;

        for (
            let sIdx = this.#calcIdx(loc), idx = 0;
            idx < word.length;
            sIdx += this.#calcInc(dir), idx += 1
        ) {
            if (this.#cOccupation[sIdx] > 0) return false
            if (this.#wOccupation[sIdx] > 0 && this.#storage[sIdx] != word[idx]) return false;
        }

        return true;
    }

    toString() {
        const grid = [];
        const rowCount = this.rowCount;
        const colCount = this.colCount;

        for (let r = 0; r < rowCount; r++) {
            for (let c = 0; c < colCount; c++) {
                grid.push(this.getChar(r, c))
            }
            grid.push("\n");
        }

        return grid.join("");
    }

    #calcIdx([row, col]) {
        return this.#colCount * row + col;
    }

    #calcInc([rowInc, colInc]) {
        return this.#colCount * rowInc + colInc;
    }

    #createWordDictKey(word, [r, c], [ri, ci]) {
        return `${word}-${r},${c}-${ri},${ci}`;
    }
}