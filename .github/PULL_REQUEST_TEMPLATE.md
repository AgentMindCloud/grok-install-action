<!-- Thanks for contributing! Fill in each section below. Delete sections that
     don't apply. Keep the title in Conventional Commit form:
     feat: ..., fix: ..., docs: ..., chore: ..., refactor: ..., test: ... -->

## Summary

<!-- One paragraph: what changed and why. Focus on the "why" — the diff shows the "what". -->

## Linked issue

<!-- Closes #123, Fixes #456, or "N/A — trivial change". -->
Closes #

## Testing

<!-- How did you verify this? Include the commands you ran. -->

- [ ] `npm test` passes locally
- [ ] Self-integration against `tests/sample-agent` still green
- [ ] Tested against a consumer workflow (paste link or describe)

## Screenshots / logs

<!-- For changes that affect the PR comment, job summary, or badge SVG, paste
     before/after screenshots or log snippets. Delete this section otherwise. -->

## Checklist

- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
- [ ] I updated `CHANGELOG.md` under the `[Unreleased]` section
- [ ] I updated `README.md` if inputs, outputs, or permissions changed
- [ ] I updated the inputs/outputs tables in `action.yml` if the surface changed
- [ ] I updated `workflows-examples/` if a default consumer pattern changed
- [ ] No new runtime npm dependencies were added (or I explained why one is necessary)
- [ ] I did **not** introduce any network calls outside `grok-install-cli` and the GitHub API
- [ ] I am not adding Auto-Post-to-X behavior (deferred to v2)
- [ ] I agree to license my contribution under Apache-2.0 (same as the project)
