import { Typo } from './types.js';

function underline(s: string): string {
  return `\x1b[4:3m\x1b[31m${s}\x1b[0m`;
}

function replaceNth(str: string, search: string, replacement: string, n: number): string {
  let count = 0;
  return str.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), (match) => {
    count++;
    return count === n ? replacement : match;
  });
}

export function formatTypo(typo: Typo): string {
  return `\nLine ${typo.lineNumber}: ${replaceNth(typo.context, typo.word, underline(typo.word), typo.occurrence)}`;
}
