# Security

## Reporting a vulnerability

Please email **security@grokagents.dev** or open a private Security Advisory on the repository. Do **not** file public issues for suspected vulnerabilities.

We aim to acknowledge reports within **72 hours** and ship a fix in the next patch release.

## Required token permissions

`grok-install-action` runs inside GitHub Actions and uses the least-privilege principle. Grant only what you need:

```yaml
permissions:
  contents: read          # always required (checkout + cli execution)
  contents: write         # ONLY when update-badge: true (default)
  pull-requests: write    # ONLY when comment-on-pr: true (default)
  checks: write           # always required (::error / ::warning annotations)
```

If you disable both `update-badge` and `comment-on-pr`, this is sufficient:

```yaml
permissions:
  contents: read
  checks: write
```

## What the action executes

- Installs the `grok-install` package from PyPI via `pip install "grok-install==<cli-version>"`. Pin to an exact version (e.g. `2.14.0`) in security-sensitive repos rather than a floating range.
- Runs `grok-install validate --json` and `grok-install scan --json` in your repo.
- Reads the generated report, writes GitHub workflow commands, and (optionally) calls the GitHub REST API to upsert a PR comment.
- On `push` to `main` with `update-badge: true`, commits a single SVG under `badges/` using the provided token.

The action never:
- Posts to X, Slack, or any third-party service.
- Exfiltrates repository contents.
- Reads secrets beyond the `github-token` you pass it.

## Supply-chain hygiene

- All Node dependencies are pinned to exact versions in [`package.json`](./package.json).
- The action runs on Node **20** via `actions/setup-node@v4`.
- Composite-action steps reference scripts by absolute path under `${{ github.action_path }}`, so users pinning this action to a SHA get reproducible behavior.
- Release tags are signed; verify with `git verify-tag vX.Y.Z`.

## Pinning recommendation

For production repos, pin to a commit SHA:

```yaml
- uses: AgentMindCloud/grok-install-action@<full-commit-sha>  # v1.1.0
```

Major-version tag (`@v1`) is convenient but mutable.

---

<sub>GrokInstall is an independent community project. Not affiliated with xAI, Grok, or X.</sub>
