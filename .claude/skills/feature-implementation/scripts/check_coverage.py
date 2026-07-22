#!/usr/bin/env python3
"""
Parse a coverage report (coverage.xml or coverage-summary.json) and fail
if total coverage is below the threshold.

Usage:
    check_coverage.py [--min 80] [--file coverage.xml]

Recognizes:
  * Cobertura / pytest-cov XML  (coverage.xml)
  * Istanbul / jest JSON-summary (coverage/coverage-summary.json)
  * Go coverprofile               (coverage.out)

Exits:
  0 — coverage meets threshold
  1 — below threshold
  2 — couldn't parse any known format
"""
from __future__ import annotations

import argparse
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def parse_cobertura(path: Path) -> float | None:
    try:
        tree = ET.parse(path)
        root = tree.getroot()
        line_rate = root.attrib.get("line-rate")
        if line_rate is None:
            return None
        return float(line_rate) * 100.0
    except (ET.ParseError, ValueError, OSError):
        return None


def parse_istanbul(path: Path) -> float | None:
    try:
        data = json.loads(path.read_text())
        total = data.get("total", {})
        lines = total.get("lines", {})
        return float(lines.get("pct")) if "pct" in lines else None
    except (json.JSONDecodeError, ValueError, OSError):
        return None


def parse_goprofile(path: Path) -> float | None:
    try:
        lines = path.read_text().splitlines()
        covered = 0
        total = 0
        for line in lines[1:]:  # skip "mode:" header
            parts = line.split()
            if len(parts) < 3:
                continue
            stmts = int(parts[-2])
            count = int(parts[-1])
            total += stmts
            if count > 0:
                covered += stmts
        if total == 0:
            return None
        return (covered / total) * 100.0
    except (ValueError, OSError):
        return None


def autodetect() -> tuple[Path, str] | None:
    for name, fmt in [
        ("coverage.xml", "cobertura"),
        ("coverage/coverage-summary.json", "istanbul"),
        ("coverage.out", "goprofile"),
    ]:
        if Path(name).exists():
            return Path(name), fmt
    return None


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--min", type=float, default=80.0, help="minimum coverage pct")
    p.add_argument("--file", type=Path, default=None)
    p.add_argument("--format", choices=["cobertura", "istanbul", "goprofile"], default=None)
    args = p.parse_args()

    if args.file:
        if not args.format:
            name = args.file.name
            if name.endswith(".xml"):
                args.format = "cobertura"
            elif name.endswith(".json"):
                args.format = "istanbul"
            elif name.endswith(".out"):
                args.format = "goprofile"
        path, fmt = args.file, args.format
    else:
        auto = autodetect()
        if not auto:
            print("no coverage report found (looked for coverage.xml, coverage-summary.json, coverage.out)", file=sys.stderr)
            return 2
        path, fmt = auto

    if fmt == "cobertura":
        pct = parse_cobertura(path)
    elif fmt == "istanbul":
        pct = parse_istanbul(path)
    elif fmt == "goprofile":
        pct = parse_goprofile(path)
    else:
        print(f"unknown format: {fmt}", file=sys.stderr)
        return 2

    if pct is None:
        print(f"could not parse coverage from {path}", file=sys.stderr)
        return 2

    status = "OK" if pct >= args.min else "FAIL"
    print(f"{status}: coverage {pct:.2f}% (threshold {args.min:.2f}%)")
    return 0 if pct >= args.min else 1


if __name__ == "__main__":
    sys.exit(main())
