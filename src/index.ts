import { Command } from 'commander';
import { interactiveMode } from './interactive.js';
import { formatTypo } from './utils.js';
import { checkFile } from './spelling.js';
import type { Typo } from './types.js';

function printTypos(typos: Typo[]): void {
  typos.forEach((typo) => {
    console.log(formatTypo(typo));
  });
}

function parseArgs(): { file: string; interactive: boolean } {
  const commander = new Command()
    .argument('[file]', 'file to spell-check (or pipe from stdin)')
    .option('-i, --interactive', 'toggle interactive mode', false)
    .parse();

  const [file] = commander.args;
  const opts = commander.opts<{ interactive: boolean }>();
  if (!file && process.stdin.isTTY) {
    commander.help();
  }

  return { file, interactive: opts.interactive };
}

async function main(): Promise<void> {
  const { file, interactive } = parseArgs();
  const typos = checkFile(file);

  if (interactive) {
    await interactiveMode(typos);
  } else {
    printTypos(typos);
  }
}

main();
