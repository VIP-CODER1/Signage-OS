#!/usr/bin/env python3
"""
Scaffold a new component/module from a template.

Usage:
    scaffold_component.py <type> <name> [--dir <path>]

Types:
    react-component   -> <Name>.tsx + <Name>.test.tsx
    python-module     -> <name>.py + test_<name>.py
    go-package        -> <name>.go + <name>_test.go

The template comes from ../assets/. Edit those to match your project style.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ASSETS = HERE.parent / "assets"


def to_pascal(name: str) -> str:
    return "".join(p.capitalize() for p in re.split(r"[-_\s]+", name) if p)


def to_snake(name: str) -> str:
    s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1).lower()


def render(template_text: str, ctx: dict) -> str:
    out = template_text
    for k, v in ctx.items():
        out = out.replace(f"{{{{{k}}}}}", v)
    return out


def scaffold(kind: str, name: str, target_dir: Path) -> list[Path]:
    target_dir.mkdir(parents=True, exist_ok=True)
    created = []

    if kind == "react-component":
        pascal = to_pascal(name)
        ctx = {"COMPONENT_NAME": pascal}
        for src_name, dest_name in [
            ("react-component.tsx.template", f"{pascal}.tsx"),
            ("react-component.test.tsx.template", f"{pascal}.test.tsx"),
        ]:
            tpl = ASSETS / src_name
            if not tpl.exists():
                print(f"missing template: {tpl}", file=sys.stderr)
                sys.exit(1)
            out_path = target_dir / dest_name
            if out_path.exists():
                print(f"refusing to overwrite: {out_path}", file=sys.stderr)
                sys.exit(2)
            out_path.write_text(render(tpl.read_text(), ctx))
            created.append(out_path)

    elif kind == "python-module":
        snake = to_snake(name)
        ctx = {"MODULE_NAME": snake, "MODULE_CLASS": to_pascal(name)}
        for src_name, dest_name in [
            ("python-module.py.template", f"{snake}.py"),
            ("python-module.test.py.template", f"test_{snake}.py"),
        ]:
            tpl = ASSETS / src_name
            if not tpl.exists():
                print(f"missing template: {tpl}", file=sys.stderr)
                sys.exit(1)
            out_path = target_dir / dest_name
            if out_path.exists():
                print(f"refusing to overwrite: {out_path}", file=sys.stderr)
                sys.exit(2)
            out_path.write_text(render(tpl.read_text(), ctx))
            created.append(out_path)

    elif kind == "go-package":
        snake = to_snake(name)
        ctx = {"PACKAGE_NAME": snake}
        for src_name, dest_name in [
            ("go-package.go.template", f"{snake}.go"),
            ("go-package.test.go.template", f"{snake}_test.go"),
        ]:
            tpl = ASSETS / src_name
            if not tpl.exists():
                print(f"missing template: {tpl}", file=sys.stderr)
                sys.exit(1)
            out_path = target_dir / dest_name
            if out_path.exists():
                print(f"refusing to overwrite: {out_path}", file=sys.stderr)
                sys.exit(2)
            out_path.write_text(render(tpl.read_text(), ctx))
            created.append(out_path)

    else:
        print(f"unknown type: {kind}", file=sys.stderr)
        sys.exit(1)

    return created


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("kind", choices=["react-component", "python-module", "go-package"])
    p.add_argument("name")
    p.add_argument("--dir", default=".", help="output directory")
    args = p.parse_args()

    created = scaffold(args.kind, args.name, Path(args.dir))
    for f in created:
        print(f"created: {f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
