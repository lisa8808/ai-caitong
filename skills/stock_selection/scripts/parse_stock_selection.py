#!/usr/bin/env python3
"""Parse common Chinese A-share stock selection prompts into simple rules."""

from __future__ import annotations

import argparse
import json
import re
import sys


def _number_after(text: str, patterns: list[str]) -> float | None:
    for pattern in patterns:
        match = re.search(pattern, text, re.I)
        if match:
            return float(match.group(1))
    return None


def parse(prompt: str) -> dict[str, object]:
    rules: list[dict[str, object]] = []
    pe_max = _number_after(prompt, [r"PE(?:低于|小于|<)\s*(\d+(?:\.\d+)?)", r"市盈率(?:低于|小于|<)\s*(\d+(?:\.\d+)?)"])
    if pe_max is not None:
        rules.append({"field": "pe_ttm", "op": "<", "value": pe_max, "label": f"PE低于{pe_max:g}"})
    roe_min = _number_after(prompt, [r"ROE(?:大于|高于|>)\s*(\d+(?:\.\d+)?)", r"净资产收益率(?:大于|高于|>)\s*(\d+(?:\.\d+)?)"])
    if roe_min is not None:
        rules.append({"field": "roe", "op": ">", "value": roe_min, "label": f"ROE大于{roe_min:g}%"})
    circ_mv_min_yi = _number_after(prompt, [r"流通市值(?:大于|高于|超过|>)\s*(\d+(?:\.\d+)?)\s*亿"])
    if circ_mv_min_yi is not None:
        rules.append({"field": "circ_mv", "op": ">", "value": circ_mv_min_yi * 10000, "label": f"流通市值大于{circ_mv_min_yi:g}亿"})
    total_mv_min_yi = _number_after(prompt, [r"总市值|市值(?:大于|高于|超过|>)\s*(\d+(?:\.\d+)?)\s*亿"])
    if total_mv_min_yi is not None:
        rules.append({"field": "total_mv", "op": ">", "value": total_mv_min_yi * 10000, "label": f"总市值大于{total_mv_min_yi:g}亿"})
    if "主力资金" in prompt or "资金流入" in prompt:
        rules.append({"field": "main_net_amount", "op": ">", "value": 0, "window": "5d", "label": "近5日主力资金净流入为正"})
    if "均线" in prompt or "多头" in prompt:
        rules.append({"field": "ma", "op": "trend", "value": "ma5 > ma10", "label": "短期均线偏强"})
    if "半导体" in prompt:
        rules.append({"field": "industry_or_concept", "op": "match", "value": "半导体", "label": "匹配半导体行业/概念"})
    if "新能源" in prompt:
        rules.append({"field": "industry_or_concept", "op": "match", "value": "新能源", "label": "匹配新能源行业/概念"})
    return {"success": True, "prompt": prompt, "rules": rules}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("prompt", nargs="*", help="Prompt text. Defaults to stdin.")
    args = parser.parse_args()
    prompt = " ".join(args.prompt) or sys.stdin.read()
    print(json.dumps(parse(prompt), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
