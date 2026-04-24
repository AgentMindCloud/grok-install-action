import type { Issue, ScoreResult, Severity } from './types.js';

const WEIGHT: Record<Severity, number> = {
  error: 15,
  warning: 5,
  info: 1,
};

export function score(issues: Issue[]): ScoreResult {
  const counts = { errors: 0, warnings: 0, info: 0 };
  let penalty = 0;
  for (const issue of issues) {
    penalty += WEIGHT[issue.severity];
    if (issue.severity === 'error') counts.errors += 1;
    else if (issue.severity === 'warning') counts.warnings += 1;
    else counts.info += 1;
  }
  const raw = 100 - penalty;
  const value = Math.max(0, Math.min(100, raw));
  return {
    score: value,
    errors: counts.errors,
    warnings: counts.warnings,
    info: counts.info,
    certified: value >= 90 && counts.errors === 0,
  };
}
