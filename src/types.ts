export interface Typo {
  lineNumber: number;
  word: string;
  context: string;
  occurrence: number;
}

export interface CheckResult {
  typos: Typo[];
  lines: string[];
}
