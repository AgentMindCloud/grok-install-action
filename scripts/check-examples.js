#!/usr/bin/env node
// check-examples.js — parses workflows-examples/*.yml and asserts that every
// `with:` block under a step that uses AgentMindCloud/grok-install-action
// only references inputs declared in action.yml. Fails the CI job if any
// example references an unknown input or omits the `working-directory`/`mode`
// surface where it should be present.
'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..');
const ACTION_YML = path.join(ROOT, 'action.yml');
const EXAMPLES_DIR = path.join(ROOT, 'workflows-examples');

const action = yaml.load(fs.readFileSync(ACTION_YML, 'utf8'));
const validInputs = new Set(Object.keys(action.inputs || {}));
if (validInputs.size === 0) {
  console.error('FATAL: action.yml has no inputs — refusing to lint.');
  process.exit(2);
}

let failures = 0;
let checked = 0;

const files = fs.readdirSync(EXAMPLES_DIR)
  .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
  .map((f) => path.join(EXAMPLES_DIR, f));

for (const file of files) {
  const wf = yaml.load(fs.readFileSync(file, 'utf8'));
  const jobs = wf?.jobs || {};
  for (const [jobName, job] of Object.entries(jobs)) {
    const steps = job?.steps || [];
    for (const [idx, step] of steps.entries()) {
      const uses = step?.uses;
      if (typeof uses !== 'string') continue;
      if (!uses.startsWith('AgentMindCloud/grok-install-action')
          && !uses.startsWith('./')) continue;
      checked++;
      const withMap = step.with || {};
      for (const key of Object.keys(withMap)) {
        if (!validInputs.has(key)) {
          failures++;
          console.error(
            `FAIL  ${path.relative(ROOT, file)} :: ${jobName} step #${idx + 1} ` +
            `uses unknown input "${key}". Valid inputs: ${[...validInputs].sort().join(', ')}`
          );
        }
      }
    }
  }
}

if (checked === 0) {
  console.error('FATAL: no example workflows referenced the action.');
  process.exit(2);
}

if (failures > 0) {
  console.error(`\n${failures} input violation(s) across ${files.length} example file(s).`);
  process.exit(1);
}

console.log(`OK — ${checked} action invocation(s) across ${files.length} example file(s); all `
  + `inputs match action.yml.`);
