# Audit Report: grok-install-action

**Date:** 2026-05-07
**Auditor:** Claude Code
**Org:** AgentMindCloud
**Ecosystem Role:** Composite GitHub Action that validates `.grok/` agent manifests, runs safety scan, and emits a "Grok-Native Certified" badge — the CI gate of the AgentMindCloud Grok-native toolchain.

---

## 1. Snapshot

- **Stars / forks / open issues:** 0 / 0 / 0 (issues disabled)
- **Last commit:** 2026-04-29 (`4da30a0` fix(ci): remove salvaged self-certify workflow)
- **Primary language(s):** JavaScript (Node 20) + Bash + parallel TypeScript (unwired) + minor Python (dead)
- **Total LOC:** 1,719 source (42,495 incl. `dist/index.js`)
- **Dependencies health:** 0 npm vulnerabilities; all three `@actions/*`/`@octokit/rest` deps are a major version behind; `node_modules` not installed locally; `yaml`, `vitest`, `@eslint/js` referenced by `src/`+config but undeclared
- **CI status:** 2 workflows (release.yml, test.yml); test.yml runs only `tests/unit.test.js` (8 assertions); float-pinned 3rd-party actions
- **License:** Apache-2.0
- **Required files present:** README.md, LICENSE, CHANGELOG.md, CONTRIBUTING.md, .gitignore, plus SECURITY.md, DISCLAIMER.md, CODE_OF_CONDUCT, CODEOWNERS, PR/ISSUE templates, FUNDING.yml — all there

---

## 2. File-by-File Findings

### Critical

- `tests/sample-agent/grok-install.yaml:3-13` — Fixture restructured under `metadata:` with `platform: grok` on line 11, but `tests/snapshot/expected-comment.md:10` and `tests/validator.test.ts:23-26` lock byte-exact `grok-install.yaml:5 ... Got 'twitter'.`; entire score=85 narrative incoherent. — **Severity:** Critical
- `src/main.ts:27-35` — TS Node action declares inputs (`manifest-path`, `capabilities-path`, `token`, `comment`, `badge`, `badge-path`, `fail-on`) that DO NOT exist in `action.yml:9-45`; the published composite action ignores all of them. — **Severity:** Critical
- `package.json:19-23` — Missing deps `yaml`, `vitest`, `@eslint/js` consumed by `src/yaml-lines.ts:1`, `vitest.config.ts`, `eslint.config.js`; Vitest tests, ESLint, `dump-comments.ts`, and `src/main.ts` all fail to run. — **Severity:** Critical
- `.github/workflows/release.yml:53-80` — When `CHANGELOG.md` is missing, script writes `body=...` to `$GITHUB_OUTPUT` (line 58) but `softprops/action-gh-release` consumes `body_path: ${{ steps.notes.outputs.path }}` (line 76) which is empty in that branch — release publish would fail. — **Severity:** Critical
- `tests/snapshot/expected-comment.md:10` — Hard-coded `grok-install.yaml:5` with `"Got 'twitter'"` cannot match current fixture content; `comment.test.ts` byte-exact match permanently broken. — **Severity:** Critical

### High

