#!/usr/bin/env bash
# run.sh — orchestrator. Calls grok-install-cli (validate + scan) and emits a
# normalized report.json the rest of the action reads. Never exits non-zero on
# CLI failures — strict-mode enforcement happens in the final action step.
set -uo pipefail

WORKDIR="${INPUT_WORKING_DIRECTORY:-.}"
MODE="${INPUT_MODE:-strict}"
REPORT="$(mktemp -t grok-report.XXXXXX.json)"
VALIDATE_RAW="$(mktemp -t grok-validate.XXXXXX.json)"
SCAN_RAW="$(mktemp -t grok-scan.XXXXXX.json)"

cd "$WORKDIR"

echo "::group::grok-install-cli version"
grok-install --version || true
echo "::endgroup::"

echo "::group::grok-install validate"
validate_rc=0
grok-install validate --json > "$VALIDATE_RAW" 2>&1 || validate_rc=$?
cat "$VALIDATE_RAW"
echo "::endgroup::"

echo "::group::grok-install scan"
scan_rc=0
grok-install scan --json > "$SCAN_RAW" 2>&1 || scan_rc=$?
cat "$SCAN_RAW"
echo "::endgroup::"

# Normalize: if the CLI didn't emit clean JSON (older versions, crashes),
# wrap the raw output so annotations.js still has something to chew on.
node - "$VALIDATE_RAW" "$SCAN_RAW" "$REPORT" "$validate_rc" "$scan_rc" <<'NODE'
const fs = require('fs');
const [,, vPath, sPath, outPath, vRcStr, sRcStr] = process.argv;
const vRc = Number(vRcStr), sRc = Number(sRcStr);

const safeParse = (p) => {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return null; }
};
const rawText = (p) => {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
};

const validate = safeParse(vPath);
const scan = safeParse(sPath);

const findings = [];
const pushFindings = (source, payload, fallbackText, rc) => {
  if (payload && Array.isArray(payload.findings)) {
    for (const f of payload.findings) {
      findings.push({
        source,
        file: f.file || f.path || '',
        line: Number(f.line || f.startLine || 0) || 0,
        column: Number(f.column || f.startColumn || 0) || 0,
        rule: f.rule || f.ruleId || f.code || source,
        severity: (f.severity || (rc === 0 ? 'info' : 'error')).toLowerCase(),
        message: f.message || f.msg || 'Unspecified finding',
        docs: f.docs || f.docsUrl || ''
      });
    }
    return;
  }
  if (rc !== 0) {
    findings.push({
      source,
      file: '',
      line: 0,
      column: 0,
      rule: `${source}-exit-${rc}`,
      severity: 'error',
      message: `${source} failed (exit ${rc}): ${(fallbackText || '').trim().slice(0, 400) || 'no output'}`,
      docs: ''
    });
  }
};

pushFindings('validate', validate, rawText(vPath), vRc);
pushFindings('scan', scan, rawText(sPath), sRc);

const safetyScore = Number(
  (scan && (scan.safetyScore ?? scan.score ?? scan.summary?.score)) ?? (sRc === 0 ? 100 : 0)
) || 0;

const hasErrors = findings.some((f) => f.severity === 'error');
const passed = vRc === 0 && sRc === 0 && !hasErrors;

const report = {
  generatedAt: new Date().toISOString(),
  cli: {
    validateExit: vRc,
    scanExit: sRc
  },
  safetyScore,
  passed,
  counts: {
    error:   findings.filter((f) => f.severity === 'error').length,
    warning: findings.filter((f) => f.severity === 'warning').length,
    info:    findings.filter((f) => f.severity === 'info').length,
    total:   findings.length
  },
  findings
};

fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
NODE

# Surface outputs to later steps.
PASSED=$(node -e "console.log(require('$REPORT').passed)")
SCORE=$(node -e "console.log(require('$REPORT').safetyScore)")

{
  echo "report-path=$REPORT"
  echo "passed=$PASSED"
  echo "safety-score=$SCORE"
} >> "$GITHUB_OUTPUT"

echo "::notice title=GrokInstall::passed=$PASSED safety-score=$SCORE mode=$MODE"
exit 0
