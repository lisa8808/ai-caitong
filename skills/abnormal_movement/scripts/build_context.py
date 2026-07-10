#!/usr/bin/env python3
"""Build LLM context text for abnormal movement attribution."""

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
    abnormal_rows = payload.get("abnormal_rows") or []
    sentiment_items = payload.get("sentiment_items") or []
    user_preferences = payload.get("user_preferences") or {}
    global_market = payload.get("global_market") or {}
    data_status = payload.get("data_status") or {}

    lines: list[str] = []
    lines.append("## 异动 Skill 输入上下文")
    lines.append("数据源约束：挖矿/回测结果不参与本 Skill 计算，若 payload 包含相关字段应忽略。")
    lines.append("")
    lines.append("### 数据同步状态")
    lines.append(f"- 行情数据同步: {_fmt(data_status.get('marketSynced'))}")
    lines.append(f"- 舆情数据同步: {_fmt(data_status.get('sentimentSynced'))}")
    lines.append("")

    lines.append("### 用户关注")
    holdings = user_preferences.get("holdings") or []
    watchlist = user_preferences.get("watchlist") or []
    historical = user_preferences.get("historicalQueries") or []
    lines.append(f"- 持仓: {', '.join(holdings) if holdings else '-'}")
    lines.append(f"- 自选: {', '.join(watchlist) if watchlist else '-'}")
    lines.append(f"- 历史查询: {', '.join(historical) if historical else '-'}")
    lines.append("")

    lines.append("### 异动候选")
    if abnormal_rows:
        for row in abnormal_rows:
            focus = "【用户关注】" if row.get("is_user_focus") else ""
            lines.append(
                f"- {row.get('ts_code', '-')} {row.get('name', '-')}{focus} "
                f"板块={row.get('industry', '-')} 类型={row.get('abnormal_type', '-')} "
                f"涨跌幅={_fmt(row.get('pct_chg'), '%')} 阈值={row.get('trigger_threshold', '-')} "
                f"成交/资金={row.get('amount_or_inflow', '-')}"
            )
    else:
        lines.append("- 无结构化异动候选")
    lines.append("")

    lines.append("### 全局市场线索")
    for item in global_market.get("hotIndustries") or []:
        lines.append(f"- 热门行业: {item.get('name', '-')} 涨跌={_fmt(item.get('pct_chg'), '%')} 异动数={_fmt(item.get('abnormal_count'))}")
    for item in global_market.get("hotConcepts") or []:
        lines.append(f"- 热门概念: {item.get('name', '-')} 涨跌={_fmt(item.get('pct_chg'), '%')} 异动数={_fmt(item.get('abnormal_count'))}")
    breadth = global_market.get("marketBreadth") or {}
    if breadth:
        lines.append(
            f"- 涨跌家数: 上涨={_fmt(breadth.get('up_count'))} 下跌={_fmt(breadth.get('down_count'))} "
            f"涨停={_fmt(breadth.get('limit_up_count'))} 跌停={_fmt(breadth.get('limit_down_count'))}"
        )
    lines.append("")

    lines.append("### 清洗舆情与公告线索")
    if sentiment_items:
        for item in sentiment_items[:30]:
            code = item.get("ts_code") or "全局"
            source = item.get("source") or "清洗舆情库"
            title = item.get("title") or item.get("content") or "-"
            lines.append(f"- [{code}] {title} 来源={source} 分类={item.get('category', '-')}")
    else:
        lines.append("- 无已绑定舆情/公告线索")

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
