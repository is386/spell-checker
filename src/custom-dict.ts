import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const customDictFile = `${dir}/custom-dictionary.json`;
let customDict: Set<string> | null = null;

function loadCustomDictionary(): Set<string> {
  if (!existsSync(customDictFile)) {
    writeFileSync(customDictFile, '[]');
    return new Set();
  }

  customDict = new Set(JSON.parse(readFileSync(customDictFile, 'utf8')));
  return customDict;
}

export function getCustomDictionary(): Set<string> {
  if (customDict === null) {
    return loadCustomDictionary();
  }
  return customDict;
}

export function appendCustomDictionary(word: string): void {
  const dict = getCustomDictionary();
  dict.add(word.toLowerCase());
  writeFileSync(customDictFile, JSON.stringify([...dict]));
}
