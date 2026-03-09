import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export function loadCustomDictionary(): string[] {
  const dir = dirname(fileURLToPath(import.meta.url));
  const customDictFile = `${dir}/custom-dictionary.json`;

  if (!existsSync(customDictFile)) {
    writeFileSync(customDictFile, '[]');
  }

  return JSON.parse(readFileSync(customDictFile, 'utf8'));
}
