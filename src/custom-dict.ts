import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const configDir = join(homedir(), '.config', 'spellchecker');
const customDictFile = join(configDir, 'custom-dictionary.json');
let customDict: Set<string> | null = null;

function loadCustomDictionary(): Set<string> {
  if (!existsSync(customDictFile)) {
    mkdirSync(configDir, { recursive: true });
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