- `DISCLAIMER.md:11` — Claims action installs `grok-install-cli` from PyPI, but `action.yml:87` installs from npm. Misleading legal text. — **Severity:** High
- `grok-install.yaml:2` — Comment references `.github/workflows/self-certify.yml` removed in commit `4da30a0`. Stale dogfood pointer. — **Severity:** High
- `marketplace.yml:2` — Comment "Consumed by the Marketplace when the action is published from a release" is factually false — Marketplace reads `action.yml`, not a separate file. `README.md:144` repeats the claim. — **Severity:** High
- `README.md:209-213` — Brand tokens table publishes `#0A0D14`, `#00E5FF`, `#7C3AED`, `#FF4FD8`; canonical tokens in `grok-install-brand/tokens/colors.css`, `src/brand.ts:2-5`, `scripts/badge.js:11-16`, and every launch SVG are `#0A0A0A`, `#00F0FF`, `#00FF9D`, `#FF2D55`. The violet/magenta values appear nowhere else. — **Severity:** High
- `workflows-examples/basic.yml:28` and `workflows-examples/release.yml:25` — `cli-version: latest` directly contradicts `docs/cli-version-pinning.md:7-9,21-46` and `CHANGELOG.md:65`; `release.yml` example is the worst place to use `latest`. — **Severity:** High
- `workflows-examples/monorepo.yml:19-21` — Uses `manifest-path`, `capabilities-path`, `badge-path` — none exist in `action.yml`. — **Severity:** High
- `workflows-examples/release-tag.yml:16-17` — Uses `fail-on` and `comment` — neither input exists. — **Severity:** High
- `workflows-examples/with-claude-code.yml:27` — Uses `fail-on` input that doesn't exist. — **Severity:** High
- `assets/README.md:23-37` — Documents `hero-comment-pass.png` / `hero-comment-fail.png` that aren't in repo, plus reconciliation note about `"Got 'twitter'"` that no longer matches fixture. — **Severity:** High
- `_config.yml:6` — Sets `twitter.username: agentmindcloud` while `README.md:273` links to `https://x.com/JanSol0s`. Two different X handles for one project. — **Severity:** High
- Release notes drift — Published `v1.0.0` notes claim deps pinned to `1.10.1/6.0.0/20.1.1`; current `package.json` is `1.11.1/6.0.1/20.1.2`. Provenance/integrity gap on the Marketplace listing. — **Severity:** High

### Medium

- `action.yml:98` — `ACTION_PATH: ${{ github.action_path }}` exported to `run.sh` but never consumed. Dead env var. — **Severity:** Medium
- `scripts/run.sh:137-139` — Each output value spawns its own `node -e "require('$REPORT')..."` and reparses JSON 3x. Wasteful. — **Severity:** Medium
- `src/` (entire tree) — Not wired to `action.yml`; the composite path runs `scripts/run.sh` + `scripts/*.js` instead. `dist/index.js` (~1.4 MB) bundle exists but no consumer. Split-brain implementation. — **Severity:** Medium
- `src/rules.ts` vs `scripts/*` — Two parallel rule-ID schemas: composite uses `schema/missing-field`, `safety/*`, `visuals/*`; unwired TS uses `grokinstall.platform-enum`, `grokinstall.rate-limit-exceeds-profile`. — **Severity:** Medium
- Fixture spec drift — `tests/fixtures/valid-v2.14-visuals/grok-install.yaml:1` and `tests/fixtures/invalid-visuals-bad-hex/grok-install.yaml:1` use `spec: v1`; `tests/sample-agent/grok-install.yaml:1` uses `spec: grok-install/v1`; `tests/sample-agent-pass/` and `tests/sample-agent-rl/` have no `spec:` field. Four schemas across one fixture set. — **Severity:** Medium
- `_config.yml:22` — Excludes `schemas/` directory that doesn't exist. — **Severity:** Medium
- `scripts/annotate.py` (129 lines) — Python annotator never invoked from any workflow or script. Dead code. — **Severity:** Medium
- `dist/index.js` (1.4 MB), `dist/index.js.map` (1.7 MB), `dist/licenses.txt`, `dist/package.json`, `dist/sourcemap-register.cjs` — ~3 MB of bundled artifact for the unwired TS action. — **Severity:** Medium
- `src/comment.ts:49,57` — Link target `${repoUrl}#rule-catalog` but README has no `## Rule catalog` heading. Anchor 404. — **Severity:** Medium
- `src/comment.ts:41` — Link target `${repoUrl}#${ruleAnchor(i.ruleId)}` produces e.g. `#rule-grokinstall-platform-enum`; README has no such anchor. — **Severity:** Medium
- `_layouts/default.html:11-13` — Declares system fonts (`-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`); brand standard is Inter / Space Grotesk / JetBrains Mono. — **Severity:** Medium
- `_config.yml:19` — `defaults image` is `/docs/posters/og-default.png` but Jekyll basepath strips leading slash inconsistently with `baseurl: /grok-install-action`. — **Severity:** Medium
- `grok-install-brand/templates/HUB-INDEX.html:10-17` — Uses Google Fonts (Space Grotesk, Inter, JetBrains Mono) without `<link rel="stylesheet" href="...">`. — **Severity:** Medium
- `grok-install-brand/launch/session-7/README.md:5` vs `assets/README.md:23-27` — One says PNG export "deferred to Session 8"; the other says screenshots "captured in Session 8" already. Coordination mismatch. — **Severity:** Medium
- `action.yml` and `.github/workflows/release.yml` — Float-pinned `actions/setup-node@v4`, `softprops/action-gh-release@v2`, `actions/checkout@v4`; `SECURITY.md:53` instructs SHA-pinning "for production repos." Do-as-I-say. — **Severity:** Medium
- `package.json` — `@actions/core 1.11.1` (latest 3.0.1), `@actions/github 6.0.1` (latest 9.1.1), `@octokit/rest 20.1.2` (latest 22.0.1) — all one major behind. — **Severity:** Medium

