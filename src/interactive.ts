import { createInterface, emitKeypressEvents } from 'node:readline';
import { openSync } from 'node:fs';
import { ReadStream } from 'node:tty';
import { formatTypo, replaceNth } from './utils.js';

import { Typo } from './types.js';
import { appendCustomDictionary, getCustomDictionary } from './custom-dict.js';

const OPTIONS = ['Fix', 'Add to Dictionary', 'Skip'] as const;
type Option = (typeof OPTIONS)[number];

let inputStream: ReadStream;

function getInputStream(): ReadStream {
  if (process.stdin.isTTY) {
    return process.stdin;
  }
  const fd = openSync('/dev/tty', 'r');
  return new ReadStream(fd);
}

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
      inputStream.setRawMode(false);
      process.exit();
    }

    if (key.name === 'up') {
      current = (current - 1 + OPTIONS.length) % OPTIONS.length;
      renderOptions(current, false);
    } else if (key.name === 'down') {
      current = (current + 1) % OPTIONS.length;
      renderOptions(current, false);
    } else if (key.name === 'return') {
      inputStream.setRawMode(false);
      resolve(OPTIONS[current]);
    } else if (_ >= '1' && _ <= String(OPTIONS.length)) {
      const index = Number(_) - 1;
      current = index;
      renderOptions(current, false);
      inputStream.setRawMode(false);
      resolve(OPTIONS[current]);
    }
  };
}

function promptOption(): Promise<Option> {
  return new Promise((resolve) => {
    renderOptions(0, true);

    inputStream.setRawMode(true);

    const handler = onKeypress(0, (option) => {
      inputStream.removeListener('keypress', handler);
      resolve(option);
    });

    inputStream.on('keypress', handler);
  });
}

function promptFix(word: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: inputStream,
      output: process.stdout,
    });
    const ask = (): void => {
      rl.question(`Replace "${word}" with: `, (answer) => {
        if (answer.trim() === '') {
          ask();
          return;
        }
        rl.close();
        inputStream.resume();
        resolve(answer.trim());
      });
    };
    ask();
  });
}

export async function interactiveMode(typos: Typo[]): Promise<Record<number, string>> {
  inputStream = getInputStream();
  emitKeypressEvents(inputStream);

  process.on('exit', () => {
    if (inputStream.isRaw) inputStream.setRawMode(false);
  });
  const fixedLinesMap: Record<number, string> = {};
  const fixCounts: Record<string, number> = {};

  for (const typo of typos) {
    if (getCustomDictionary().has(typo.word)) {
      continue;
    }

    const fixCountKey = `${typo.lineNumber}:${typo.word}`;
    const adjustedOccurrence = typo.occurrence - (fixCounts[fixCountKey] ?? 0);
    const context = fixedLinesMap[typo.lineNumber] ?? typo.context;

    console.log(formatTypo({ ...typo, context, occurrence: adjustedOccurrence }));

    const choice = await promptOption();

    switch (choice) {
      case 'Fix': {
        const fixedWord = await promptFix(typo.word);
        fixedLinesMap[typo.lineNumber] = replaceNth(
          context,
          typo.word,
          fixedWord,
          adjustedOccurrence
        );
        fixCounts[fixCountKey] = (fixCounts[fixCountKey] ?? 0) + 1;
        break;
      }
      case 'Add to Dictionary':
        appendCustomDictionary(typo.word);
        break;
      default:
        break;
    }
  }
  inputStream.setRawMode(false);
  inputStream.destroy();
  return fixedLinesMap;
}
