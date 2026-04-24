import type { Issue, ScoreResult } from './types.js';
import {
  BRAND,
  COMMENT_MARKER,
  DISCLAIMER,
  POWERED_BY,
  SHIELD_LABEL_FAIL,
  SHIELD_LABEL_PASS,
} from './brand.js';

export interface CommentInput {
  score: ScoreResult;
  issues: Issue[];
  repoUrl: string;
  badgeSvg: string;
}

function ruleAnchor(ruleId: string): string {
  return `rule-${ruleId.replace(/\./g, '-')}`;
}

function shield(input: CommentInput): string {
  const alt = input.score.certified ? SHIELD_LABEL_PASS : SHIELD_LABEL_FAIL;
  const b64 = Buffer.from(input.badgeSvg, 'utf8').toString('base64');
  return `<img alt="${alt}" src="data:image/svg+xml;base64,${b64}" />`;
}

function summaryPills(s: ScoreResult): string {
  const colorN = (n: number) => (n > 0 ? BRAND.danger.slice(1) : BRAND.cyan.slice(1));
  return [
    `![errors](https://img.shields.io/badge/errors-${s.errors}-${colorN(s.errors)})`,
    `![warnings](https://img.shields.io/badge/warnings-${s.warnings}-${colorN(s.warnings)})`,
    `![info](https://img.shields.io/badge/info-${s.info}-${colorN(s.info)})`,
  ].join(' ');
}

function issuesTable(issues: Issue[], repoUrl: string): string {
  if (issues.length === 0) return '';
  const rows = issues.map(
    (i) =>
      `| \`${i.file}:${i.line}\` | [\`${i.ruleId}\`](${repoUrl}#${ruleAnchor(i.ruleId)}) | ${i.message} |`,
  );
  return ['| File | Rule | Message |', '|---|---|---|', ...rows].join('\n');
}

function bulletsPass(repoUrl: string): string {
  return [
    `- Keep your manifest version-pinned to your current release tag.`,
    `- See the [rule catalog](${repoUrl}#rule-catalog) for the full check list.`,
    `- Learn about Grok-native certification at ${POWERED_BY.site}.`,
  ].join('\n');
}

function bulletsFail(repoUrl: string): string {
  return [
    `- Fix the issues above, then re-run this check.`,
    `- See the [rule catalog](${repoUrl}#rule-catalog) for remediation details.`,
    `- Learn about Grok-native certification at ${POWERED_BY.site}.`,
  ].join('\n');
}

function footer(): string {
  return [
    '---',
    `<sub>Powered by <a href="${POWERED_BY.site}">grokagents.dev</a> · <a href="${POWERED_BY.vscode}">VS Code extension</a> · <a href="${POWERED_BY.cli}">CLI</a></sub>`,
    `<sub><i>${DISCLAIMER}</i></sub>`,
  ].join('\n');
}

export function renderComment(input: CommentInput): string {
  const parts: string[] = [COMMENT_MARKER, shield(input), ''];
  parts.push(`**Safety score:** ${input.score.score}/100`, '');
  parts.push(summaryPills(input.score), '');
  if (input.issues.length > 0) {
    parts.push(issuesTable(input.issues, input.repoUrl), '');
    parts.push(bulletsFail(input.repoUrl), '');
  } else {
    parts.push('No issues found. This agent is Grok-Native Certified.', '');
    parts.push(bulletsPass(input.repoUrl), '');
  }
  parts.push(footer(), '');
  return parts.join('\n');
}
