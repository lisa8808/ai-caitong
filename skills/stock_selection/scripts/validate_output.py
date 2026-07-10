#!/usr/bin/env python3
"""Validate stock-selection report structure."""

from __future__ import annotations

import argparse
import json
import re
import sys


REQUIRED_SECTIONS = [
    "## 用户需求解析",
    "## 生效筛选因子",
    "## 最终股票列表",
    "## 分析总结与推荐原因",
    "## 风险提示",
]

REQUIRED_HEADERS = [
    "| 原始语义 | 量化解释 | Tushare字段 | 条件 |",
    "| 标的代码 | 标的名称 | 所属行业 | 核心匹配指标 | 入选/推荐原因 |",
]

FORBIDDEN = ["必涨", "稳赚", "满仓", "买点", "卖点", "止盈", "止损", "建议买入", "建议卖出"]


def validate(markdown: str) -> dict[str, object]:
    errors: list[str] = []
    if not markdown.lstrip().startswith("# "):
        errors.append("missing first-level report title")
    if "生成时间" not in markdown:
        errors.append("missing generated time")
    for section in REQUIRED_SECTIONS:
        if section not in markdown:
            errors.append(f"missing section: {section}")
    for header in REQUIRED_HEADERS:
        if header not in markdown:
            errors.append(f"missing table header: {header}")
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
