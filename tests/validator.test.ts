import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validate } from '../src/validator.js';

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel: string) => readFileSync(join(here, rel), 'utf8');

describe('validate (byte-exact messages)', () => {
  it('sample-agent fails platform-enum only (one error, score input)', () => {
    const res = validate(
      read('sample-agent/grok-install.yaml'),
      'grok-install.yaml',
      read('sample-agent/capabilities.yaml'),
      'capabilities.yaml',
    );
    expect(res.issues).toHaveLength(1);
    const [hit] = res.issues;
    expect(hit!.ruleId).toBe('grokinstall.platform-enum');
    expect(hit!.severity).toBe('error');
    expect(hit!.file).toBe('grok-install.yaml');
    expect(hit!.line).toBe(5);
    expect(hit!.message).toBe(
      "runtime.platform must be one of 'x', 'grok-cli', 'grokagents.dev'. Got 'twitter'.",
    );
  });

  it('sample-agent-pass returns zero issues', () => {
    const res = validate(
      read('sample-agent-pass/grok-install.yaml'),
      'grok-install.yaml',
      read('sample-agent-pass/capabilities.yaml'),
      'capabilities.yaml',
    );
    expect(res.issues).toHaveLength(0);
  });

  it('sample-agent-rl fails rate-limit-exceeds-profile on line 7', () => {
    const res = validate(
      read('sample-agent-rl/grok-install.yaml'),
      'grok-install.yaml',
      read('sample-agent-rl/capabilities.yaml'),
      'capabilities.yaml',
    );
    expect(res.issues).toHaveLength(1);
    const [hit] = res.issues;
    expect(hit!.ruleId).toBe('grokinstall.rate-limit-exceeds-profile');
    expect(hit!.severity).toBe('error');
    expect(hit!.file).toBe('capabilities.yaml');
    expect(hit!.line).toBe(7);
    expect(hit!.message).toBe(
      "max_replies_per_hour=999 exceeds the 'standard' profile cap of 60/hour. Lower the value or switch to a custom profile.",
    );
  });
});
