#!/usr/bin/env python3
"""Apply simple parsed stock-selection rules to candidate rows."""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any


def _num(value: Any) -> float | None:
    try:
        n = float(value)
    except (TypeError, ValueError):
        return None
    return n if n == n else None


def _passes(row: dict[str, Any], rule: dict[str, Any]) -> bool:
    field = str(rule.get("field") or "")
    op = rule.get("op")
    value = rule.get("value")
    if field == "industry_or_concept":
        text = f"{row.get('industry', '')} {row.get('concept', '')} {row.get('name', '')}"
        return str(value) in text
    if field == "ma":
        ma5 = _num(row.get("ma5"))
        ma10 = _num(row.get("ma10"))
        return ma5 is not None and ma10 is not None and ma5 > ma10
    n = _num(row.get(field))
    if n is None and field == "pe_ttm":
        n = _num(row.get("pe"))
    threshold = _num(value)
    if n is None or threshold is None:
        return True
    if op == "<":
        return n < threshold
    if op == ">":
        return n > threshold
    return True


def filter_candidates(payload: dict[str, Any]) -> dict[str, Any]:
    rows = payload.get("candidates") or []
    rules = payload.get("rules") or []
    safe_rows = [r for r in rows if isinstance(r, dict) and "ST" not in str(r.get("name", "")) and "退" not in str(r.get("name", ""))]
    selected = [row for row in safe_rows if all(_passes(row, rule) for rule in rules)]
    return {"success": True, "data": selected}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", help="Input JSON file. Defaults to stdin.")
    args = parser.parse_args()
    text = open(args.input, "r", encoding="utf-8").read() if args.input else sys.stdin.read()
    payload = json.loads(text or "{}")
    print(json.dumps(filter_candidates(payload), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
