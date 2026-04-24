# Session 7 Launch Cards

Four 1200×675 SVG sources for the X launch thread. Export to PNG before
posting — PNG exports are deferred to Session 8.

## Files

| SVG source | Final headline |
|---|---|
| `card-1-hero.svg` | grok-install-action is live. |
| `card-2-failing-comment.svg` | Inline fix path. No triage. |
| `card-3-passing-comment.svg` | Grok-Native Certified. |
| `card-4-basic-yml.svg` | Drop-in CI gate. |

## PNG export

```bash
cd grok-install-brand/launch/session-7
for f in card-*.svg; do
  npx sharp-cli -i "$f" -o "${f%.svg}.png" --resize 1200,675
done
```

Or using Inkscape (better text rendering if Space Grotesk is installed):

```bash
for f in card-*.svg; do
  inkscape "$f" --export-type=png --export-filename="${f%.svg}.png" -w 1200 -h 675
done
```

## Important

Card 2 renders the **real one-row failing state** — a single
`grokinstall.platform-enum` violation with the exact message
`runtime.platform must be one of 'x', 'grok-cli', 'grokagents.dev'. Got 'twitter'.`
The marketing brief's earlier two-row mockup is out of sync with the
action's actual output after the score-vs-rows reconciliation; do not
restore the second row.

The disclaimer line is embedded at the bottom of each card at 11px
italic, 0.5 alpha — don't strip it during PNG export.
