// Unit test — runs annotations.js and badge.js against the fixture reports
// and asserts that workflow commands + SVG output are well-formed.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FIXTURES = path.join(__dirname, 'fixtures');

let failures = 0;
const assert = (cond, msg) => {
  if (!cond) { failures++; console.error(`  FAIL  ${msg}`); }
  else       { console.log(`  ok    ${msg}`); }
};

function runNode(script, env) {
  return execFileSync(process.execPath, [path.join(ROOT, 'scripts', script)], {
    env: { ...process.env, ...env },
    encoding: 'utf8'
  });
}

function testAnnotationsPass() {
  console.log('annotations.js — pass fixture');
  const summary = path.join(os.tmpdir(), `summary.${Date.now()}.md`);
  fs.writeFileSync(summary, '');
  const out = runNode('annotations.js', {
    REPORT_PATH: path.join(FIXTURES, 'report.pass.json'),
    INPUT_MODE: 'strict',
    GITHUB_STEP_SUMMARY: summary
  });
  assert(out.includes('::warning '), 'emits ::warning for warning finding');
  assert(out.includes('GrokInstall Summary'), 'emits summary notice');
  const md = fs.readFileSync(summary, 'utf8');
  assert(md.includes('GrokInstall Report'), 'writes job summary header');
  assert(md.includes('safety-score') || md.includes('Safety score'), 'summary mentions safety score');
}

function testAnnotationsFailStrict() {
  console.log('annotations.js — fail fixture, strict mode');
  const out = runNode('annotations.js', {
    REPORT_PATH: path.join(FIXTURES, 'report.fail.json'),
    INPUT_MODE: 'strict'
  });
  assert(out.includes('::error '), 'emits ::error for error findings');
  assert((out.match(/::error /g) || []).length >= 2, 'emits two errors');
}

function testAnnotationsFailWarn() {
  console.log('annotations.js — fail fixture, warn mode');
  const out = runNode('annotations.js', {
    REPORT_PATH: path.join(FIXTURES, 'report.fail.json'),
    INPUT_MODE: 'warn'
  });
  assert(!out.includes('::error '), 'warn mode never emits ::error');
  assert(out.includes('::warning '), 'warn mode downgrades to ::warning');
}

function testBadgeCertified() {
  console.log('badge.js — certified fixture');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'badge-'));
  const githubOutput = path.join(tmp, 'gh-output');
  fs.writeFileSync(githubOutput, '');
  runNode('badge.js', {
    REPORT_PATH: path.join(FIXTURES, 'report.pass.json'),
    WORKING_DIRECTORY: tmp,
    GITHUB_OUTPUT: githubOutput
  });
  const svgPath = path.join(tmp, 'badges', 'grok-native-certified.svg');
  assert(fs.existsSync(svgPath), 'writes badges/grok-native-certified.svg');
  const svg = fs.readFileSync(svgPath, 'utf8');
  assert(svg.includes('<svg'), 'output is an SVG');
  assert(svg.includes('#00FF9D'), 'pass-high uses success-neon green');
  assert(svg.includes('CERTIFIED'), 'labels CERTIFIED when passed + score>=90');
  assert(svg.includes('#0A0A0A'), 'uses brand background black');
}

function testBadgeFailed() {
  console.log('badge.js — failed fixture');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'badge-fail-'));
  const githubOutput = path.join(tmp, 'gh-output');
  fs.writeFileSync(githubOutput, '');
  runNode('badge.js', {
    REPORT_PATH: path.join(FIXTURES, 'report.fail.json'),
    WORKING_DIRECTORY: tmp,
    GITHUB_OUTPUT: githubOutput
  });
  const svg = fs.readFileSync(path.join(tmp, 'badges', 'grok-native-certified.svg'), 'utf8');
  assert(svg.includes('#FF2D55'), 'failed badge uses danger red');
  assert(svg.includes('FAIL'), 'labels FAIL when not passed');
}

try {
  testAnnotationsPass();
  testAnnotationsFailStrict();
  testAnnotationsFailWarn();
  testBadgeCertified();
  testBadgeFailed();
} catch (err) {
  console.error(err);
  process.exit(1);
}

if (failures) {
  console.error(`\n${failures} assertion(s) failed`);
  process.exit(1);
}
console.log('\nAll tests passed.');
