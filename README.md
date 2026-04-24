<div align="center">

[![CI](https://img.shields.io/github/actions/workflow/status/AgentMindCloud/grok-install-action/test.yml?branch=main&label=CI&style=flat-square&labelColor=0A0A0A&color=00F0FF)](https://github.com/AgentMindCloud/grok-install-action/actions/workflows/test.yml)
[![Marketplace](https://img.shields.io/badge/marketplace-grokinstall--validate--scan-00F0FF?style=flat-square&labelColor=0A0A0A)](https://github.com/marketplace/actions/grokinstall-validate-scan)
[![Release](https://img.shields.io/github/v/release/AgentMindCloud/grok-install-action?style=flat-square&labelColor=0A0A0A&color=00FF9D)](https://github.com/AgentMindCloud/grok-install-action/releases)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache_2.0-00F0FF?style=flat-square&labelColor=0A0A0A)](./LICENSE)
[![Node ≥ 20](https://img.shields.io/badge/node-%E2%89%A5%2020-00FF9D?style=flat-square&labelColor=0A0A0A)](https://nodejs.org/)
[![Conventional Commits](https://img.shields.io/badge/commits-conventional-00F0FF?style=flat-square&labelColor=0A0A0A)](https://www.conventionalcommits.org/)

<br />

<img src="https://img.shields.io/badge/GROKINSTALL-action-00F0FF?style=for-the-badge&labelColor=0A0A0A" alt="GrokInstall Action" />
<img src="https://img.shields.io/badge/built_for-Grok_on_X-00FF9D?style=for-the-badge&labelColor=0A0A0A" alt="Built for Grok on X" />

# grok-install-action

**Validate `.grok/` agents, run the safety scanner, post inline PR annotations, and generate a Grok-Native Certified badge — on every push and pull request.**

<sub>Built for Grok on X · <a href="https://grokagents.dev">grokagents.dev</a></sub>

<br /><br />

<a href="https://grokagents.dev">
  <img src="./docs/img/pr-comment-hero.png" alt="GrokInstall pinned PR comment with safety score, findings table, and inline annotations on the Files Changed tab" width="760" />
</a>

</div>

---

## What it does

A composite GitHub Action that wraps [`grok-install-cli`](https://github.com/AgentMindCloud/grok-install-cli) so every PR and push gets:

- **Validate** — schema check against the 14 YAML specs
- **Scan** — safety + permissions audit with a numeric score (0-100)
- **Annotations** — inline `::error` / `::warning` on the Files Changed tab
- **PR comment** — a single pinned comment updated in place (no spam)
- **Badge** — brand-colored SVG committed to `/badges/grok-native-certified.svg` on `main`

> Auto-Post-to-X is **deferred to v2**. This action does not post to X.

---

## Quick start

Drop this into `.github/workflows/grokinstall.yml`:

```yaml
name: GrokInstall

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: write        # use 'read' if update-badge:false
  pull-requests: write
  checks: write

jobs:
  grokinstall:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: AgentMindCloud/grok-install-action@v1
```

### Quick add (one-liner)

```bash
mkdir -p .github/workflows && curl -fsSL \
  https://raw.githubusercontent.com/AgentMindCloud/grok-install-action/v1/workflows-examples/basic.yml \
  -o .github/workflows/grokinstall.yml
```

More examples in [`workflows-examples/`](./workflows-examples):
- [`basic.yml`](./workflows-examples/basic.yml) — minimal single-agent repo
- [`matrix.yml`](./workflows-examples/matrix.yml) — multi-agent monorepo fan-out
- [`release.yml`](./workflows-examples/release.yml) — gate on release tags

---

## What's new in v1.0

- **Marketplace launch.** Listed as `GrokInstall Validate & Scan` — see `marketplace.yml`.
- **CLI version pinned.** `cli-version` now defaults to `2.14.0` (was `latest`) for supply-chain reproducibility. Rationale and override syntax in [`docs/cli-version-pinning.md`](./docs/cli-version-pinning.md).
- **`visuals-preview` input (opt-in, default `false`).** When enabled on `cli-version >= 2.14.0`, the CLI renders an HTML preview and the URL is surfaced in the PR comment plus the new `visuals-preview-url` output. <!-- TODO: verify still supported — wiring declared in action.yml but scripts/run.sh does not forward --visuals-preview to the CLI nor set visuals-preview-url on $GITHUB_OUTPUT -->
- **Release automation.** Tag-triggered `.github/workflows/release.yml` cuts a GitHub Release, copies notes from `CHANGELOG.md`, and force-moves the floating `v1` major-version tag.
- **Community health files.** `CONTRIBUTING.md`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, `CODEOWNERS`, `FUNDING.yml`, issue forms, and a PR template.

> Auto-Post-to-X is still deferred to v2. This action does not post to X.

---

## Inputs

| Name | Default | Description |
| --- | --- | --- |
| `working-directory` | `.` | Path to the repo root containing `.grok/` (or a sub-directory for monorepos). |
| `mode` | `strict` | `strict` fails the job on errors. `warn` annotates only, never fails. |
| `cli-version` | `2.14.0` | `grok-install-cli` version to install (any npm dist-tag or semver). Floor: `>= 2.0.0`. See [`docs/cli-version-pinning.md`](./docs/cli-version-pinning.md). |
| `visuals-preview` | `false` | Forward `--visuals-preview` to the CLI and surface the rendered URL. Requires `cli-version >= 2.14.0`. <!-- TODO: verify still supported --> |
| `update-badge` | `true` | Generate `/badges/grok-native-certified.svg` and commit it on `main` pushes. |
| `comment-on-pr` | `true` | Post / update a PR comment with the report. |
| `github-token` | _(empty — falls back to `github.token`)_ | Token for PR comments + badge commit. Pass a PAT only if you need elevated scopes. |

## Outputs

| Name | Description |
| --- | --- |
| `passed` | `true` when validate + scan both succeeded. |
| `safety-score` | Numeric safety score 0-100. |
| `report-path` | Absolute path to the generated `report.json`. |
| `badge-path` | Repo-relative path to the SVG badge (when `update-badge: true`). |
| `visuals-preview-url` | URL of the rendered visuals preview (when `visuals-preview: true` on `cli-version >= 2.14.0`). Empty string otherwise. <!-- TODO: verify still supported --> |

---

## Embed the badge

After the first run on `main`, embed the badge in your README:

```markdown
[![Grok-Native Certified](./badges/grok-native-certified.svg)](https://grokagents.dev)
```

Or use a shields.io endpoint (auto-updates from your last run):

```markdown
![Grok-Native](https://img.shields.io/badge/Grok--Native-certified-00FF9D?style=for-the-badge&labelColor=0A0A0A)
```

Brand tokens for custom badges:

| Token | Value |
| --- | --- |
| Background | `#0A0A0A` |
| Primary neon (cyan) | `#00F0FF` |
| Success neon (green) | `#00FF9D` |
| Danger | `#FF2D55` |

---

## How it works

```
┌──────────────────┐    ┌──────────────┐    ┌─────────────────────┐
│ actions/checkout │──▶ │ setup-node@20│──▶ │ npm i -g grok-      │
└──────────────────┘    └──────────────┘    │ install-cli@<ver>   │
                                            └──────────┬──────────┘
                                                       ▼
                              ┌────────────────────────────────────────────┐
                              │ scripts/run.sh                             │
                              │   grok-install validate --json             │
                              │   grok-install scan --json                 │
                              │   → normalized report.json                 │
                              └──────────┬─────────────────────────────────┘
                                         ▼
                ┌────────────────────────┼────────────────────────┐
                ▼                        ▼                        ▼
      scripts/annotations.js    scripts/comment.js      scripts/badge.js
      ::error / ::warning       upsert PR comment       brand-colored SVG
      + job summary             (hidden marker)         (green/cyan/red)
```

The PR-comment marker is `<!-- grokinstall-action:pr-comment -->` — swap it per-agent if you want matrix jobs to post separate comments instead of fighting over one.

The action pins:
- Node **20**
- `@actions/core@1.10.1`, `@actions/github@6.0.0`, `@octokit/rest@20.1.1`
- Composite action steps reference each script by absolute path under `${{ github.action_path }}`

---

## Permissions

Minimum token scopes — see [SECURITY.md](./SECURITY.md) for detail.

| Scope | Needed for | Required when |
| --- | --- | --- |
| `contents: read` | checkout + cli runs | always |
| `contents: write` | commit `/badges/*.svg` back to `main` | `update-badge: true` |
| `pull-requests: write` | post / update PR comment | `comment-on-pr: true` |
| `checks: write` | render `::error` / `::warning` annotations | always |

---

## Local development

```bash
npm ci
npm test                   # runs tests/unit.test.js against fixture reports
```

Integration test (what CI runs):

```bash
# Self-test uses the bundled sample agent
grok-install validate tests/sample-agent
grok-install scan     tests/sample-agent
```

CI wires the same flow end-to-end via [`.github/workflows/test.yml`](./.github/workflows/test.yml), invoking the action against `tests/sample-agent` in `mode: warn`.

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for PR guidelines and [`CHANGELOG.md`](./CHANGELOG.md) for release history.

---

<div align="center">

<sub>Powered by <b>GrokInstall</b> · <a href="https://grokagents.dev">grokagents.dev</a></sub>

<sub><i>GrokInstall is an independent community project. Not affiliated with xAI, Grok, or X.</i></sub>

</div>
