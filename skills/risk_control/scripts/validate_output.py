#!/usr/bin/env python3
"""Validate risk control report structure."""

from __future__ import annotations

import argparse
import json
import re
import sys


REQUIRED_SECTIONS = [
    "## 个股风控等级总览",
    "## 风险归因明细",
    "## 标准化风控操作建议",
    "## 全仓风控日报总结",
]

REQUIRED_HEADERS = [
    "| 股票代码 | 股票名称 | 持仓状态 | 当前风险等级 | 风险类型 | 当日波动情况 | 资金状态 | 舆情风险状态 |",
    "| 股票代码 | 具体风险点 | 风险来源 | 风险置信度 | 风险影响周期 | 是否持续性利空 |",
    "| 股票代码 | 建议操作 | 操作逻辑 | 安全边际提示 | 后续跟踪条件 |",
]

VAGUE_PHRASES = ["谨慎关注", "有待观察", "酌情处理", "视情况而定"]
FORBIDDEN = ["建议买入", "建议卖出", "买点", "卖点", "目标价", "加仓", "满仓", "翻倍", "必涨"]


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
    for phrase in VAGUE_PHRASES:
        if phrase in markdown:
            errors.append(f"vague phrasing: {phrase}")
    for word in FORBIDDEN:
        if re.search(re.escape(word), markdown):
            errors.append(f"forbidden word: {word}")
    if "风险等级" not in markdown:
        errors.append("missing risk level")
    if "建议操作" not in markdown:
        errors.append("missing operation advice column")
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
