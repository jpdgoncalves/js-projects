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

/**
 * 
 * @param {*} expected 
 * @param {import("./word-soup.mjs").default} grid 
 * @param {*} index 
 * @param {*} wordList 
 * @param {*} location 
 * @param {*} dirList 
 * @returns 
 */
function hasUnexpectedSolutions(
  expected,
  grid,
  index,
  wordList,
  location,
  dirList,
) {
  const [row, col] = location;
  const char = grid.get(location);

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
          grid.hasWord(word, [rowStart, colStart], direction) &&
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

/**
 * 
 * @param {*} word 
 * @param {import("./word-soup.mjs").default} grid 
 * @param {*} directions 
 * @returns 
 */
function generateAndShuffleWordPositions(word, grid, directions) {
  const rowCount = grid.rowCount;
  const colCount = grid.colCount;
  const positions = [];

  if (word.length > rowCount || word.length > colCount) return [];

  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      for (let direction of directions) {

        if (grid.canFit(word, [r, c], direction))

        positions.push([[r, c], direction]);
      }
    }
  }

  shuffle(positions);
  return positions;
}

/**
 * 
 * @param {import("./word-soup.mjs").default} grid 
 * @param {string[]} wordList 
 * @param {string[]} charSpace 
 */
export function createWordSearchPuzzle(grid, wordList, charSpace) {
  const charPosIndex = buildCharPositionIndex(wordList);
  const expectedSolutions = new Map();
  const directions = [...Object.values(WORD_DIRECTIONS)];

  const wordListCp = [...wordList].sort((a, b) => b.length - a.length);
  const wordPositionsList = wordListCp.map((w) => {
    return { w, p: 0, l: generateAndShuffleWordPositions(w, grid, directions)};
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
      const success = grid.place(wordInfo.w, loc, dir);
      //     if previous fails increment pointer go to 1:
      if (!success) {
        wordInfo.p += 1;
        continue posLoop;
      }

      //     place word in expected solutions
      if (!expectedSolutions.has(wordInfo.w)) expectedSolutions.set(wordInfo.w, new Set());
      expectedSolutions.get(wordInfo.w).add(createLocationKey(loc, dir));
      //     from (position) to (position + word.length)
      let [rowStart, colStart] = loc;
      const [rowInc, colInc] = dir;
      for (let idx = 0; idx < wordInfo.w.length; rowStart += rowInc, colStart += colInc, idx++) {
        //       if hasUnexpectedSolution increment pointer go to 1:
        if (hasUnexpectedSolutions(expectedSolutions, grid, charPosIndex, wordListCp, [rowStart, colStart], directions)) {
          grid.unplace(word, loc, dir);
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
    if (wp >= 0) grid.unplace(b, p, d);
  }

  // if wp < 0 then we failed to place the words
  if (wp < 0) return false;



  // Build a list with all unocupied positions.
  // The entries are [pos, shuffedLetters]
  const unocupiedPosList = [...grid.unocupied].map((pos) => {
    return { pos, l: shuffle([...charSpace]), idx: 0 }
  });

  // For each unocupied position make a similar procedure to the above.
  let posP = 0;
  posLoop: while (posP >= 0 && posP < unocupiedPosList.length) {
    const posInfo = unocupiedPosList[posP];

    charLoop: while (posInfo.idx < posInfo.l.length) {
      const char = posInfo.l[posInfo.idx];
      grid.set(char, posInfo.pos);

      if (hasUnexpectedSolutions(expectedSolutions, grid, charPosIndex, wordListCp, posInfo.pos, directions)) {
        grid.unset(posInfo.pos);
        posInfo.idx += 1;
        continue charLoop;
      }

      posP += 1;
      continue posLoop;
    }

    posP -= 1;
    posInfo.idx = 0;
    grid.unset(posInfo.pos);
  }

  return posP >= 0;
}
