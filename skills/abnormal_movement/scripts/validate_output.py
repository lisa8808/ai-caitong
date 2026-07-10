#!/usr/bin/env python3
"""Validate abnormal movement report structure."""

from __future__ import annotations

import argparse
import json
import re
import sys


REQUIRED_SECTIONS = [
    "## 异动基础表征",
    "## 多维度归因拆解",
    "## 全局异动归因总结",
    "## 短期异动影响小结",
]

REQUIRED_HEADERS = [
    "| 股票代码 | 股票名称 | 所属板块 | 异动类型 | 区间涨跌幅 | 异动触发阈值 | 当日成交额 / 资金净流入 |",
    "| 股票代码 | 直接表层诱因 | 诱因分类 | 信息来源 | 影响权重 | 情绪值 | 置信度分值 | 诱因时效 |",
    "| 全局归因主题 | 影响板块 / 标的 | 归因分类 | 核心证据 | 市场影响权重 | 情绪值 | 置信度分值 | 异动性质 |",
]

FORBIDDEN = ["建议买入", "建议卖出", "买入", "卖出", "加仓", "减仓", "仓位建议", "满仓", "清仓"]


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
    if "置信度分值" not in markdown:
        errors.append("missing confidence score column")
    if "市场影响权重" not in markdown:
        errors.append("missing global market impact weight column")
    if "情绪值" not in markdown:
        errors.append("missing sentiment score column")
    if "异动性质" not in markdown:
        errors.append("missing movement nature column")
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
