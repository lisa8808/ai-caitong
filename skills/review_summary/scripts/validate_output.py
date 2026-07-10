#!/usr/bin/env python3
"""Validate review summary report structure."""

from __future__ import annotations

import argparse
import json
import re
import sys


REQUIRED_SECTIONS = [
    "## 一、报告信息",
    "## 二、核心结论",
    "## 三、主体复盘",
    "## 四、明日观察 / 下期迭代",
    "## 五、风险与免责声明",
]

FORBIDDEN = ["必涨", "稳赚", "满仓", "建议买入", "建议卖出", "目标价", "止损位"]


def validate(markdown: str) -> dict[str, object]:
    errors: list[str] = []
    if not markdown.lstrip().startswith("# "):
        errors.append("missing first-level report title")
    if "生成时间" not in markdown:
        errors.append("missing generated time")
    for section in REQUIRED_SECTIONS:
        if section not in markdown:
            errors.append(f"missing section: {section}")
    for word in FORBIDDEN:
        if re.search(re.escape(word), markdown):
            errors.append(f"forbidden trading advice word: {word}")
    if "不构成任何投资建议" not in markdown:
        errors.append("missing investment-advice disclaimer")
    return {"success": not errors, "errors": errors}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", help="Markdown file. Defaults to stdin.")
    args = parser.parse_args()
    text = open(args.input, "r", encoding="utf-8").read() if args.input else sys.stdin.read()
    result = validate(text)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["success"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
