import { describe, it, expect } from 'vitest';
import { loadWithLines } from '../src/yaml-lines.js';

const MANIFEST = `# grok-install manifest
name: sample-agent
version: 0.1.0
runtime:
  platform: twitter
  entry: ./agent.ts
description: Sample agent used by the validator test suite.
`;

const CAPS = `# capabilities for sample-agent
profile: standard
limits:
  max_mentions_per_day: 200
  max_dms_per_day: 50
rate:
  max_replies_per_hour: 999
  max_posts_per_hour: 30
`;

describe('loadWithLines', () => {
  it('locates runtime.platform on line 5 of the manifest', () => {
    const y = loadWithLines(MANIFEST);
    const hit = y.at<string>(['runtime', 'platform']);
    expect(hit).toBeDefined();
    expect(hit!.value).toBe('twitter');
    expect(hit!.line).toBe(5);
  });

  it('locates rate.max_replies_per_hour on line 7 of capabilities', () => {
    const y = loadWithLines(CAPS);
    const hit = y.at<number>(['rate', 'max_replies_per_hour']);
    expect(hit).toBeDefined();
    expect(hit!.value).toBe(999);
    expect(hit!.line).toBe(7);
  });

  it('returns undefined for missing paths', () => {
    const y = loadWithLines(MANIFEST);
    expect(y.at(['runtime', 'nope'])).toBeUndefined();
  });

  it('exposes the parsed root via toJS', () => {
    const y = loadWithLines(MANIFEST);
    const root = y.root as Record<string, unknown>;
    expect(root.name).toBe('sample-agent');
    expect((root.runtime as Record<string, unknown>).platform).toBe('twitter');
  });
});
