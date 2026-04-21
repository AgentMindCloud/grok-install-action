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

function testAnnotationsVisualsValid() {
  console.log('annotations.js — valid v2.14 visuals fixture');
  const summary = path.join(os.tmpdir(), `summary-visuals-valid.${Date.now()}.md`);
  fs.writeFileSync(summary, '');
  const out = runNode('annotations.js', {
    REPORT_PATH: path.join(FIXTURES, 'valid-v2.14-visuals', 'report.json'),
    INPUT_MODE: 'strict',
    GITHUB_STEP_SUMMARY: summary
  });
  assert(!out.includes('::error '),  'valid visuals fixture never emits ::error');
  assert(!out.includes('::warning '),'valid visuals fixture never emits ::warning');
  assert(out.includes('::notice '),  'info severity becomes ::notice');
  assert(out.includes('visuals/aspect-ratio-recognized'), 'rule id appears in annotation title');
  const md = fs.readFileSync(summary, 'utf8');
  assert(md.includes('**Safety score:** 96'), 'job summary reports safety score 96');
  assert(md.includes('visuals/aspect-ratio-recognized'), 'job summary lists the visuals rule');
}

function testAnnotationsVisualsBadHex() {
  console.log('annotations.js — invalid visuals (bad hex) fixture, strict mode');
  const out = runNode('annotations.js', {
    REPORT_PATH: path.join(FIXTURES, 'invalid-visuals-bad-hex', 'report.json'),
    INPUT_MODE: 'strict'
  });
  assert(out.includes('::error '),                  'bad-hex fixture emits ::error in strict mode');
  assert((out.match(/::error /g) || []).length === 1, 'exactly one ::error for the single bad-hex finding');
  assert(out.includes('visuals/palette-hex-invalid'), 'rule id appears in annotation title');
  assert(out.includes('%23GGG000') || out.includes('#GGG000'),
    'error message mentions the invalid hex value');
}

function testBadgePassWithVisuals() {
  console.log('badge.js — valid v2.14 visuals fixture (score 96, passed)');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'badge-visuals-'));
  const githubOutput = path.join(tmp, 'gh-output');
  fs.writeFileSync(githubOutput, '');
  runNode('badge.js', {
    REPORT_PATH: path.join(FIXTURES, 'valid-v2.14-visuals', 'report.json'),
    WORKING_DIRECTORY: tmp,
    GITHUB_OUTPUT: githubOutput
  });
  const svgPath = path.join(tmp, 'badges', 'grok-native-certified.svg');
  assert(fs.existsSync(svgPath), 'writes badges/grok-native-certified.svg');
  const svg = fs.readFileSync(svgPath, 'utf8');
  assert(svg.includes('CERTIFIED'), 'labels CERTIFIED when score >= 90 (visuals fixture has 96)');
  assert(svg.includes('#00FF9D'),   'visuals pass-high uses success-neon green');
  assert(!svg.includes('FAIL'),     'visuals valid fixture does not emit FAIL');
}

try {
  testAnnotationsPass();
  testAnnotationsFailStrict();
  testAnnotationsFailWarn();
  testBadgeCertified();
  testBadgeFailed();
  testAnnotationsVisualsValid();
  testAnnotationsVisualsBadHex();
  testBadgePassWithVisuals();
} catch (err) {
  console.error(err);
  process.exit(1);
}

if (failures) {
  console.error(`\n${failures} assertion(s) failed`);
  process.exit(1);
}
console.log('\nAll tests passed.');
