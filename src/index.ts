// TODO: custom words
// TODO: interactive mode

import wordlist from "wordlist-english";
import { readFileSync } from "node:fs";
import { contractions } from "./contractions.js";
import { Command } from "commander";

interface Typo {
  lineNumber: number;
  word: string;
  context: string;
}

const typos: Typo[] = [];
const englishWords = new Set(wordlist.english.concat(contractions));

function checkLine(originalLine: string, lineNumber: number): void {
  const line = cleanLine(originalLine);

  if (!line) {
    return;
  }

  const words = line.split(/\s+/);

  for (const word of words) {
    if (checkWord(word)) {
      typos.push({ lineNumber, word, context: originalLine });
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
    .replaceAll(/[^a-zA-Z' ]/g, " ")
    .trim();
}

function checkWord(word: string): boolean {
  word = cleanWord(word);

  return (
    word !== "" &&
    isNaN(Number(word.toLowerCase())) &&
    !englishWords.has(word.toLowerCase())
  );
}

function cleanWord(word: string): string {
  return word.replaceAll(/^['']+|['']+$/g, "").trim();
}

function underline(s: string) {
  return `\x1b[4:3m\x1b[31m${s}\x1b[0m`;
}

function printTypos(): void {
  typos.forEach((typo) => {
    console.log(
      `\nLine ${typo.lineNumber}: ${typo.context.replace(typo.word, underline(typo.word))}`,
    );
  });
}

function main(): void {
  const commander = new Command()
    .argument("[file]", "file to spell-check (or pipe from stdin)")
    .option("-i --interactive", "toggle interactive mode", false)
    .parse();

  const [file] = commander.args;
  const opts = commander.opts<{ interactive: boolean }>();

  if (!file && process.stdin.isTTY) {
    commander.help();
  }

  const text = readFileSync(file || "/dev/stdin", "utf8");

  const lines = text.split("\n");
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;
    checkLine(line, lineNumber);
  }

  if (opts.interactive) {
    return;
  } else {
    printTypos();
  }
}

main();