### Low

- `README.md:60` blockquote vs `tests/fixtures/valid-v2.14-visuals/report.json:19` — `visualsPreviewUrl: "https://preview.grokagents.dev/abc123.html"` references a host that may not exist. — **Severity:** Low
- `README.md:252,257,262,270` — Lowercase `agentmindcloud` URLs in sibling-repo links and connect block; everywhere else uses `AgentMindCloud`. — **Severity:** Low
- `README.md:29,144` — Marketplace badge implies listing exists; CHANGELOG admits "ready to be linked once". — **Severity:** Low
- `scripts/annotations.js:49` — Summary uses `info=${s.info || 0}`; report uses `error/warning/info/total`. Style only — falsy-zero is fine here. — **Severity:** Low
- `scripts/badge.js:19` — `approxWidth(str, px = 11)` accepts `px` parameter never overridden by callers (which use 10 inline). Dead parameter. — **Severity:** Low
- `src/badge.ts:14` — `textWidth(text)` returns `6 * text.length + 16`; character widths for proportional font are inaccurate, can clip on long values. — **Severity:** Low
- `tests/sample-agent/capabilities.yaml` — Has commented header; other `capabilities.yaml` files don't. Inconsistent comment style. — **Severity:** Low

### Nit

- `scripts/run.sh` — Mixes single- and double-quote style for paths. — **Severity:** Nit
- `_layouts/default.html:28` — Shadow value not in token form. — **Severity:** Nit

---

## 3. Cross-Cutting Issues

- **Unescaped `@grok` mentions:** ZERO. All 5 hits are scoped to `@grokagents.dev` email domain at `action.yml:146`, `SECURITY.md:5`, `CONTRIBUTING.md:83`, `.github/CODE_OF_CONDUCT.md:63`, `.github/workflows/release.yml:101`. No remediation needed.
- **Schema/version drift:** Severe. Two parallel implementations (composite Bash+JS vs TS Node action) ship different input schemas; two parallel rule-ID schemas (`safety/*` vs `grokinstall.*`); four different `spec:` values across fixture set; README brand-tokens table contradicts canonical brand directory; self-manifest `grok-install.yaml:2` points at workflow that was deleted in `4da30a0`; `v1.0.0` release notes claim dep versions one patch behind current `package.json`.
- **Documentation freshness:** README claims "Marketplace Ready" but `marketplace.yml` is decorative; CHANGELOG-Unreleased says hero screenshot was removed because file isn't committed, but `assets/README.md:23-27` describes them as if they exist; `CONTRIBUTING.md:41-52` repo-layout section omits `src/`, `dist/`, `grok-install-brand/`, `_layouts/`, `_config.yml`. `DISCLAIMER.md:11` still says PyPI when install is npm.
- **Brand/visual consistency:** SVG/CSS world is internally coherent (`#0A0A0A` / `#00F0FF` / `#00FF9D` / `#FF2D55`); README brand-tokens table publishes a different palette (`#0A0D14` / `#00E5FF` / `#7C3AED` / `#FF4FD8`) that exists nowhere else. Jekyll layout uses generic system fonts vs brand display/mono stack.
- **Dead code / orphan files:** `scripts/annotate.py` (uninvoked), entire `src/` TS implementation, ~3 MB `dist/` build artifact, `grok-install-brand/banners/grok-install-action-banner.svg` (unreferenced), `_config.yml`'s `schemas/` exclude, `ACTION_PATH` env in `action.yml`, `marketplace.yml` itself.
- **Test coverage:** `npm test` runs 8 zero-dep Node assertions in `tests/unit.test.js` against JSON fixtures — healthy for what it covers. Five `*.test.ts` files (badge, comment, score, validator, yaml-lines) cannot run because `vitest`/`yaml` aren't installed and snapshot inputs no longer match fixture content. Effective coverage = JS scripts the action actually runs.
- **Security posture:** `action.yml:84-88` injects `cli-version` via env to avoid template injection — good. Float-pinned external actions in own workflows contradict `SECURITY.md:53`. No hardcoded secrets/keys. `dist/licenses.txt` shipped but `dist/` not used. Token usage safe — `comment.js` skips when `GITHUB_TOKEN` empty; `action.yml` falls back to `github.token` per step. 0 npm vulnerabilities.

