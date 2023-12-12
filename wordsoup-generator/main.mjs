import { createWordSearchPuzzle, WordSoup } from "./word-search.mjs";

const words = ["THE"];
const letters = ["T", "H", "E"];
const CHARACTERS = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
  ];
const grid = new WordSoup(20, 20);

createWordSearchPuzzle(grid, words, letters);
console.log(grid.solutions.get("THE"));
console.log(grid.toString());