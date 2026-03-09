import type { CheckResult, Typo } from './types.js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import wordlist from 'wordlist-english';
import { getCustomDictionary } from './custom-dict.js';
import { contractions } from './contractions.js';

const dictionary = new Set(wordlist.english).union(contractions).union(getCustomDictionary());

function checkLine(originalLine: string, lineNumber: number): Typo[] {
  const typos: Typo[] = [];
  const line = cleanLine(originalLine);

  if (!line) {
    return [];
  }

  const words = line.split(/\s+/);
  const occurrences: Record<string, number> = {};

  for (const word of words) {
    if (!checkWord(word)) {
      continue;
    }
    occurrences[word] = (occurrences[word] ?? 0) + 1;
    typos.push({
      lineNumber,
      word,
      context: originalLine,
      occurrence: occurrences[word],
    });
  }
  return typos;
}

function cleanLine(line: string): string {
  return line
    .replaceAll('-', ' ')
    .replaceAll('—', ' ')
    .replaceAll('–', ' ')
    .replaceAll("'s", '')
    .replaceAll('\u2019s', '')
    .replaceAll('/', ' ')
    .replaceAll('@', ' ')
    .replaceAll(/[^a-zA-Z0-9' ]/g, ' ')
    .trim();
}

function checkWord(word: string): boolean {
  word = cleanWord(word);

  return word !== '' && isNaN(Number(word.toLowerCase())) && !dictionary.has(word.toLowerCase());
}

function cleanWord(word: string): string {
  return word.replaceAll(/^['']+|['']+$/g, '').trim();
}

export function checkFile(file: string): CheckResult {
  if (file && !existsSync(file)) {
    console.error(`Error: file not found: ${file}`);
    process.exit(1);
  }
  const text = readFileSync(file || '/dev/stdin', 'utf8');
  let typos: Typo[] = [];
  const lines = text.split(/\r?\n/);
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;
    typos = typos.concat(checkLine(line, lineNumber));
  }
  return { typos, lines };
}

export function fixFile(file: string, lines: string[], fixedLineMap: Record<number, string>) {
  if (Object.keys(fixedLineMap).length === 0) return;
  for (const [i, fixedLine] of Object.entries(fixedLineMap)) {
    lines[Number(i) - 1] = fixedLine;
  }
  const output = file || '/dev/stdout';
  writeFileSync(output, lines.join('\n'));
  if (file) console.log(`\n${file} saved`);
}
