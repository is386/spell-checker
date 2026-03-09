import type { Typo } from './types.js';
import { readFileSync } from 'node:fs';
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
    .replaceAll("'s", '')
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

export function checkFile(file: string): Typo[] {
  const text = readFileSync(file || '/dev/stdin', 'utf8');
  let typos: Typo[] = [];
  const lines = text.split('\n');
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;
    typos = typos.concat(checkLine(line, lineNumber));
  }
  return typos;
}
