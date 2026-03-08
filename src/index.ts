import wordlist from "wordlist-english";
import * as fs from "node:fs";
import { contractions } from "./contractions.js";

const englishWords = wordlist.english.concat(contractions);

// TODO: read in file from args
// TODO: read in multiple files from args
// TODO: read in stdin for piping
// TODO: custom words

fs.readFile(
  "example.txt",
  "utf8",
  (err: NodeJS.ErrnoException | null, data: string) => {
    if (err) {
      console.error(err);
      return;
    }

    const lines = data.split("\n");
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;
      checkLine(line, lineNumber);
    }
  },
);

function checkLine(line: string, lineNumber: number): void {
  line = cleanLine(line);

  if (!line) {
    return;
  }

  const words = line.split(/\s+/);

  for (const word of words) {
    if (checkWord(word)) {
      console.error(`Line ${lineNumber}: "${word}" appears to be a typo`);
    }
  }
}

function cleanLine(line: string): string {
  return line
    .replaceAll("-", " ")
    .replaceAll("—", " ")
    .replaceAll("–", " ")
    .replaceAll("'s", "")
    .replaceAll("'s", "")
    .replaceAll("/", " ")
    .replaceAll("@", " ")
    .replaceAll(/[^a-zA-Z' ]/g, "")
    .trim();
}

function checkWord(word: string): boolean {
  word = cleanWord(word);

  return (
    word !== "" &&
    isNaN(Number(word.toLowerCase())) &&
    !englishWords.includes(word.toLowerCase())
  );
}

function cleanWord(word: string): string {
  return word.replaceAll(/^['']+|['']+$/g, "").trim();
}
