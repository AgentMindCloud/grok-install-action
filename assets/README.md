# Marketing assets

Binary exports for the GitHub Marketplace listing and the Session 7
X launch thread. SVG sources live in `../grok-install-brand/` and
are the source of truth — regenerate PNGs when the SVGs change.

## Marketplace icons (required before listing)

```bash
npx sharp-cli \
  -i ../grok-install-brand/icons/shield-128.svg \
  -o marketplace-icon-128.png
npx sharp-cli \
  -i ../grok-install-brand/icons/shield-256.svg \
  -o marketplace-icon-256.png
```

Upload `marketplace-icon-128.png` as the Marketplace listing icon.
`marketplace-icon-256.png` is the hero asset.

## PR-comment hero screenshots

| Path | State | Source |
|---|---|---|
| `hero-comment-pass.png` | Grok-Native Certified, score 100/100 | captured in Session 8 from a real PR run |
| `hero-comment-fail.png` | Failed, score 85/100 | captured in Session 8 from a real PR run |

**Reconciliation note:** `hero-comment-fail.png` must render **one**
issue row — the `grok-install.yaml:5 grokinstall.platform-enum`
row with the exact message
`runtime.platform must be one of 'x', 'grok-cli', 'grokagents.dev'. Got 'twitter'.`
and safety score 85/100. The `grokinstall.rate-limit-exceeds-profile`
rule ships in the registry and has its own unit test
(`tests/sample-agent-rl/`) but does **not** appear in the failing
PR-comment snapshot — that would push the score to 70 and invalidate
the locked 85/100 number used across the marketing pack.

Do not restore a second row to the screenshot.

## X launch-thread cards

Source SVGs are at `../grok-install-brand/launch/session-7/`.
See that directory's README for PNG export commands.
