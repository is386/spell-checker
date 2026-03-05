import wordlist from "wordlist-english";
import * as fs from "node:fs";

const englishWords = wordlist.english;

fs.readFile(
  "test.txt",
  "utf8",
  (err: NodeJS.ErrnoException | null, data: string) => {
    if (err) {
      console.error(err);
      return;
    }

    const lines = data.split("\n");
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;

      if (!line.trim()) {
        continue;
      }

      const words = line.trim().split(" ");
      let colNumber = 1;

      for (const word of words) {
        if (!englishWords.includes(word)) {
          console.log(
            `Line ${lineNumber}, Col ${colNumber}: "${word}" appears to be a typo`,
          );
        }
        colNumber += word.length + 1;
      }
    }
  },
);
