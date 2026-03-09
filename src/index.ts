import { Command } from 'commander';
import { interactiveMode } from './interactive.js';
import { formatTypo } from './utils.js';
import { checkFile, fixFile } from './spelling.js';
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
  const { typos, lines } = checkFile(file);

  if (interactive) {
    const fixedLinesMap = await interactiveMode(typos);
    fixFile(file, lines, fixedLinesMap);
  } else {
    printTypos(typos);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