---

## 4. What's Working Well

- Composite `action.yml` orchestration is clean — tolerant CLI install (`action.yml:87-89`), JSON normalization in `run.sh:42-134` even when CLI crashes, separate `if: always() && ...` guards per step, enforcement gated only at the final step.
- `scripts/annotations.js` is solid — proper escaping for workflow commands (`escapeData`/`escapeProp` lines 20-21), severity-to-command mapping that respects `mode: warn` (lines 23-30), bounded job-summary table with truncation notice.
- Community-health files are above-average — dedicated false-positive issue form pointing to the right downstream repo, PR template explicitly forbidding Auto-Post-to-X via checkbox, CODEOWNERS pointing to the maintainer, FUNDING.yml with custom URL.
- Brand assets at SVG layer are a coherent design system — `#0A0A0A` background, cyan-to-white gradients, glassmorphism cards, single-shield-mark family — `colors.css` properly tokenized.
- `tests/unit.test.js` is a zero-dependency Node test runner covering happy paths and v2.14 visuals fixtures (8 assertions).

---

## 5. Top 5 Improvements (Ranked by Impact ÷ Effort)

| # | Improvement | Impact (1-10) | Effort (hours) | Why it matters |
|---|---|---|---|---|
| 1 | Delete `src/`, `dist/`, `vitest.config.ts`, `eslint.config.js`, `tests/*.test.ts`, `tests/snapshot/`, `scripts/annotate.py`, `marketplace.yml` and the broken `*.test.ts` files; commit as "drop unwired TS rewrite, salvage to branch" | 9 | 2 | Eliminates split-brain implementation, ~3 MB of dead bundle, broken Vitest snapshot, and four classes of input drift in one cut. Forces single source of truth. |
| 2 | Fix all four `workflows-examples/*.yml` to use only inputs that actually exist in `action.yml` (`working-directory`, `mode`, `cli-version`, `visuals-preview`, `update-badge`, `comment-on-pr`, `github-token`) | 9 | 1 | Today, copy-pasting any of the 4 examples gives users a silently-broken action run. This is the single most damaging documentation bug. |
| 3 | Fix `.github/workflows/release.yml:53-80` to write `release-notes.md` in BOTH branches and reference it via `body_path` only; drop the dead `body=...` `$GITHUB_OUTPUT` write | 8 | 0.5 | Prevents publish failure when `CHANGELOG.md` is missing, restores release pipeline reliability. |
| 4 | Reconcile `README.md:209-213` brand-tokens table with `grok-install-brand/tokens/colors.css` (`#0A0A0A`/`#00F0FF`/`#00FF9D`/`#FF2D55`); fix `_config.yml:6` X handle to `JanSol0s`; fix `DISCLAIMER.md:11` PyPI→npm; remove `grok-install.yaml:2` self-certify pointer | 7 | 1 | Removes the four most user-visible "this project doesn't know what it is" inconsistencies in one pass. |
| 5 | SHA-pin `actions/setup-node`, `actions/checkout`, `softprops/action-gh-release` in `action.yml` and `.github/workflows/*.yml`; bump `@actions/core`, `@actions/github`, `@octokit/rest` to current majors | 7 | 1.5 | Practices what `SECURITY.md:53` preaches; closes supply-chain drift before v1.1; updates release notes to match `package.json`. |

