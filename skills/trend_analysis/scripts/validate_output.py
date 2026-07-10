#!/usr/bin/env python3
"""Validate trend analysis report structure."""

from __future__ import annotations

import argparse
import json
import re
import sys


REQUIRED_SECTIONS = [
    "## 趋势形态表征",
    "## 深度溯源分析",
    "## 可持续性预判",
    "## 全市场趋势小结",
]

REQUIRED_HEADERS = [
    "| 股票代码 | 股票名称 | 所属板块 | 趋势类型 | 趋势周期 | 阶段累计涨跌幅 | 趋势形态特征 | 当前所处阶段 |",
    "| 股票代码 | 核心底层根因 | 溯源维度 | 根因存续状态 | 信息置信度 | 趋势支撑时效 |",
    "| 股票代码 | 当前趋势动力 | 核心支撑逻辑是否存续 | 后续行情预判 | 潜在上涨空间 | 风险点 | 可持续周期预判 |",
]

FORBIDDEN = ["建议买入", "建议卖出", "买点", "卖点", "止损位", "目标价", "仓位配置", "满仓"]


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
    if "根因存续状态" not in markdown:
        errors.append("missing root-cause status")
    if "后续行情预判" not in markdown:
        errors.append("missing follow-up prediction")
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
