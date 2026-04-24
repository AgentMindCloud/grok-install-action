import { loadWithLines } from './yaml-lines.js';
import { RULES } from './rules.js';
import type { Issue, ValidationResult } from './types.js';

export function validate(
  manifestSource: string,
  manifestPath: string,
  capabilitiesSource: string,
  capabilitiesPath: string,
): ValidationResult {
  const manifest = loadWithLines(manifestSource);
  const capabilities = loadWithLines(capabilitiesSource);
  const ctx = { manifest, capabilities, manifestPath, capabilitiesPath };

  const issues: Issue[] = [];
  for (const rule of RULES) {
    issues.push(...rule.run(ctx));
  }

  issues.sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.line - b.line;
  });

  return {
    issues,
    files: { manifest: manifestPath, capabilities: capabilitiesPath },
  };
}
