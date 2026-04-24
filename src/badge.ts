import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { BRAND } from './brand.js';

export interface BadgeOpts {
  score: number;
  certified: boolean;
}

function rightPillText(opts: BadgeOpts): string {
  return opts.certified ? `CERTIFIED ${opts.score}` : 'FAILED';
}

function textWidth(text: string): number {
  return 6 * text.length + 16;
}

export function renderBadgeSvg(opts: BadgeOpts): string {
  const left = 'GROK-NATIVE';
  const right = rightPillText(opts);
  const leftW = textWidth(left);
  const rightW = textWidth(right);
  const totalW = leftW + rightW;
  const height = 20;
  const rightFill = opts.certified ? BRAND.green : BRAND.danger;
  const rightTextFill = opts.certified ? BRAND.bg : '#FFFFFF';

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${height}" viewBox="0 0 ${totalW} ${height}" role="img" aria-label="${left} ${right}">`,
    `<clipPath id="gi-clip"><rect width="${totalW}" height="${height}" rx="3" fill="#fff"/></clipPath>`,
    `<g clip-path="url(#gi-clip)">`,
    `<rect width="${leftW}" height="${height}" fill="${BRAND.bg}"/>`,
    `<rect x="${leftW}" width="${rightW}" height="${height}" fill="${rightFill}"/>`,
    `</g>`,
    `<g font-family="Inter,Segoe UI,system-ui,sans-serif" font-size="11" font-weight="700" text-anchor="middle">`,
    `<text x="${leftW / 2}" y="14" fill="${BRAND.cyan}">${left}</text>`,
    `<text x="${leftW + rightW / 2}" y="14" fill="${rightTextFill}">${right}</text>`,
    `</g>`,
    `</svg>`,
  ].join('');
}

export async function writeBadge(svg: string, outPath: string): Promise<void> {
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, svg, 'utf8');
}
