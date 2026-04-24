import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { renderComment } from '../src/comment.js';
import { renderBadgeSvg } from '../src/badge.js';
import { validate } from '../src/validator.js';
import { score } from '../src/score.js';

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel: string) => readFileSync(join(here, rel), 'utf8');
const repoUrl = 'https://github.com/AgentMindCloud/grok-install-action';

function build(fixtureDir: string) {
  const v = validate(
    read(`${fixtureDir}/grok-install.yaml`),
    'grok-install.yaml',
    read(`${fixtureDir}/capabilities.yaml`),
    'capabilities.yaml',
  );
  const s = score(v.issues);
  const badgeSvg = renderBadgeSvg({ score: s.score, certified: s.certified });
  return renderComment({ score: s, issues: v.issues, repoUrl, badgeSvg });
}

describe('renderComment snapshots', () => {
  it('matches expected failing-state comment byte-exact', () => {
    const actual = build('sample-agent');
    const expected = read('snapshot/expected-comment.md');
    expect(actual).toBe(expected);
  });

  it('matches expected passing-state comment byte-exact', () => {
    const actual = build('sample-agent-pass');
    const expected = read('snapshot/expected-comment-pass.md');
    expect(actual).toBe(expected);
  });

  it('failing comment contains locked strings (sanity)', () => {
    const out = build('sample-agent');
    expect(out).toContain('<!-- grok-install-action:comment:v1 -->');
    expect(out).toContain('**Safety score:** 85/100');
    expect(out).toContain(
      "runtime.platform must be one of 'x', 'grok-cli', 'grokagents.dev'. Got 'twitter'.",
    );
    expect(out).toContain('grokagents.dev');
  });
});
