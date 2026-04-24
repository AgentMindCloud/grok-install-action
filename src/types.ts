export type Severity = 'error' | 'warning' | 'info';

export interface Issue {
  ruleId: string;
  severity: Severity;
  file: string;
  line: number;
  message: string;
}

export interface ValidationResult {
  issues: Issue[];
  files: { manifest: string; capabilities: string };
}

export interface ScoreResult {
  score: number;
  errors: number;
  warnings: number;
  info: number;
  certified: boolean;
}
