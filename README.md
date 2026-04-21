<div align="center">

<img src="https://img.shields.io/badge/GROKINSTALL-action-00F0FF?style=for-the-badge&labelColor=0A0A0A" alt="GrokInstall Action" />
<img src="https://img.shields.io/badge/built_for-Grok_on_X-00FF9D?style=for-the-badge&labelColor=0A0A0A" alt="Built for Grok on X" />

# grok-install-action

**Validate `.grok/` agents, run the safety scanner, post inline PR annotations, and generate a Grok-Native Certified badge — on every push and pull request.**

<sub>Built for Grok on X · <a href="https://grokagents.dev">grokagents.dev</a></sub>

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

More examples in [`workflows-examples/`](./workflows-examples):
- [`basic.yml`](./workflows-examples/basic.yml) — minimal single-agent repo
- [`matrix.yml`](./workflows-examples/matrix.yml) — multi-agent monorepo fan-out
- [`release.yml`](./workflows-examples/release.yml) — gate on release tags

---

## Inputs

| Name | Default | Description |
| --- | --- | --- |
| `working-directory` | `.` | Path to the repo root containing `.grok/` (or a sub-directory for monorepos). |
| `mode` | `strict` | `strict` fails the job on errors. `warn` annotates only, never fails. |
| `cli-version` | `latest` | `grok-install-cli` version to install (any npm dist-tag or semver). |
| `update-badge` | `true` | Generate `/badges/grok-native-certified.svg` and commit it on `main` pushes. |
| `comment-on-pr` | `true` | Post / update a PR comment with the report. |
| `github-token` | `${{ github.token }}` | Token for PR comments + badge commit. |

## Outputs

| Name | Description |
| --- | --- |
| `passed` | `true` when validate + scan both succeeded. |
| `safety-score` | Numeric safety score 0-100. |
| `report-path` | Absolute path to the generated `report.json`. |
| `badge-path` | Repo-relative path to the SVG badge (when `update-badge: true`). |

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

---

<div align="center">

<sub>Powered by <b>GrokInstall</b> · <a href="https://grokagents.dev">grokagents.dev</a></sub>

<sub><i>GrokInstall is an independent community project. Not affiliated with xAI, Grok, or X.</i></sub>

</div>
