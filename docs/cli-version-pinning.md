# CLI version pinning strategy

This action's `cli-version` input defaults to an **exact** version of the
`grok-install` PyPI package, not a moving release channel. This document
explains why, how to override it safely, and how we plan to support CLI
releases going forward.

## Why pin an exact version

1. **Reproducibility.** A workflow that green-lights a PR today should green-light it tomorrow. Floating to the latest CLI means a new release — even a patch — can change findings, rule IDs, or severity without any change in the consumer repo.
2. **Supply-chain.** `pip install grok-install` resolves at job time. If a release is repointed or yanked (legitimately, or by an attacker), every downstream CI run pulls the new wheel. Pinning constrains blast radius.
3. **Reviewability.** A version bump in `cli-version` shows up as a visible diff in the consumer's workflow file. A floating range hides the upgrade.

## Current default

| Action version | `cli-version` default | CLI features assumed available |
| --- | --- | --- |
| `v1.1.0` | `2.14.0` | validate, scan, badge, **visuals-preview** |
| `v1.1.x` (future patches) | `2.14.x` | same as above |

## Overrides

`cli-version` accepts **any** PEP 440 specifier. A bare version like `2.14.0`
is treated as `==2.14.0`; a value that starts with `==`, `>=`, `<=`, `~=`,
`!=`, `>`, or `<` is passed through verbatim.

```yaml
# Exact pin — recommended for production, identical across reruns.
- uses: AgentMindCloud/grok-install-action@v1
  with:
    cli-version: "2.14.0"

# Compatible release — accept newer 2.14.x patches automatically. Trades
# reproducibility for easier upgrades; suitable for bleeding-edge projects.
- uses: AgentMindCloud/grok-install-action@v1
  with:
    cli-version: "~=2.14.0"

# Range — stay on 2.x but allow new minors until 3.0. Refuse 3.x until you opt in.
- uses: AgentMindCloud/grok-install-action@v1
  with:
    cli-version: ">=2.14,<3"
```

The string is passed verbatim to `pip install "grok-install<value>"`, so any
PEP 440 specifier works here.

## Version support policy

- **Floor.** The action requires `grok-install >= 2.0.0`. CLI `1.x` produced a different JSON shape and is not supported.
- **Visuals-preview floor.** The `visuals-preview` input requires `cli-version >= 2.14.0`. Setting `visuals-preview: true` on an older CLI is a no-op (the flag is ignored and `visuals-preview-url` is empty).
- **Support window.** We test against the two most recent CLI minor versions (N and N−1). Older releases may keep working but are not part of CI.
- **Deprecation.** If a CLI major version is deprecated, the action's `cli-version` default moves to the next stable line in a **minor** release, and a warning annotation fires on every run until the consumer pins explicitly.

## When the default will change

- **Patch bumps** to `grok-install` (e.g. `2.14.1`) — arrive in action `v1.x.y` patches. Behavior-preserving.
- **Minor bumps** (e.g. `2.15.0`) — arrive in action `v1.y.0` minors. New features remain opt-in.
- **Major bumps** (e.g. `3.0.0`) — require a new major action tag (`v2`). The `v1` floating tag continues to track `cli-version: 2.x` until support is withdrawn.

## Testing across CLI versions

Library authors who publish `.grok/` agent templates should matrix-test against the supported CLI window:

```yaml
jobs:
  compat:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        cli-version: ["2.13.2", "2.14.0"]
    steps:
      - uses: actions/checkout@v4
      - uses: AgentMindCloud/grok-install-action@v1
        with:
          cli-version: ${{ matrix.cli-version }}
          mode: warn              # never fail CI on cli-specific drift
          update-badge: false     # avoid concurrent badge commits
          comment-on-pr: false    # avoid N duplicate comments per PR
```

Pair this with `if: matrix.cli-version == '2.14.0'` on a downstream "canonical" job that owns the badge + PR comment so consumers get one authoritative report per run.

## Related reading

- [`SECURITY.md`](../SECURITY.md) — full supply-chain stance, including SHA-pinning the action itself.
- [`CHANGELOG.md`](../CHANGELOG.md) — which action release bumped `cli-version` and why.
- [`grok-install` on PyPI](https://pypi.org/project/grok-install/) — wheels and version history.
- [`grok-install-cli` release notes](https://github.com/AgentMindCloud/grok-install-cli/releases) — per-version rule and scoring changes.
