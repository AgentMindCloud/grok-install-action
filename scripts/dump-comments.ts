import { renderComment } from '../src/comment.js';
import { renderBadgeSvg } from '../src/badge.js';
import { validate } from '../src/validator.js';
import { score } from '../src/score.js';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8');
const repoUrl = 'https://github.com/AgentMindCloud/grok-install-action';

function render(manifestPath: string, capsPath: string, label: string) {
  const v = validate(
    read(manifestPath), 'grok-install.yaml',
    read(capsPath), 'capabilities.yaml',
  );
  const s = score(v.issues);
  const badge = renderBadgeSvg({ score: s.score, certified: s.certified });
  const out = renderComment({ score: s, issues: v.issues, repoUrl, badgeSvg: badge });
  process.stdout.write(`===${label}===\n` + out);
}

render('tests/sample-agent/grok-install.yaml', 'tests/sample-agent/capabilities.yaml', 'FAIL');
render('tests/sample-agent-pass/grok-install.yaml', 'tests/sample-agent-pass/capabilities.yaml', 'PASS');