---

## 6. Quick Wins (≤30 min each)

- **`grok-install.yaml:2`** — Delete the line `# Dogfooded by .github/workflows/self-certify.yml` (workflow no longer exists).
- **`DISCLAIMER.md:11`** — Replace `from PyPI at runtime` with `from npm at runtime`.
- **`_config.yml:6`** — Change `twitter.username: agentmindcloud` to `twitter.username: JanSol0s` to match `README.md:273`.
- **`_config.yml:22`** — Remove the `schemas/` line from `exclude:` (directory does not exist).
- **`workflows-examples/basic.yml:28`** — Change `cli-version: latest` to `cli-version: ^1.0.0` per `docs/cli-version-pinning.md`.
- **`workflows-examples/release.yml:25`** — Same — replace `latest` with a pinned semver range.
- **`README.md:252,257,262,270`** — Globally replace lowercase `github.com/agentmindcloud/` URLs with `github.com/AgentMindCloud/` for casing consistency.
- **`action.yml:98`** — Delete the unused `ACTION_PATH: ${{ github.action_path }}` env line.
- **Delete `scripts/annotate.py`** — 129 lines of unreferenced Python (no workflow invokes it).
- **Delete `marketplace.yml`** — Decorative file the Marketplace never reads; remove `README.md:144` claim too.
- **`grok-install-brand/templates/HUB-INDEX.html:10-17`** — Add the missing `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?...">` for declared font families.
- **`tests/sample-agent-pass/grok-install.yaml`** + **`tests/sample-agent-rl/grok-install.yaml`** — Add `spec: grok-install/v1` line to match `tests/sample-agent/grok-install.yaml:1`.

---

## 7. Ecosystem Potential Statement

`grok-install-action` occupies the most strategic slot in the AgentMindCloud Grok-native stack: it is the CI gate that decides whether a repo is allowed to claim "Grok-Native Certified," meaning it sits upstream of every other tool in the ecosystem (`grok-install-cli`, `awesome-grok-agents`, the agent registry on `grokagents.dev`) and is the most natural pull-through for a paid SaaS tier (private rule-packs, org-level dashboards, certification reciprocity with xAI's API). Current maturity is mid-build beta dressed as v1.0.0 — the released `1.0.0` tag exists but the repository ships two parallel implementations (a working composite action and an unwired TypeScript rewrite with broken tests, missing dependencies, and ~3 MB of unused bundle), four `workflows-examples/*.yml` files reference inputs that don't exist on the published action, and `DISCLAIMER.md` still says the CLI installs from PyPI when it ships from npm. With one focused week of cleanup (delete the TS rewrite, fix the example workflows, reconcile brand tokens, SHA-pin upstream actions, repair the release pipeline) this can credibly hit 50-150 stars in 6 months on the back of @JanSol0s X distribution and the unique "first GitHub Action for the Grok agent spec" positioning, with realistic revenue path via private-rule-pack licensing for enterprises shipping Grok agents — but only if the project commits to one implementation. Single biggest unlock: delete `src/` and `dist/`, ship one source of truth, and turn `workflows-examples/` into a copy-paste-tested smoke test in CI; that single move converts the project from "looks abandoned and confused" to "v1.1 release candidate." Honest verdict: this is worth one engineer-week of investment, not one engineer-month — the bones are good but the surface area needs aggressive pruning before more features are added.

`POTENTIAL_TAG: DOUBLE_DOWN — strategic CI gate slot, clean composite bones, one week of pruning unlocks Marketplace credibility.`
