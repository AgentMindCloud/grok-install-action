import { describe, it, expect } from 'vitest';
import { renderBadgeSvg } from '../src/badge.js';

describe('renderBadgeSvg', () => {
  it('passing state uses green fill and CERTIFIED label', () => {
    const svg = renderBadgeSvg({ score: 100, certified: true });
    expect(svg).toContain('GROK-NATIVE');
    expect(svg).toContain('CERTIFIED 100');
    expect(svg).toContain('#00FF9D');
    expect(svg).toContain('#00F0FF');
    expect(svg).toContain('#0A0A0A');
    expect(svg).not.toContain('FAILED');
  });

  it('failing state uses danger fill and FAILED label', () => {
    const svg = renderBadgeSvg({ score: 85, certified: false });
    expect(svg).toContain('FAILED');
    expect(svg).toContain('#FF2D55');
    expect(svg).not.toContain('CERTIFIED');
  });

  it('stays deterministic and under 2KB for comment embedding', () => {
    const a = renderBadgeSvg({ score: 100, certified: true });
    const b = renderBadgeSvg({ score: 100, certified: true });
    expect(a).toBe(b);
    expect(a.length).toBeLessThan(2048);
  });
});
