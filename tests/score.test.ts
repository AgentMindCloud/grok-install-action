import { describe, it, expect } from 'vitest';
import { score } from '../src/score.js';
import type { Issue, Severity } from '../src/types.js';

function issue(severity: Severity): Issue {
  return {
    ruleId: `test.${severity}`,
    severity,
    file: 'x.yaml',
    line: 1,
    message: 'x',
  };
}

function build(errors: number, warnings: number, info: number): Issue[] {
  return [
    ...Array.from({ length: errors }, () => issue('error')),
    ...Array.from({ length: warnings }, () => issue('warning')),
    ...Array.from({ length: info }, () => issue('info')),
  ];
}

describe('score', () => {
  it('zero issues → 100 certified', () => {
    const r = score([]);
    expect(r.score).toBe(100);
    expect(r.certified).toBe(true);
    expect(r.errors).toBe(0);
    expect(r.warnings).toBe(0);
    expect(r.info).toBe(0);
  });

  it('one error → 85 not certified (locked failing-state)', () => {
    const r = score(build(1, 0, 0));
    expect(r.score).toBe(85);
    expect(r.certified).toBe(false);
    expect(r.errors).toBe(1);
  });

  it('two errors → 70 not certified', () => {
    const r = score(build(2, 0, 0));
    expect(r.score).toBe(70);
    expect(r.certified).toBe(false);
  });

  it('one warning → 95 certified', () => {
    const r = score(build(0, 1, 0));
    expect(r.score).toBe(95);
    expect(r.certified).toBe(true);
  });

  it('five info → 95 certified', () => {
    const r = score(build(0, 0, 5));
    expect(r.score).toBe(95);
    expect(r.certified).toBe(true);
  });

  it('ten errors clamps to 0', () => {
    const r = score(build(10, 0, 0));
    expect(r.score).toBe(0);
    expect(r.certified).toBe(false);
  });

  it('score 90 with zero errors is certified (boundary)', () => {
    const r = score(build(0, 2, 0));
    expect(r.score).toBe(90);
    expect(r.certified).toBe(true);
  });

  it('score 90 with any errors is not certified', () => {
    // impossible under the formula with exactly score=90 and errors>0,
    // but guard the invariant: errors>0 forbids certified regardless.
    const r = score(build(1, 0, 0));
    expect(r.certified).toBe(false);
  });
});
