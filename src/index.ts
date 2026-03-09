// TODO: interactive mode

import wordlist from "wordlist-english";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { contractions } from "./contractions.js";
import { Command } from "commander";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

interface Typo {
  lineNumber: number;
  word: string;
  context: string;
  occurrence: number;
}

const dictionary = new Set(
  wordlist.english.concat(contractions).concat(loadCustomDictionary()),
);

function checkFile(file: string): Typo[] {
  const text = readFileSync(file || "/dev/stdin", "utf8");
  let typos: Typo[] = [];
  const lines = text.split("\n");
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;
    typos = typos.concat(checkLine(line, lineNumber));
  }
  return typos;
}

function checkLine(originalLine: string, lineNumber: number): Typo[] {
  const typos: Typo[] = [];
  const line = cleanLine(originalLine);

  if (!line) {
    return [];
  }

  const words = line.split(/\s+/);
  const occurrences: Record<string, number> = {};

  for (const word of words) {
    if (checkWord(word)) {
      occurrences[word] = (occurrences[word] ?? 0) + 1;
      typos.push({
        lineNumber,
        word,
        context: originalLine,
        occurrence: occurrences[word],
      });
    }
  }
  return typos;
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
    .replaceAll(/[^a-zA-Z0-9' ]/g, " ")
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

function underline(s: string): string {
  return `\x1b[4:3m\x1b[31m${s}\x1b[0m`;
}

function replaceNth(
  str: string,
  search: string,
  replacement: string,
  n: number,
): string {
  let count = 0;
  return str.replace(
    new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
    (match) => {
      count++;
      return count === n ? replacement : match;
    },
  );
}

function printTypos(typos: Typo[]): void {
  typos.forEach((typo) => {
    console.log(
      `\nLine ${typo.lineNumber}: ${replaceNth(typo.context, typo.word, underline(typo.word), typo.occurrence)}`,
    );
  });
}

function loadCustomDictionary(): string[] {
  const dir = dirname(fileURLToPath(import.meta.url));
  const customDictFile = `${dir}/custom-dictionary.json`;

  if (!existsSync(customDictFile)) {
    writeFileSync(customDictFile, "[]");
  }

  return JSON.parse(readFileSync(customDictFile, "utf8"));
}

function parseArgs(): { file: string; interactive: boolean } {
  const commander = new Command()
    .argument("[file]", "file to spell-check (or pipe from stdin)")
    .option("-i, --interactive", "toggle interactive mode", false)
    .parse();

  const [file] = commander.args;
  const opts = commander.opts<{ interactive: boolean }>();
  if (!file && process.stdin.isTTY) {
    commander.help();
  }

  return { file, interactive: opts.interactive };
}

function main(): void {
  const { file, interactive } = parseArgs();
  const typos = checkFile(file);

  if (interactive) {
    return;
  } else {
    printTypos(typos);
  }
}

main();
