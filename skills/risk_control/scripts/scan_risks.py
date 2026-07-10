#!/usr/bin/env python3
"""Scan holdings/watchlist rows for risk signals based on hard thresholds."""

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


def _assess(row: dict[str, Any]) -> dict[str, Any]:
    pct_chg = _num(row.get("pct_chg")) or 0
    drawdown = _num(row.get("drawdown")) or 0
    outflow_days = int(_num(row.get("main_net_outflow_days")) or 0)
    trend_root = row.get("trend_root_status") or ""
    risk_types: list[str] = []
    level = "低"
    details: list[str] = []

    if drawdown <= -20:
        risk_types.append("趋势风险")
        details.append(f"阶段回撤 {drawdown}%")
    if outflow_days >= 3:
        risk_types.append("资金风险")
        details.append(f"连续{outflow_days}日主力净流出")
    if trend_root == "消失":
        risk_types.append("趋势风险")
        details.append("趋势底层根因消失")
    elif trend_root == "减弱":
        risk_types.append("趋势风险")
        details.append("趋势底层根因减弱")
    if pct_chg <= -7:
        risk_types.append("情绪风险")
        details.append(f"单日跌幅{pct_chg}%")
    if pct_chg >= 9:
        risk_types.append("情绪风险")
        details.append("高位极端波动，滞涨风险")

    if len(risk_types) >= 3 or trend_root == "消失":
        level = "极高"
    elif len(risk_types) == 2 or pct_chg <= -9:
        level = "高"
    elif len(risk_types) == 1:
        level = "中"

    op, logic, follow_up = (
        ("清仓止损", "趋势根因消失叠加多重风险，继续持有可能扩大回撤", "等待新的底部信号或趋势根因恢复")
        if trend_root == "消失"
        else ("清仓止损", "多重风险信号叠加", "风险信号至少2个消退后再评估")
        if level == "极高"
        else ("适度减仓", "趋势和资金双信号恶化", "趋势根因恢复或资金回流后重新评估")
        if level == "高" and "趋势风险" in risk_types and "资金风险" in risk_types
        else ("观望等待", "资金流出信号偏弱", "资金流入恢复或信号升级")
        if level == "中"
        else ("继续持有", "当前无明确风险", "关注异常波动或利空公告")
    )

    return {
        "level": level,
        "risk_types": risk_types,
        "details": details,
        "operation": op,
        "operation_logic": logic,
        "follow_up": follow_up,
    }


def scan(payload: dict[str, Any]) -> dict[str, Any]:
    rows = payload.get("holdings") or payload.get("market_rows") or []
    risk_rows: list[dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        assessed = _assess(row)
        code = str(row.get("ts_code") or row.get("code") or "")
        name = str(row.get("name") or "")
        pos = row.get("position_status") or "关注"
        risk_rows.append({
            "ts_code": code,
            "name": name,
            "position_status": pos,
            "risk_level": assessed["level"],
            "risk_types": assessed["risk_types"],
            "risk_details": assessed["details"],
            "operation": assessed["operation"],
            "operation_logic": assessed["operation_logic"],
            "follow_up": assessed["follow_up"],
            "raw": row,
        })
    risk_rows.sort(key=lambda r: {"极高": 0, "高": 1, "中": 2, "低": 3}[r["risk_level"]])
    return {"success": True, "risk_rows": risk_rows}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", help="Input JSON file. Defaults to stdin.")
    args = parser.parse_args()
    text = open(args.input, "r", encoding="utf-8").read() if args.input else sys.stdin.read()
    payload = json.loads(text or "{}")
    print(json.dumps(scan(payload), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
