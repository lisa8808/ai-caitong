#!/usr/bin/env python3
"""Normalize review context into text for report generation."""

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
    review_type = payload.get("review_type") or payload.get("reviewType") or "市场复盘"
    context = payload.get("context") or payload
    lines: list[str] = [f"## 复盘类型: {review_type}", ""]
    lines.append("数据源约束：挖矿/回测结果不参与复盘 Skill 计算，操作复盘只使用模拟交易、用户操作或真实账户上下文。")
    lines.append("")

    market = context.get("market") or {}
    if market:
        lines.append("### 市场数据")
        for idx in market.get("indexes") or []:
            lines.append(f"- {idx.get('name', '-')}: 收盘={_fmt(idx.get('close'))} 涨跌={_fmt(idx.get('pct_chg'), '%')}")
        breadth = market.get("breadth") or {}
        if breadth:
            lines.append(f"- 涨跌家数: 上涨={_fmt(breadth.get('up_count'))} 下跌={_fmt(breadth.get('down_count'))} 涨停={_fmt(breadth.get('limit_up_count'))} 跌停={_fmt(breadth.get('limit_down_count'))}")
        lines.append(f"- 成交额={_fmt(market.get('turnover_amount'))}")
        lines.append(f"- 北向净流入={_fmt(market.get('northbound_net_inflow'))}")
        lines.append("")

    sectors = context.get("sectors") or []
    if sectors:
        lines.append("### 板块数据")
        for sector in sectors:
            leaders = "、".join(sector.get("leaders") or []) or "-"
            lines.append(f"- {sector.get('name', '-')}: 涨跌={_fmt(sector.get('pct_chg'), '%')} 成交额={_fmt(sector.get('amount'))} 龙头={leaders} 驱动={sector.get('driver', '-')}")
        lines.append("")

    stocks = context.get("stocks") or []
    if stocks:
        lines.append("### 个股数据")
        for stock in stocks:
            lines.append(f"- {stock.get('ts_code', '-')} {stock.get('name', '-')}: 收盘={_fmt(stock.get('close'))} 涨跌={_fmt(stock.get('pct_chg'), '%')} 原因={stock.get('reason', '-')} 风险={stock.get('risk', '-')}")
        lines.append("")

    operations = context.get("operations") or {}
    if operations:
        source = str(operations.get("source") or operations.get("data_source") or "").lower()
        has_backtest_marker = any(key in operations for key in ("latest_backtest_id", "backtest_id", "mining_config", "strategy_score", "sharpe"))
        if source in {"backtest", "mining"} or has_backtest_marker:
            lines.append("### 操作数据")
            lines.append("- 已忽略挖矿/回测结果；操作复盘需补充模拟交易、用户操作或真实账户数据。")
        else:
            lines.append("### 操作数据")
            lines.append(f"- 交易笔数={len(operations.get('trades') or [])}")
            lines.append(f"- 盈亏={_fmt(operations.get('pnl'))}")
            lines.append(f"- 胜率={_fmt(operations.get('win_rate'), '%')}")
            lines.append(f"- 最大回撤={_fmt(operations.get('max_drawdown'), '%')}")

    if len(lines) <= 2:
        lines.append("暂无结构化复盘数据，报告中缺失项应标注待补充。")
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
