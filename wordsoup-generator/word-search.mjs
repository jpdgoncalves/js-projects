const WORD_DIRECTIONS = {
  Right: [0, 1],
  DownRight: [1, 1],
  Down: [1, 0],
  DownLeft: [1, -1],
  Left: [0, -1],
  UpLeft: [-1, -1],
  Up: [-1, 0],
  UpRight: [-1, 1],
};

export class WordSoup {
  #occupation;
  #storage;
  /**
   * Map of pair of locations and string
   * and their raw format.
   * The pairs are "row-col": [row, col]
   * @type {Map<string, [number, number]>}
   */
  #unocupied = new Map();
  #width;

  /**
   * @type {Map<string, Set<string>>}
   */
  solutions = new Map();

  constructor(rowCount, colCount) {
    this.#occupation = new Array(rowCount * colCount);
    this.#occupation.fill(0);
    this.#storage = new Array(rowCount * colCount);
    this.#storage.fill(' ');
    this.#width = colCount;

    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        this.#unocupied.set(this.#createLocKey(r, c), [r, c]);
      }
    }
  }

  get colCount() {
    return this.#width;
  }

  get rowCount() {
    return this.#storage.length / this.#width;
  }

  get unocupied() {
    return this.#unocupied.values();
  }

  getChar(row, col) {
    const idx = this.#width * row + col;
    if (col >= this.#width || idx >= this.#storage.length) return undefined;

    return this.#storage[idx];
  }

  getOccupation(row, col) {
    const idx = this.#width * row + col;
    if (col >= this.#width || idx >= this.#storage.length) return undefined;

    return this.#occupation[this.#width * row + col];
  }

  setChar(char, row, col) {
    const idx = this.#width * row + col;
    if (col >= this.#width || idx >= this.#storage.length)
      throw new RangeError(
        `(${row},${col}) is out of range. Grid size is ${this.rowCol} rows and ${this.colCount} columns`,
      );
    if (this.#occupation[idx] > 0 && this.#storage[idx] != char) return false;

    this.#occupation[idx] += 1;
    this.#unocupied.delete(this.#createLocKey(row, col));
    this.#storage[idx] = char;
    return true;
  }

  unsetChar(row, col) {
    const key = this.#createLocKey(row, col);
    if (this.#unocupied.has(key)) return;

    const idx = this.#width * row + col;
    if (col >= this.#width || idx >= this.#storage.length)
      throw new RangeError(
        `(${row},${col}) is out of range. Grid size is ${this.rowCol} rows and ${this.colCount} columns`,
      );

    this.#occupation[idx] -= 1;
    if (this.#occupation[idx] == 0) {
      this.#unocupied.set(key, [row, col]);
      this.#storage[idx] = ' ';
    }
  }

  toString() {
    const grid = [];
    const rowCount = this.rowCount;
    const colCount = this.colCount;

    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        grid.push(this.getChar(r,c))
      }
      grid.push("\n");
    }

    return grid.join("");
  }

  #createLocKey(row, col) {
    return `${row}-${col}`
  }
}

function createLocationKey(location, direction) {
  return `${location[0]}-${location[1]}.${direction[0]}-${direction[1]}`;
}

function buildCharPositionIndex(wordList) {
  /**
  index = Map<word, Map<char, List[pos]>>
  */
  const index = new Map();

  for (let word of wordList) {
    let charPosIdx = new Map();

    for (let idx = 0; idx < word.length; idx++) {
      const char = word[idx];
      if (!charPosIdx.has(char)) charPosIdx.set(char, []);
      charPosIdx.get(char).push(idx);
    }

    index.set(word, charPosIdx);
  }

  return index;
}

function hasWord(word, grid, start, direction) {
  const rowCount = grid.rowCount;
  const colCount = grid.colCount;
  const [rowStart, colStart] = start;
  const [rowInc, colInc] = direction;

  if (rowStart < 0 || colStart < 0) return false;

  let idx = 0;
  for (
    let r = rowStart, c = colStart;
    r < rowCount && c < colCount && idx < word.length;
    r += rowInc, c += colInc, idx++
  ) {
    if (word[idx] != grid.getChar(r, c)) return false;
  }

  return idx == word.length;
}

function hasUnexpectedSolutions(
  expected,
  grid,
  index,
  wordList,
  location,
  dirList,
) {
  const [row, col] = location;
  const char = grid.getChar(row, col);

  // For each word
  for (let word of wordList) {
    // Get the char position index for this word
    if (!index.has(word)) continue;
    const charPosIdx = index.get(word);

    // Get the positions this letter is in the word
    if (!charPosIdx.has(char)) continue;
    const posList = charPosIdx.get(char);

    // For each direction this word can be placed
    for (let direction of dirList) {
      const [rowInc, colInc] = direction;

      // For each of those positions
      for (let charPos of posList) {
        // If the direction is from left to right then we have to backtrack a few characters
        // If the opposite we have to add. The minus sign gives us this.
        // This gives us the hypothetical start of the word.
        const rowStart = row - charPos * rowInc;
        const colStart = col - charPos * colInc;
        const locationKey = createLocationKey([rowStart, colStart], direction);

        // If the grid has the word, we check if it is within the
        // expected solutions. If it isn't then we found an
        // unexpected solution.
        if (
          hasWord(word, grid, [rowStart, colStart], direction) &&
          !expected.get(word).has(locationKey)
        )
          return true;
      }
    }
  }

  // We searched for all the words in all the possible positions
  // for the char at the location in question and didn't
  // find any unexpected solution.
  return false;
}

function placeWord(word, location, direction, grid) {
  const backtrack = [];
  const rowCount = grid.rowCount;
  const colCount = grid.rowCount;
  const [rowStart, colStart] = location;
  const [rowInc, colInc] = direction;
  const rowEnd = rowStart + rowInc * word.length;
  const colEnd = colStart + colInc * word.length;

  // Check if the end of the word idx is less than 0 or higher than the max index
  if (rowEnd < 0 || rowEnd > rowCount) return [false, []];
  if (colEnd < 0 || colEnd > colCount) return [false, []];

  // Place the letters
  for (
    let r = rowStart, c = colStart, idx = 0;
    idx < word.length;
    r += rowInc, c += colInc, idx++
  ) {
    // We might intercept another word
    // but at a letter that's not the same.
    // In such circunstances we have to backtrack.
    backtrack.push(grid.getChar(r, c));

    // TODO: This doesn't work. Due to how the grid
    // works we can't overwrite a character without
    // unsetting it first.
    if (!grid.setChar(word[idx], r, c)) {
      // This should always be successful.
      placeWord(backtrack.join(''), location, direction, grid);
      return [false, []];
    }
  }

  return [true, [backtrack.join(''), location, direction]];
}

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

function generateAndShuffleWordPositions(word, grid, directions) {
  const rowCount = grid.rowCount;
  const colCount = grid.colCount;
  const positions = [];

  if (word.length > rowCount || word.length > colCount) return [];

  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      for (let direction of directions) {
        const [rowInc, colInc] = direction;
        const rowEnd = r + rowInc * word.length;
        const colEnd = c + colInc * word.length;

        // Check if the end of the word idx is less than 0 or higher than the max index
        if (rowEnd < 0 || rowEnd > rowCount) continue;
        if (colEnd < 0 || colEnd > colCount) continue;

        positions.push([[r, c], direction]);
      }
    }
  }

  shuffle(positions);
  return positions;
}

