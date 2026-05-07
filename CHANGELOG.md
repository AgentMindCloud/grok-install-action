# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-05-07

Cleanup release: single source of truth, fixed examples, Marketplace-ready.

### Added
- `scripts/check-examples.js` — CI lint that parses every
  `workflows-examples/*.yml` and asserts each `with:` map only references
  inputs declared in `action.yml`. Wired up as a new `examples` job in
  `.github/workflows/test.yml`.
- Integration matrix in `test.yml` now exercises the action against
  `tests/sample-agent`, `tests/sample-agent-pass`, and `tests/sample-agent-rl`
  in `mode: warn`, so every committed sample is treated as a smoke test.
- `MERGE_PLAN.md` documenting that this repo stays standalone as the
  Grok-Native CI gate.
- `scripts/run.sh` forwards `--visuals-preview` to `grok-install validate`
  and `grok-install scan` when `visuals-preview: true`, extracts the rendered
  preview URL from the CLI's JSON output, and surfaces it on both the
  `visuals-preview-url` step output and the pinned PR comment.

### Changed
- **CLI now installs from PyPI.** `action.yml` adds an `actions/setup-python@v5`
  step and replaces `npm install -g grok-install-cli@<v>` with
  `pip install "grok-install<spec>"`. `cli-version` accepts any PEP 440
  specifier; bare versions are treated as `==`. `DISCLAIMER.md`, `SECURITY.md`,
  `README.md`, `CONTRIBUTING.md`, and `docs/cli-version-pinning.md` updated to
  match.
- All six `workflows-examples/*.yml` files rewritten to use only inputs that
  exist on `action.yml` (`working-directory`, `mode`, `cli-version`,
  `visuals-preview`, `update-badge`, `comment-on-pr`, `github-token`).
  `monorepo.yml`, `release-tag.yml`, and `with-claude-code.yml` previously
  referenced phantom inputs (`manifest-path`, `capabilities-path`,
  `badge-path`, `fail-on`, `comment`); those are gone.
- `workflows-examples/basic.yml` and `release.yml` now pin `cli-version` to
  `"2.14.0"` (was `latest`), aligning with `docs/cli-version-pinning.md`.
- `README.md` brand-token table now matches `grok-install-brand/tokens/colors.css`
  and `scripts/badge.js` (`#0A0A0A`, `#00F0FF`, `#00FF9D`, `#FF2D55`); the
  contradictory violet/magenta values are gone. README `What's New` block
  rewritten for v1.1.
- `_config.yml`: Twitter handle updated to `JanSol0s` (matches `README.md`),
  removed `dist/`, `src/`, and stale `schemas/` from the Jekyll exclude list.
- `grok-install.yaml` self-manifest: dropped the dangling pointer to
  `.github/workflows/self-certify.yml` (deleted in `4da30a0`); `entry`
  points to `action.yml` rather than the deleted bundle.
- `github-token` input no longer defaults to `${{ github.token }}`. Composite
  actions can't reference the `github` context in an input default; the token
  defaults to empty and each step falls back to `github.token` inline.

### Removed
- **`src/` and `dist/`** — the unwired TypeScript rewrite (~3 MB of bundle
  artifact, none of it reachable from `action.yml`). The composite action
  defined in `action.yml` + `scripts/*` is now the only source of truth.
- `tsconfig.json`, `vitest.config.ts`, `eslint.config.js`, `.prettierrc.json`
  — TS-only build configuration.
- `tests/badge.test.ts`, `tests/comment.test.ts`, `tests/score.test.ts`,
  `tests/validator.test.ts`, `tests/yaml-lines.test.ts`, `tests/snapshot/`
  — Vitest tests against the deleted TS sources.
- `scripts/dump-comments.ts`, `scripts/annotate.py` — uninvoked from any
  workflow; superseded by `scripts/annotations.js`.
- `marketplace.yml` — decorative metadata file; the Marketplace reads
  `action.yml`'s `branding` block directly. Removing it eliminates a
  documentation-drift surface.

