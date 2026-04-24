import type { getOctokit } from '@actions/github';

type Octo = ReturnType<typeof getOctokit>;

export interface CommentTarget {
  owner: string;
  repo: string;
  issue_number: number;
}

export async function findMarkedComment(
  octo: Octo,
  target: CommentTarget,
  marker: string,
): Promise<number | undefined> {
  for (let page = 1; page <= 20; page++) {
    const res = await octo.rest.issues.listComments({
      owner: target.owner,
      repo: target.repo,
      issue_number: target.issue_number,
      per_page: 100,
      page,
    });
    for (const c of res.data) {
      if (c.body?.includes(marker)) return c.id;
    }
    if (res.data.length < 100) break;
  }
  return undefined;
}

export async function upsertComment(
  octo: Octo,
  target: CommentTarget,
  body: string,
  marker: string,
): Promise<void> {
  const existing = await findMarkedComment(octo, target, marker);
  if (existing !== undefined) {
    await octo.rest.issues.updateComment({
      owner: target.owner,
      repo: target.repo,
      comment_id: existing,
      body,
    });
    return;
  }
  await octo.rest.issues.createComment({
    owner: target.owner,
    repo: target.repo,
    issue_number: target.issue_number,
    body,
  });
}

export async function commitBadge(
  octo: Octo,
  owner: string,
  repo: string,
  path: string,
  contentUtf8: string,
  branch: string,
  message: string,
): Promise<void> {
  const content = Buffer.from(contentUtf8, 'utf8').toString('base64');
  let sha: string | undefined;
  try {
    const existing = await octo.rest.repos.getContent({ owner, repo, path, ref: branch });
    if (!Array.isArray(existing.data) && 'sha' in existing.data) {
      sha = existing.data.sha;
    }
  } catch (err: unknown) {
    if ((err as { status?: number }).status !== 404) throw err;
  }
  await octo.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content,
    branch,
    sha,
  });
}
