#!/usr/bin/env python3
"""Build context text for trend analysis."""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any


def _fmt(value: Any, suffix: str = "") -> str:
    if value is None or value == "":
        return "-"
    return f"{value}{suffix}"


def build_context(payload: dict[str, Any]) -> str:
    trend_rows = payload.get("trend_rows") or []
    chain = payload.get("industry_chain_clues") or []
    fundamentals = payload.get("fundamentals") or []
    supply = payload.get("supply_demand") or []
    data_status = payload.get("data_status") or {}
    lines: list[str] = ["## 趋势研判输入上下文", ""]
    lines.append("数据源约束：挖矿/回测结果不参与本 Skill 计算，若 payload 包含相关字段应忽略。")
    lines.append("")
    lines.append("### 数据同步状态")
    lines.append(f"- 行情数据同步: {_fmt(data_status.get('marketSynced'))}")
    lines.append(f"- 基本面数据同步: {_fmt(data_status.get('fundamentalsSynced'))}")
    lines.append(f"- 产业链图谱同步: {_fmt(data_status.get('industryGraphSynced'))}")
    lines.append("")
    lines.append("### 趋势候选")
    if trend_rows:
        for row in trend_rows:
            focus = "【用户关注】" if row.get("is_user_focus") else ""
            lines.append(f"- {row.get('ts_code', '-')} {row.get('name', '-')}{focus} 板块={row.get('industry', '-')} 类型={row.get('trend_type', '-')} 周期={row.get('trend_period', '-')} 累计涨跌={_fmt(row.get('interval_pct_chg'), '%')} 阶段={row.get('trend_stage', '-')}")
    else:
        lines.append("- 无成型趋势候选")
    lines.append("")
    lines.append("### 产业链与基本面线索")
    for item in chain[:20]:
        lines.append(f"- 产业链: {item.get('title') or item.get('content') or '-'} 关联={item.get('related', '-')}")
    for item in fundamentals[:20]:
        lines.append(f"- 财报/基本面: {item.get('title') or item.get('content') or '-'} 关联={item.get('ts_code') or item.get('industry') or '-'}")
    for item in supply[:20]:
        lines.append(f"- 供需: {item.get('title') or item.get('content') or '-'} 关联={item.get('industry') or '-'}")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", help="Input JSON file. Defaults to stdin.")
    args = parser.parse_args()
    text = open(args.input, "r", encoding="utf-8").read() if args.input else sys.stdin.read()
    payload = json.loads(text or "{}")
    print(build_context(payload))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