/**
 * 
 * @param {WordSoup} grid 
 * @param {string[]} wordList 
 * @param {string[]} charSpace 
 */
export function createWordSearchPuzzle(grid, wordList, charSpace) {
  const charPosIndex = buildCharPositionIndex(wordList);
  const expectedSolutions = new Map();
  const directions = [...Object.values(WORD_DIRECTIONS)];

  const wordListCp = [...wordList].sort((a, b) => b.length - a.length);
  const wordPositionsList = wordListCp.map((w) => {
    return { w, p: 0, l: generateAndShuffleWordPositions(w, grid, directions), b: undefined };
  });

  // initialize a pointer for the list to 0
  let wp = 0;
  // 2: while the pointer is greater than 0 and lower than the length of the list
  wordLoop: while (wp >= 0 && wp < wordPositionsList.length) {
    //   get wordList[pointer]
    const wordInfo = wordPositionsList[wp];
    //   get enumerationList[word]
    //   1: while the enumeration pointer is lower than its length
    posLoop: while (wordInfo.p < wordInfo.l.length) {
      const pos = wordInfo.l[wordInfo.p]
      //     get enumeration[pointer]
      const [loc, dir] = pos;
      //     try placeWord(word, position)
      const [success, backtrack] = placeWord(wordInfo.w, loc, dir, grid);
      //     if previous fails increment pointer go to 1:
      if (!success) {
        wordInfo.p += 1;
        continue posLoop;
      }

      wordInfo.b = backtrack;
      //     place word in expected solutions
      if (!expectedSolutions.has(wordInfo.w)) expectedSolutions.set(wordInfo.w, new Set());
      expectedSolutions.get(wordInfo.w).add(createLocationKey(loc, dir));
      //     from (position) to (position + word.length)
      let [rowStart, colStart] = loc;
      const [rowInc, colInc] = dir;
      for (let idx = 0; idx < wordInfo.w.length; rowStart += rowInc, colStart += colInc, idx++) {
        //       if hasUnexpectedSolution increment pointer go to 1:
        if (hasUnexpectedSolutions(expectedSolutions, grid, charPosIndex, wordListCp, [rowStart, colStart], directions)) {
          placeWord(backtrack[0], loc, dir, grid);
          wordInfo.p += 1;
          continue posLoop;
        }
      }
      //     increment pointer and go to 2:
      wp += 1;
      continue wordLoop;
    }
    //   reset pos pointer
    wordInfo.p = 0;
    //   decrement word pointer
    wp -= 1;
    //   backtrack the previously placed word
    const [b, p, d] = wordPositionsList[wp].b;
    if (wp >= 0) placeWord(b, p, d, grid);
  }

  // if wp < 0 then we failed to place the words
  if (wp < 0) return false;



  // Build a list with all unocupied positions.
  // The entries are [pos, shuffedLetters]
  const unocupiedPosList = [...grid.unocupied].map((pos) => {
    return { pos, l: shuffle([...charSpace]), idx: 0}
  });

  // For each unocupied position make a similar procedure to the above.
  let posP = 0;
  loop: while (posP >= 0 && posP < unocupiedPosList.length) {
    const posInfo = unocupiedPosList[posP];
    const [row, col] = posInfo.pos;

    pLoop: while (posInfo.idx < posInfo.l.length) {
      const char = posInfo.l[posInfo.idx];
      grid.setChar(char, row, col);

      if (hasUnexpectedSolutions(expectedSolutions, grid, charPosIndex, wordListCp, posInfo.pos, directions)) {
        grid.unsetChar(row, col);
        posInfo.idx += 1;
        continue pLoop;
      }

      posP += 1;
      continue loop;
    }

    posP -= 1;
    posInfo.idx = 0;
    grid.unsetChar(row, col);
  }

  grid.solutions = expectedSolutions;
  return posP >= 0;
}
