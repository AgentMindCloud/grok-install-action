# Contributing to grok-install-action

Thanks for helping improve the GrokInstall Validate & Scan action. This document covers local development, testing, and the commit/PR conventions we follow.

## Ground rules

- **Scope**: this repo is the composite GitHub Action shim. The validation, scan, and safety logic lives in [`grok-install-cli`](https://github.com/AgentMindCloud/grok-install-cli). Bug reports about rules, CVE definitions, or score math belong there.
- **Auto-Post-to-X**: deferred to v2. PRs that post to external social networks will be declined.
- **Node 20** is the only supported runtime. Do not raise the floor without an RFC issue.
- **Zero new runtime npm deps** unless the change genuinely cannot be done with the existing `@actions/core`, `@actions/github`, and `@octokit/rest` surface.

## Local development

```bash
git clone https://github.com/AgentMindCloud/grok-install-action.git
cd grok-install-action
npm ci
npm test
```

`npm test` runs `tests/unit.test.js`, which exercises `scripts/annotations.js` and `scripts/badge.js` against the JSON fixtures under `tests/fixtures/`. No network, no GitHub API, no `grok-install` install required.

## Integration test (what CI runs)

To exercise the full pipeline, install the CLI from PyPI and point it at the bundled sample agent:

```bash
pip install "grok-install==2.14.0"
grok-install validate tests/sample-agent
grok-install scan     tests/sample-agent
```

For an end-to-end smoke test with visuals-preview (requires cli ≥ 2.14):

```bash
grok-install validate tests/fixtures/valid-v2.14-visuals --visuals-preview
```

## Repo layout

| Path | What lives there |
| --- | --- |
| `action.yml` | Composite action definition — inputs, outputs, steps. Marketplace reads its `branding` block directly. |
| `scripts/run.sh` | Orchestrator: runs CLI, normalizes `report.json`, emits step outputs |
| `scripts/annotations.js` | Converts findings into `::error`/`::warning`/`::notice` + job summary |
| `scripts/comment.js` | Upserts the pinned PR comment via Octokit |
| `scripts/badge.js` | Generates the self-contained SVG badge |
| `tests/unit.test.js` | Zero-dep Node test runner |
| `tests/fixtures/` | JSON report fixtures + sample `.grok/` agents |
| `tests/sample-agent*/` | End-to-end sample manifests used as smoke tests |
| `workflows-examples/` | Copy-paste templates (basic, matrix, monorepo, release, with-claude-code) |
| `docs/` | Long-form docs (e.g. cli-version pinning) |

## Commit convention

We use [Conventional Commits](https://www.conventionalcommits.org/) so the release workflow can generate clean changelogs:

```
feat: add visuals-preview input
fix(badge): escape XML entities in agent name
docs(readme): add quick-add one-liner
chore(deps): bump @octokit/rest to 20.1.2
```

Allowed types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `build`, `revert`.

Breaking changes: add `!` after the type (`feat!: drop Node 18 support`) and a `BREAKING CHANGE:` footer. Reserve these for major version bumps.

## Pull request checklist

Before opening a PR:

1. `npm test` passes locally.
2. You updated `CHANGELOG.md` under `[Unreleased]`.
3. If you added an input or output, you updated the tables in `README.md` and `action.yml`.
4. If you changed behavior a consumer workflow would notice, you updated `workflows-examples/`.
5. Your commit messages follow Conventional Commits.

The full checklist is also in `.github/PULL_REQUEST_TEMPLATE.md` and will auto-populate when you open the PR.

## Reporting security issues

Do **not** open public issues for vulnerabilities. See [`SECURITY.md`](./SECURITY.md) — email `security@grokagents.dev` or file a private advisory.

## Code of Conduct

This project follows the [Contributor Covenant v2.1](./.github/CODE_OF_CONDUCT.md). By participating you agree to uphold it.
