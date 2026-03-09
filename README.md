# spell-checker

CLI tool that checks for typos.

## Features

- Leverages an existing dictionary to check all words and displays the typos
- Supports input from stdin, files, and directories
- Interactive mode for fixing words, and adding custom words

## Build

```bash
curl -fsSL https://bun.sh/install | bash
npm install
npm run build
```

This compiles a standalone binary to `dist/spellchecker`.

## Usage

```
Usage: spellchecker [options] [file]

Arguments:
  file               file to spell-check (or pipe from stdin)

Options:
  -i, --interactive  toggle interactive mode (default: false)
  -h, --help         display help for command
```

## Custom Dictionary

Words added via interactive mode are stored at `~/.config/spellchecker/custom-dictionary.json`. You can also edit this file manually — it's a JSON array of strings:
