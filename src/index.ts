// TODO: interactive mode

import wordlist from "wordlist-english";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { contractions } from "./contractions.js";
import { Command } from "commander";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { exit } from "node:process";

interface Typo {
  lineNumber: number;
  word: string;
  context: string;
}

const typos: Typo[] = [];
let dictionary = new Set(wordlist.english.concat(contractions));

function checkFile(file: string): void {
  const text = readFileSync(file || "/dev/stdin", "utf8");
  const lines = text.split("\n");
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;
    checkLine(line, lineNumber);
  }
}

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
    !dictionary.has(word.toLowerCase())
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

function loadCustomDictionary(): void {
  const dir = dirname(fileURLToPath(import.meta.url));
  const customDictFile = `${dir}/custom-dictionary.json`;

  if (!existsSync(customDictFile)) {
    writeFileSync(customDictFile, "[]");
  }

  dictionary = dictionary.union(
    new Set(JSON.parse(readFileSync(customDictFile, "utf8"))),
  );
}

function parseArgs(): { file: string; interactive: boolean } {
  const commander = new Command()
    .argument("[file]", "file to spell-check (or pipe from stdin)")
    .option("-i --interactive", "toggle interactive mode", false)
    .parse();

  const [file] = commander.args;
  const opts = commander.opts<{ interactive: boolean }>();
  if (!file && process.stdin.isTTY) {
    commander.help();
    exit(0);
  }

  return { file, interactive: opts.interactive };
}

function main(): void {
  const { file, interactive } = parseArgs();
  loadCustomDictionary();
  checkFile(file);

  if (interactive) {
    return;
  } else {
    printTypos();
  }
}

main();