### Fixed
- `.github/workflows/release.yml` no longer writes `body=` to `$GITHUB_OUTPUT`
  in the missing-CHANGELOG branch; both branches now write `release-notes.md`
  and the `softprops/action-gh-release` step always reads it via `body_path`.
- Load-time template error `Unrecognized named-value: 'github'` on `action.yml`.
- `Install grok-install` step no longer aborts the composite when the
  requested `cli-version` is unavailable on PyPI. The install failure is
  logged as a workflow `::warning`; `scripts/run.sh` still produces a
  structured `report.json` that flags the missing binary, and strict mode
  still fails at the final enforcement step.

### Security
- Bumped pinned runtime dependencies: `@actions/core@1.11.1` (was `1.10.1`),
  `@actions/github@6.0.1` (was `6.0.0`), `@octokit/rest@20.1.2` (was `20.1.1`).
  Adds `npm overrides` for `@actions/http-client@3.0.2` and `undici@6.25.0`.
  `npm audit --omit=dev` reports zero advisories.
- Hardened the install step against shell-template injection by routing
  `inputs.cli-version` through an `env:` block instead of expanding
  `${{ inputs.cli-version }}` directly inside the bash script.

## [1.0.0] - 2026-04-21

First stable release.

### Added
- Composite action (`action.yml`) wrapping `grok-install-cli` (`validate` + `scan`).
- `scripts/run.sh` — orchestrator that normalizes `report.json` even when the CLI crashes.
- `scripts/annotations.js` — emits `::error` / `::warning` / `::notice` + a Markdown job summary.
- `scripts/comment.js` — upserts a pinned PR comment (single hidden marker, no spam).
- `scripts/badge.js` — generates a self-contained brand-coloured SVG badge.
- New input `visuals-preview` (default `false`) — forwards `--visuals-preview` to the CLI when `cli-version` ≥ 2.14 and surfaces a preview URL in the PR comment.
- New output `visuals-preview-url` — URL to the rendered visuals preview (empty when the CLI doesn't produce one).
- Community health files: `CONTRIBUTING.md`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, `PULL_REQUEST_TEMPLATE.md`, `ISSUE_TEMPLATE/{config,bug,feature,false-positive}.yml`, `CODEOWNERS`, `FUNDING.yml`.
- `.github/workflows/release.yml` — tag-triggered release flow (test → GitHub Release → floating `v1` major-version tag update).
- `docs/cli-version-pinning.md` — supply-chain rationale and override syntax.
- Test fixtures for the v2.14 visuals-preview path: `tests/fixtures/valid-v2.14-visuals/`, `tests/fixtures/invalid-visuals-bad-hex/`.
- Three new unit tests exercising the new fixtures.

### Changed
- **`cli-version` default is now `2.14.0`** (was `latest`). Pinned for reproducibility and supply-chain safety. Override per-repo if you need a newer release.
- `README.md` gains a shields.io badge row, a one-liner "Quick add" recipe, and a "What's new in v1.0" section.

### Security
- All runtime dependencies pinned to exact versions: `@actions/core@1.10.1`, `@actions/github@6.0.0`, `@octokit/rest@20.1.1`.
- No new network calls; the action only talks to `grok-install-cli` locally and the GitHub REST API via the provided token.
- See `SECURITY.md` for token-scope guidance and the SHA-pinning recommendation.

## [0.1.0] - 2026-04-14

Internal preview — not published to the Marketplace.

### Added
- First draft of `tests/sample-agent/grok-install.yaml` (spec v1, summarizer agent, `network: false`, `filesystem: read`).
- Bundled `prompt.md` so the sample agent is self-contained.

## [0.0.1] - 2026-04-07

Initial scaffold — not published.

### Added
- Repository skeleton: `action.yml` stub, `package.json`, Apache-2.0 `LICENSE`, `.gitignore`, `README.md`, `SECURITY.md`.
- Marketplace metadata in `marketplace.yml`.

[Unreleased]: https://github.com/AgentMindCloud/grok-install-action/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/AgentMindCloud/grok-install-action/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/AgentMindCloud/grok-install-action/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/AgentMindCloud/grok-install-action/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/AgentMindCloud/grok-install-action/releases/tag/v0.0.1
