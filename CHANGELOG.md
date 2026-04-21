# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Nothing yet.

### Changed
- Nothing yet.

### Fixed
- Nothing yet.

## [1.0.0] - 2026-04-21

First stable release. Published to the [GitHub Marketplace](https://github.com/marketplace/actions/grokinstall-validate-scan).

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
- `README.md` gains a shields.io badge row, a hero screenshot slot (`docs/img/pr-comment-hero.png`), a one-liner "Quick add" recipe, and a "What's new in v1.0" section.

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

[Unreleased]: https://github.com/AgentMindCloud/grok-install-action/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/AgentMindCloud/grok-install-action/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/AgentMindCloud/grok-install-action/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/AgentMindCloud/grok-install-action/releases/tag/v0.0.1
