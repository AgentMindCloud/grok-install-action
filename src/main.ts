import * as core from '@actions/core';
import * as github from '@actions/github';
import { readFileSync } from 'node:fs';
import { validate } from './validator.js';
import { score } from './score.js';
import { renderBadgeSvg, writeBadge } from './badge.js';
import { renderComment } from './comment.js';
import { upsertComment, commitBadge } from './github.js';
import { COMMENT_MARKER } from './brand.js';

type FailOn = 'error' | 'warning' | 'never';

function getBool(name: string, fallback: boolean): boolean {
  const raw = core.getInput(name);
  if (raw === '') return fallback;
  return raw.toLowerCase() === 'true';
}

function exitCodeFor(failOn: FailOn, errors: number, warnings: number): number {
  if (failOn === 'never') return 0;
  if (failOn === 'warning' && errors + warnings > 0) return 1;
  if (failOn === 'error' && errors > 0) return 1;
  return 0;
}

export async function run(): Promise<void> {
  const manifestPath = core.getInput('manifest-path') || 'grok-install.yaml';
  const capabilitiesPath = core.getInput('capabilities-path') || 'capabilities.yaml';
  const token = core.getInput('token') || process.env.GITHUB_TOKEN || '';
  const commentEnabled = getBool('comment', true);
  const badgeEnabled = getBool('badge', true);
  const badgePath = core.getInput('badge-path') || '.github/badges/grok-install.svg';
  const failOnRaw = (core.getInput('fail-on') || 'error').toLowerCase();
  const failOn: FailOn =
    failOnRaw === 'warning' || failOnRaw === 'never' ? failOnRaw : 'error';

  const manifestSrc = readFileSync(manifestPath, 'utf8');
  const capsSrc = readFileSync(capabilitiesPath, 'utf8');
  const result = validate(manifestSrc, manifestPath, capsSrc, capabilitiesPath);
  const s = score(result.issues);

  core.setOutput('score', String(s.score));
  core.setOutput('certified', s.certified ? 'true' : 'false');
  core.setOutput('errors', String(s.errors));
  core.setOutput('warnings', String(s.warnings));
  core.setOutput('info', String(s.info));

  core.info(
    `grok-install: score=${s.score} certified=${s.certified} errors=${s.errors} warnings=${s.warnings} info=${s.info}`,
  );
  for (const issue of result.issues) {
    const line = `${issue.file}:${issue.line} ${issue.ruleId} — ${issue.message}`;
    if (issue.severity === 'error') core.error(line);
    else if (issue.severity === 'warning') core.warning(line);
    else core.notice(line);
  }

  const badgeSvg = renderBadgeSvg({ score: s.score, certified: s.certified });
  const ctx = github.context;
  const repoSlug = process.env.GITHUB_REPOSITORY ?? '';
  const [repoOwner = '', repoName = ''] = repoSlug.split('/');
  const repoUrl = repoSlug
    ? `https://github.com/${repoSlug}`
    : 'https://github.com/AgentMindCloud/grok-install-action';
  const commentBody = renderComment({
    score: s,
    issues: result.issues,
    repoUrl,
    badgeSvg,
  });

  const isPullRequest = ctx.eventName === 'pull_request' || ctx.eventName === 'pull_request_target';
  const defaultBranch = (ctx.payload.repository?.default_branch as string | undefined) ?? 'main';
  const currentBranch = (ctx.ref ?? '').replace('refs/heads/', '');
  const isDefaultBranchPush = ctx.eventName === 'push' && currentBranch === defaultBranch;

  if (token && commentEnabled && isPullRequest && ctx.payload.pull_request && repoOwner && repoName) {
    try {
      const octo = github.getOctokit(token);
      await upsertComment(
        octo,
        {
          owner: repoOwner,
          repo: repoName,
          issue_number: ctx.payload.pull_request.number,
        },
        commentBody,
        COMMENT_MARKER,
      );
      core.info('grok-install: PR comment upserted.');
    } catch (err) {
      core.warning(`grok-install: failed to upsert PR comment: ${(err as Error).message}`);
    }
  }

  if (badgeEnabled) {
    try {
      await writeBadge(badgeSvg, badgePath);
      core.info(`grok-install: badge written to ${badgePath}`);
    } catch (err) {
      core.warning(`grok-install: failed to write local badge: ${(err as Error).message}`);
    }
  }

  if (token && badgeEnabled && isDefaultBranchPush && repoOwner && repoName) {
    try {
      const octo = github.getOctokit(token);
      await commitBadge(
        octo,
        repoOwner,
        repoName,
        badgePath,
        badgeSvg,
        defaultBranch,
        `chore: update grok-install certification badge [skip ci]`,
      );
      core.info(`grok-install: badge committed to ${defaultBranch}:${badgePath}`);
    } catch (err) {
      core.warning(`grok-install: failed to commit badge: ${(err as Error).message}`);
    }
  }

  const code = exitCodeFor(failOn, s.errors, s.warnings);
  if (code !== 0) {
    core.setFailed(
      `grok-install: failing (fail-on=${failOn}, errors=${s.errors}, warnings=${s.warnings})`,
    );
  }
}

run().catch((err: unknown) => {
  core.setFailed(`grok-install: unhandled error: ${(err as Error).message}`);
});
