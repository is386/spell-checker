import { emitKeypressEvents } from 'node:readline';
import { formatTypo } from './utils.js';

import { Typo } from './types.js';
import { appendCustomDictionary, getCustomDictionary } from './custom-dict.js';

const OPTIONS = ['Fix', 'Add to Dictionary', 'Skip'] as const;
type Option = (typeof OPTIONS)[number];

function renderOptions(selected: number, initial: boolean): void {
  if (!initial) {
    process.stdout.write(`\x1b[${OPTIONS.length}A`);
  }
  for (let i = 0; i < OPTIONS.length; i++) {
    const prefix = i === selected ? '\x1b[32m> ' : '  ';
    const text =
      i === selected ? `\x1b[1m${i + 1}. ${OPTIONS[i]}\x1b[0m` : `${i + 1}. ${OPTIONS[i]}`;
    process.stdout.write(`\x1b[2K${prefix}${text}\n`);
  }
}

function onKeypress(
  selected: number,
  resolve: (option: Option) => void
): (str: string, key: { name: string; ctrl: boolean }) => void {
  let current = selected;

  return (_: string, key: { name: string; ctrl: boolean }) => {
    if (key.ctrl && key.name === 'c') {
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      process.exit();
    }

    if (key.name === 'up') {
      current = (current - 1 + OPTIONS.length) % OPTIONS.length;
      renderOptions(current, false);
    } else if (key.name === 'down') {
      current = (current + 1) % OPTIONS.length;
      renderOptions(current, false);
    } else if (key.name === 'return') {
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      resolve(OPTIONS[current]);
    } else if (_ >= '1' && _ <= String(OPTIONS.length)) {
      const index = Number(_) - 1;
      current = index;
      renderOptions(current, false);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      resolve(OPTIONS[current]);
    }
  };
}

function promptOption(): Promise<Option> {
  return new Promise((resolve) => {
    renderOptions(0, true);

    emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    const handler = onKeypress(0, (option) => {
      process.stdin.removeListener('keypress', handler);
      resolve(option);
    });

    process.stdin.on('keypress', handler);
  });
}

export async function interactiveMode(typos: Typo[]): Promise<void> {
  for (const typo of typos) {
    if (getCustomDictionary().has(typo.word)) {
      continue;
    }

    console.log(formatTypo(typo));
    const choice = await promptOption();

    switch (choice) {
      case 'Fix':
        break;
      case 'Add to Dictionary':
        appendCustomDictionary(typo.word);
        break;
      default:
        break;
    }
  }
  process.stdin.pause();
}
