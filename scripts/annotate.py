"""Parse grok-install scan + validate JSON, emit GitHub annotations, set outputs."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any


def _load(path: Path) -> dict[str, Any]:
    if not path.exists() or path.stat().st_size == 0:
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"::error::Failed to parse {path}: {exc}", file=sys.stderr)
        return {}


def _annotate(level: str, message: str, file: str | None, line: int | None) -> None:
    # GitHub workflow command: https://docs.github.com/actions/reference/workflow-commands
    parts = []
    if file:
        parts.append(f"file={file}")
    if line:
        parts.append(f"line={line}")
    prefix = f"::{level} " + ",".join(parts) + "::" if parts else f"::{level}::"
    # Newlines break workflow commands; encode them.
    safe = message.replace("\r", "").replace("\n", "%0A")
    print(f"{prefix}{safe}")


def _iter_findings(validate: dict[str, Any]):
    """Yield (level, message, file, line) tuples from validate JSON.

    Accepts either {"findings": [...]} or {"errors": [...], "warnings": [...]}.
    """
    if not validate:
        return
    if isinstance(validate.get("findings"), list):
        for item in validate["findings"]:
            level = str(item.get("severity") or item.get("level") or "error").lower()
            yield (
                "warning" if level in {"warn", "warning"} else "error",
                str(item.get("message") or item.get("msg") or ""),
                item.get("file") or item.get("path"),
                item.get("line"),
            )
        return
    for item in validate.get("errors") or []:
        yield ("error", str(item.get("message") or item.get("msg") or ""),
               item.get("file") or item.get("path"), item.get("line"))
    for item in validate.get("warnings") or []:
        yield ("warning", str(item.get("message") or item.get("msg") or ""),
               item.get("file") or item.get("path"), item.get("line"))


def _set_output(name: str, value: str) -> None:
    out = os.environ.get("GITHUB_OUTPUT")
    if not out:
        print(f"{name}={value}")
        return
    with open(out, "a", encoding="utf-8") as fh:
        fh.write(f"{name}={value}\n")


def _summary(text: str) -> None:
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not path:
        return
    with open(path, "a", encoding="utf-8") as fh:
        fh.write(text)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--scan", required=True, type=Path)
    ap.add_argument("--validate", required=True, type=Path)
    ap.add_argument("--report", required=True, type=Path)
    ap.add_argument("--fail-on-warning", default="false")
    args = ap.parse_args()

    scan = _load(args.scan)
    validate = _load(args.validate)

    errors = 0
    warnings = 0
    for level, message, file, line in _iter_findings(validate):
        _annotate(level, message, file, line)
        if level == "error":
            errors += 1
        else:
            warnings += 1

    # Prefer counts reported by the CLI when present.
    errors = int(validate.get("error_count", errors)) if isinstance(validate, dict) else errors
    warnings = int(validate.get("warning_count", warnings)) if isinstance(validate, dict) else warnings

    report = {"scan": scan, "validate": validate,
              "errors": errors, "warnings": warnings}
    args.report.write_text(json.dumps(report, indent=2), encoding="utf-8")

    _set_output("report", str(args.report))
    _set_output("errors", str(errors))
    _set_output("warnings", str(warnings))

    manifests = scan.get("manifests") if isinstance(scan, dict) else None
    manifest_count = len(manifests) if isinstance(manifests, list) else 0
    _summary(
        f"## grok-install\n\n"
        f"- Manifests scanned: **{manifest_count}**\n"
        f"- Errors: **{errors}**\n"
        f"- Warnings: **{warnings}**\n"
    )

    fail_on_warning = str(args.fail_on_warning).lower() in {"1", "true", "yes"}
    if errors > 0:
        return 1
    if fail_on_warning and warnings > 0:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
